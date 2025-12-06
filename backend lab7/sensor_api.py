from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional
import statistics

import firebase_admin
from firebase_admin import credentials, db, firestore

app = FastAPI()

# Додаємо CORS для Expo додатка
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Для тесту, в продакшені обмежити
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Конфігурація ---
class Config(BaseModel):
    pm25_threshold: float = 250.0
    pm10_threshold: float = 500.0
    co_threshold: float = 50.0
    auto_control: bool = True

class GeneratorConfig(BaseModel):
    PM2_5: List[float] = [0, 500]     # min, max
    PM10: List[float] = [0, 1000]
    CO: List[float] = [0, 100]
    passengers: List[int] = [0, 200]
    trains: List[int] = [0, 5]
    interval_sec: int = 20  # інтервал генерації в секундах


# Початкова конфігурація
config = Config()
generator_config = GeneratorConfig()

# --- Емуляція сенсорів з історією ---
sensor_history = {
    "PM2_5": [],
    "PM10": [],
    "CO": [],
    "passengers": [],
    "trains": []
}
MAX_HISTORY = 1000

# Початкові дані
sensor_data = {
    "PM2_5": 50,
    "PM10": 100,
    "CO": 10,
    "passengers": 100,
    "trains": 1,
    "timestamp": datetime.now().isoformat()
}

# --- Стан пристроїв ---
device_state = {
    "HEPA": 1,
    "Fans": 1,
    "ExtraFans": False,
    "last_updated": datetime.now().isoformat()
}

# --- Моделі ---
class DeviceUpdate(BaseModel):
    HEPA: Optional[int] = None
    Fans: Optional[int] = None
    ExtraFans: Optional[bool] = None

class SensorData(BaseModel):
    PM2_5: float
    PM10: float
    CO: float
    passengers: int
    trains: int
    timestamp: str

class ControlRule(BaseModel):
    parameter: str  # PM2_5, PM10, CO
    threshold: float
    action: dict  # {"HEPA": 3, "Fans": 3, "ExtraFans": True}
    enabled: bool = True

# --- Підключення до Firebase ---
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://metroairmonitoring-default-rtdb.firebaseio.com/'
    })
    firebase_connected = True
    firestore_db = firestore.client()
except:
    firebase_connected = False
    print("Firebase connection failed")

# --- Функції для роботи з даними ---
def add_to_history():
    """Додає поточні дані до історії"""
    for key in sensor_history:
        if key in sensor_data:
            sensor_history[key].append({
                "value": sensor_data[key],
                "timestamp": sensor_data["timestamp"]
            })
            # Обмежуємо розмір історії
            if len(sensor_history[key]) > MAX_HISTORY:
                sensor_history[key].pop(0)

def get_statistics(parameter: str, hours: int = 24):
    """Повертає статистику за останні N годин"""
    now = datetime.now()
    cutoff = now - timedelta(hours=hours)
    
    data_points = [
        point["value"] for point in sensor_history.get(parameter, [])
        if datetime.fromisoformat(point["timestamp"]) > cutoff
    ]
    
    if not data_points:
        return None
    
    return {
        "count": len(data_points),
        "mean": statistics.mean(data_points),
        "median": statistics.median(data_points),
        "min": min(data_points),
        "max": max(data_points),
        "trend": data_points[-1] - data_points[0] if len(data_points) > 1 else 0
    }

def push_sensor_data_to_firebase():
    """Надсилає дані в Firebase Realtime Database"""
    if not firebase_connected:
        return
    
    try:
        # Realtime Database
        ref = db.reference('/sensors')
        ref.push(sensor_data)
    except Exception as e:
        print(f"Firebase error: {e}")


def apply_auto_control():
    """Застосовує автоматичне керування на основі правил"""
    if not config.auto_control:
        return
    
    # Правила керування
    if sensor_data["PM2_5"] > config.pm25_threshold:
        device_state["HEPA"] = 3
    else:
        device_state["HEPA"] = 1
    
    if sensor_data["PM10"] > config.pm10_threshold:
        device_state["Fans"] = 3
    else:
        device_state["Fans"] = 1
    
    if sensor_data["CO"] > config.co_threshold:
        device_state["ExtraFans"] = True
    else:
        device_state["ExtraFans"] = False
    
    device_state["last_updated"] = datetime.now().isoformat()

