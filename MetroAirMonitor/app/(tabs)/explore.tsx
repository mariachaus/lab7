import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

import { styles } from "./../styles";

const API_URL = 'http://10.205.103.98:8000';

// Типи
interface DeviceState {
  HEPA: number;
  Fans: number;
  ExtraFans: boolean;
  last_updated: string;
}

interface Config {
  pm25_threshold: number;
  pm10_threshold: number;
  co_threshold: number;
  auto_control: boolean;
}

const STORAGE_KEYS = {
  DEVICE_STATE: 'device_state',
  CONFIG: 'config'
};

export default function DevicesScreen() {
  const [deviceState, setDeviceState] = useState<DeviceState>({
    HEPA: 1,
    Fans: 1,
    ExtraFans: false,
    last_updated: ''
  });
  
  const [config, setConfig] = useState<Config>({
    pm25_threshold: 250,
    pm10_threshold: 500,
    co_threshold: 50,
    auto_control: true
  });
  
  const [isOnline, setIsOnline] = useState<boolean>(false);

  
  const loadFromStorage = useCallback(async () => {
    try {
      const [
        savedDeviceState,
        savedConfig
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DEVICE_STATE),
        AsyncStorage.getItem(STORAGE_KEYS.CONFIG)
      ]);

      if (savedDeviceState) setDeviceState(JSON.parse(savedDeviceState));
      if (savedConfig) setConfig(JSON.parse(savedConfig));
    } catch (error) {
      console.error('Помилка завантаження з AsyncStorage:', error);
    }
  }, []);

  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected || false);
    });
    
    loadFromStorage();
    
    return () => unsubscribe();
  }, [loadFromStorage]);

  
  const makeRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error(`Помилка запиту до ${endpoint}:`, error.message);
      throw error;
    }
  };

  
  const updateDevice = async (device: keyof DeviceState, value: number | boolean) => {
    const newState = { ...deviceState, [device]: value, last_updated: new Date().toISOString() };
    
    
    setDeviceState(newState);
    
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_STATE, JSON.stringify(newState));
    } catch (error) {
      console.error('Помилка збереження пристроїв:', error);
    }
    
   
    if (isOnline) {
      try {
        await makeRequest('/devices', 'POST', newState);
        Alert.alert('Успішно', 'Налаштування пристроїв оновлено на сервері');
      } catch (error) {
        Alert.alert(
          'Помилка',
          'Не вдалося синхронізувати з сервером. Зміни збережено локально.',
          [{ text: 'OK' }]
        );
      }
    } else {
      Alert.alert(
        'Офлайн режим',
        'Зміни збережено локально. Синхронізація відбудеться при відновленні з\'єднання.',
        [{ text: 'OK' }]
      );
    }
  };

  
  const updateConfig = async (key: keyof Config, value: number | boolean) => {
    const newConfig = { ...config, [key]: value };
    
    
    setConfig(newConfig);
    
   
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
    } catch (error) {
      console.error('Помилка збереження конфігурації:', error);
    }
    
  
    if (isOnline) {
      try {
        await makeRequest('/config', 'POST', newConfig);
        Alert.alert('Успішно', 'Налаштування конфігурації оновлено на сервері');
      } catch (error) {
        Alert.alert(
          'Помилка',
          'Не вдалося синхронізувати з сервером. Зміни збережено локально.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  
  const resetToDefaults = () => {
    Alert.alert(
      'Скидання налаштувань',
      'Ви впевнені, що хочете скинути всі налаштування до значень за замовчуванням?',
      [
        { text: 'Скасувати', style: 'cancel' },
        { 
          text: 'Скинути', 
          style: 'destructive',
          onPress: () => {
            const defaultState: DeviceState = {
              HEPA: 1,
              Fans: 1,
              ExtraFans: false,
              last_updated: new Date().toISOString()
            };
            
            const defaultConfig: Config = {
              pm25_threshold: 250,
              pm10_threshold: 500,
              co_threshold: 50,
              auto_control: true
            };
            
            setDeviceState(defaultState);
            setConfig(defaultConfig);
            
            
            AsyncStorage.multiSet([
              [STORAGE_KEYS.DEVICE_STATE, JSON.stringify(defaultState)],
              [STORAGE_KEYS.CONFIG, JSON.stringify(defaultConfig)]
            ]);
            
            Alert.alert('Успішно', 'Налаштування скинуто до значень за замовчуванням');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]} />
        <Text style={styles.statusText}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
        <Text style={styles.statusInfo}>
          {isOnline ? 'Синхронізовано з сервером' : 'Локальний режим'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Керування пристроями</Text>
        
        <View style={styles.deviceControl}>
          <Text style={styles.deviceLabel}>HEPA фільтр</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={3}
              step={1}
              value={deviceState.HEPA}
              onValueChange={(value: number) => updateDevice('HEPA', Math.round(value))}
              minimumTrackTintColor="#2196F3"
              maximumTrackTintColor="#BBDEFB"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Низький</Text>
              <Text style={styles.sliderLabel}>Середній</Text>
              <Text style={styles.sliderLabel}>Високий</Text>
            </View>
          </View>
          <Text style={styles.deviceValue}>Рівень: {deviceState.HEPA}</Text>
        </View>

        <View style={styles.deviceControl}>
          <Text style={styles.deviceLabel}>Вентилятори</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={3}
              step={1}
              value={deviceState.Fans}
              onValueChange={(value: number) => updateDevice('Fans', Math.round(value))}
              minimumTrackTintColor="#2196F3"
              maximumTrackTintColor="#BBDEFB"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Низький</Text>
              <Text style={styles.sliderLabel}>Середній</Text>
              <Text style={styles.sliderLabel}>Високий</Text>
            </View>
          </View>
          <Text style={styles.deviceValue}>Рівень: {deviceState.Fans}</Text>
        </View>

        <View style={styles.deviceControl}>
          <Text style={styles.deviceLabel}>Додаткові вентилятори</Text>
          <Switch
            value={deviceState.ExtraFans}
            onValueChange={(value: boolean) => updateDevice('ExtraFans', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={deviceState.ExtraFans ? '#2196F3' : '#f4f3f4'}
          />
          <Text style={styles.deviceValue}>
            Стан: {deviceState.ExtraFans ? 'Включено' : 'Вимкнено'}
          </Text>
        </View>

        {deviceState.last_updated && (
          <Text style={styles.lastUpdated}>
            Останнє оновлення: {new Date(deviceState.last_updated).toLocaleString()}
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Правила автоматичного керування</Text>
          <TouchableOpacity onPress={resetToDefaults}>
            <Text style={styles.resetButton}>Скинути</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.ruleItem}>
          <Text style={styles.ruleLabel}>Автоматичне керування</Text>
          <Switch
            value={config.auto_control}
            onValueChange={(value: boolean) => updateConfig('auto_control', value)}
          />
          <Text style={styles.ruleDescription}>
            {config.auto_control 
              ? 'Пристрої керуються автоматично на основі даних сенсорів' 
              : 'Пристрої керуються вручну'}
          </Text>
        </View>

        <View style={styles.ruleItem}>
          <Text style={styles.ruleLabel}>PM2.5 поріг: {config.pm25_threshold} µg/m³</Text>
          <Slider
            style={styles.ruleSlider}
            minimumValue={50}
            maximumValue={500}
            step={10}
            value={config.pm25_threshold}
            onValueChange={(value: number) => updateConfig('pm25_threshold', value)}
            minimumTrackTintColor="#FF9800"
            maximumTrackTintColor="#FFE0B2"
          />
          <Text style={styles.ruleDescription}>
            HEPA фільтр перемикається на високий рівень при перевищенні цього порогу
          </Text>
        </View>

        <View style={styles.ruleItem}>
          <Text style={styles.ruleLabel}>PM10 поріг: {config.pm10_threshold} µg/m³</Text>
          <Slider
            style={styles.ruleSlider}
            minimumValue={100}
            maximumValue={1000}
            step={50}
            value={config.pm10_threshold}
            onValueChange={(value: number) => updateConfig('pm10_threshold', value)}
            minimumTrackTintColor="#FF9800"
            maximumTrackTintColor="#FFE0B2"
          />
          <Text style={styles.ruleDescription}>
            Вентилятори перемикаються на високий рівень при перевищенні цього порогу
          </Text>
        </View>

        <View style={styles.ruleItem}>
          <Text style={styles.ruleLabel}>CO поріг: {config.co_threshold} ppm</Text>
          <Slider
            style={styles.ruleSlider}
            minimumValue={10}
            maximumValue={100}
            step={5}
            value={config.co_threshold}
            onValueChange={(value: number) => updateConfig('co_threshold', value)}
            minimumTrackTintColor="#FF9800"
            maximumTrackTintColor="#FFE0B2"
          />
          <Text style={styles.ruleDescription}>
            Додаткові вентилятори включаються при перевищенні цього порогу
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Увага</Text>
        <Text style={styles.infoText}>
          • Зміни зберігаються локально на пристрої
          {'\n'}
          • При наявності інтернету дані синхронізуються з сервером
          {'\n'}
          • Автоматичне керування працює на основі встановлених порогів
          {'\n'}
          • У разі відсутності з'єднання використовуються локальні налаштування
        </Text>
      </View>
    </ScrollView>
  );
}