async def sensor_emulator():
    """Генерує реалістичні дані сенсорів"""
    while True:
        # Використовуємо діапазони з generator_config
        sensor_data["passengers"] = random.randint(*generator_config.passengers)
        sensor_data["trains"] = random.randint(*generator_config.trains)
        
        base_pm25 = 50 + sensor_data["passengers"] * 0.5
        sensor_data["PM2_5"] = min(max(
            random.uniform(*generator_config.PM2_5) + base_pm25, generator_config.PM2_5[0]
        ), generator_config.PM2_5[1])
        
        base_pm10 = 100 + sensor_data["trains"] * 40
        sensor_data["PM10"] = min(max(
            random.uniform(*generator_config.PM10) + base_pm10, generator_config.PM10[0]
        ), generator_config.PM10[1])
        
        base_co = 5 + sensor_data["trains"] * 12
        if random.random() < 0.05:
            base_co *= random.uniform(2, 5)
        sensor_data["CO"] = min(max(random.uniform(*generator_config.CO) + base_co, generator_config.CO[0]), generator_config.CO[1])
        
        sensor_data["timestamp"] = datetime.now().isoformat()
        
        add_to_history()
        apply_auto_control()
        push_sensor_data_to_firebase()
        
        await asyncio.sleep(generator_config.interval_sec)

# --- Запуск емулятора ---
@app.on_event("startup")
async def start_sensor_emulator():
    asyncio.create_task(sensor_emulator())

# --- API ендпоінти ---
@app.get("/")
async def root():
    return {"message": "Metro Air Monitoring API", "status": "running"}

@app.get("/sensors")
async def get_sensors():
    """Отримати поточні дані сенсорів"""
    return sensor_data

@app.get("/sensors/history")
async def get_sensor_history(
    parameter: str,
    hours: int = 24,
    limit: int = 100
):
    """Отримати історію даних"""
    if parameter not in sensor_history:
        raise HTTPException(status_code=400, detail="Invalid parameter")
    
    cutoff = datetime.now() - timedelta(hours=hours)
    history = [
        point for point in sensor_history[parameter]
        if datetime.fromisoformat(point["timestamp"]) > cutoff
    ][-limit:]
    
    return {
        "parameter": parameter,
        "data": history,
        "statistics": get_statistics(parameter, hours)
    }

@app.get("/sensors/statistics")
async def get_sensor_statistics(hours: int = 24):
    """Отримати статистику по всім сенсорам"""
    stats = {}
    for param in ["PM2_5", "PM10", "CO"]:
        stats[param] = get_statistics(param, hours)
    return stats

@app.get("/devices")
async def get_devices():
    """Отримати стан пристроїв"""
    return device_state

@app.post("/devices")
async def update_devices(update: DeviceUpdate):
    """Оновити стан пристроїв"""
    if update.HEPA is not None:
        device_state["HEPA"] = max(1, min(update.HEPA, 3))
    if update.Fans is not None:
        device_state["Fans"] = max(1, min(update.Fans, 3))
    if update.ExtraFans is not None:
        device_state["ExtraFans"] = update.ExtraFans
    
    device_state["last_updated"] = datetime.now().isoformat()
    return device_state

@app.get("/config")
async def get_config():
    """Отримати поточну конфігурацію"""
    return config.dict()

@app.post("/config")
async def update_config(new_config: Config):
    """Оновити конфігурацію"""
    global config
    config = new_config
    return {"message": "Configuration updated", "config": config.dict()}

@app.get("/firebase/status")
async def get_firebase_status():
    """Перевірити статус Firebase"""
    return {
        "connected": firebase_connected,
        "last_update": datetime.now().isoformat()
    }

@app.post("/firebase/sync")
async def sync_to_firebase():
    """Примусова синхронізація з Firebase"""
    if not firebase_connected:
        raise HTTPException(status_code=500, detail="Firebase not connected")
    
    push_sensor_data_to_firebase()
    return {"message": "Data synced to Firebase"}

@app.get("/firebase/data")
async def get_firebase_data(limit: int = 100):
    """Отримати дані з Firebase"""
    if not firebase_connected:
        raise HTTPException(status_code=500, detail="Firebase not connected")
    
    try:
        ref = db.reference('/sensors')
        data = ref.order_by_key().limit_to_last(limit).get()
        return {"data": data if data else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket для реального часу
from fastapi import WebSocket
import json

connected_clients = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    
    try:
        while True:
            # Надсилаємо оновлення кожні 2 секунди
            await asyncio.sleep(10)
            data = {
                "sensors": sensor_data,
                "devices": device_state,
                "timestamp": datetime.now().isoformat()
            }
            await websocket.send_json(data)
    except:
        connected_clients.remove(websocket)


@app.get("/generator/config")
async def get_generator_config():
    """Отримати поточні налаштування генератора"""
    return generator_config.dict()

@app.post("/generator/config")
async def update_generator_config(new_config: GeneratorConfig):
    """Оновити налаштування генератора"""
    global generator_config
    generator_config = new_config
    return {"message": "Generator configuration updated", "config": generator_config.dict()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

    