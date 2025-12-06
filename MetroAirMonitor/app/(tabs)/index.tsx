import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import GeneratorSettingsModal from "../modal";
import { styles } from "./../styles";

const API_URL = 'http://10.205.103.98:8000';
const screenWidth = Dimensions.get('window').width;

interface SensorData {
  PM2_5: number;
  PM10: number;
  CO: number;
  passengers: number;
  trains: number;
  timestamp: string;
}

interface Statistics {
  count?: number;
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  trend?: number;
}

interface HistoryPoint {
  value: number;
  timestamp: string;
}

interface FirebaseData {
  [key: string]: SensorData;
}

interface GeneratorConfig {
  PM2_5: [number, number];
  PM10: [number, number];
  CO: [number, number];
  passengers: [number, number];
  trains: [number, number];
  interval_sec: number;
}

const STORAGE_KEYS = {
  SENSOR_DATA: 'sensor_data',
  FIREBASE_HISTORY: 'firebase_history',
  STATISTICS: 'statistics'
};

export default function DashboardScreen() {
  const [sensorData, setSensorData] = useState<SensorData>({
    PM2_5: 0,
    PM10: 0,
    CO: 0,
    passengers: 0,
    trains: 0,
    timestamp: ''
  });
  
  const [firebaseHistory, setFirebaseHistory] = useState<FirebaseData>({});
  const [chartHistory, setChartHistory] = useState<HistoryPoint[]>([]);
  const [statistics, setStatistics] = useState<Record<string, Statistics>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<number>(24);
  const [selectedParameter, setSelectedParameter] = useState<string>('PM2_5');
  const [connectionError, setConnectionError] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [firebaseLimit, setFirebaseLimit] = useState<number>(100);

  const [generatorConfig, setGeneratorConfig] = useState<GeneratorConfig>({
    PM2_5: [0, 500],
    PM10: [0, 1000],
    CO: [0, 100],
    passengers: [0, 200],
    trains: [0, 5],
    interval_sec: 20,
  });

  const handleSaveSettings = async (newConfig: GeneratorConfig) => {
    setGeneratorConfig(newConfig);
    console.log("Нова конфігурація генератора:", newConfig);

    try {
      const response = await fetch(`${API_URL}/generator/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log("Відповідь сервера:", result);
      Alert.alert("Успіх", "Налаштування генератора оновлено на сервері.");
    } catch (error: any) {
      console.error("Помилка при збереженні конфігурації:", error.message);
      Alert.alert("Помилка", "Не вдалося оновити конфігурацію на сервері.");
    }
  };

  
  const loadFromStorage = useCallback(async () => {
    try {
      const [
        savedSensorData,
        savedFirebaseHistory,
        savedStatistics
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SENSOR_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.FIREBASE_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.STATISTICS)
      ]);

      if (savedSensorData) setSensorData(JSON.parse(savedSensorData));
      if (savedFirebaseHistory) setFirebaseHistory(JSON.parse(savedFirebaseHistory));
      if (savedStatistics) setStatistics(JSON.parse(savedStatistics));
      
      setLoading(false);
    } catch (error) {
      console.error('Помилка завантаження з AsyncStorage:', error);
      setLoading(false);
    }
  }, []);

 
  const saveToStorage = useCallback(async (data: {
    sensors?: SensorData,
    firebaseHistory?: FirebaseData,
    stats?: Record<string, Statistics>
  }) => {
    try {
      const updates = [];
      
      if (data.sensors) {
        updates.push(AsyncStorage.setItem(STORAGE_KEYS.SENSOR_DATA, JSON.stringify(data.sensors)));
        setSensorData(data.sensors);
      }
      
      if (data.firebaseHistory) {
        updates.push(AsyncStorage.setItem(STORAGE_KEYS.FIREBASE_HISTORY, JSON.stringify(data.firebaseHistory)));
        setFirebaseHistory(data.firebaseHistory);
      }
      
      if (data.stats) {
        updates.push(AsyncStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(data.stats)));
        setStatistics(data.stats);
      }
      
      if (updates.length > 0) {
        await Promise.all(updates);
      }
    } catch (error) {
      console.error('Помилка збереження в AsyncStorage:', error);
    }
  }, []);

  
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

  
  const fetchFirebaseData = useCallback(async () => {
    if (!isOnline) {
      console.log('Офлайн режим - використовуються локальні дані');
      return;
    }

    try {
      const firebaseResponse = await makeRequest(`/firebase/data?limit=${firebaseLimit}`);
      
      if (firebaseResponse && firebaseResponse.data) {
        await saveToStorage({
          firebaseHistory: firebaseResponse.data
        });
        
        
        const firebaseKeys = Object.keys(firebaseResponse.data);
        if (firebaseKeys.length > 0) {
          const latestKey = firebaseKeys[firebaseKeys.length - 1];
          const latestData = firebaseResponse.data[latestKey];
          await saveToStorage({ sensors: latestData });
        }
      }
      
      
      const statsResponse = await makeRequest(`/sensors/statistics?hours=${timeRange}`);
      await saveToStorage({ stats: statsResponse });

      setConnectionError('');
    } catch (error: any) {
      console.error('Помилка отримання даних з Firebase:', error.message);
      
      if (!loading) {
        setConnectionError('Не вдалося підключитися до Firebase. Використовуються локальні дані.');
      }
      
      
      await loadFromStorage();
    } finally {
      if (loading) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, [isOnline, timeRange, firebaseLimit, loading]);

  
  const prepareChartData = useCallback(() => {
    if (!firebaseHistory || Object.keys(firebaseHistory).length === 0) {
      setChartHistory([]);
      return;
    }

    try {
     
      const sortedEntries = Object.entries(firebaseHistory)
        .map(([key, data]) => ({
          key,
          ...data
        }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - timeRange);

      const filteredData = sortedEntries.filter(entry => 
        new Date(entry.timestamp) > cutoffTime
      );

      
      const chartData = filteredData.map(entry => ({
        value: entry[selectedParameter as keyof SensorData] as number,
        timestamp: entry.timestamp
      }));

      setChartHistory(chartData);
    } catch (error) {
      console.error('Помилка підготовки даних для графіка:', error);
      setChartHistory([]);
    }
  }, [firebaseHistory, selectedParameter, timeRange]);


  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected || false;
      setIsOnline(online);
      
      if (online) {
        setConnectionError('');
        fetchFirebaseData();
      } else {
        setConnectionError('Немає з\'єднання з інтернетом');
      }
    });
    
    loadFromStorage();
    
    return () => unsubscribe();
  }, [loadFromStorage]);

 
  useEffect(() => {
    fetchFirebaseData();
    
    const interval = setInterval(() => {
      if (isOnline) {
        fetchFirebaseData();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isOnline]);

  
  useEffect(() => {
    prepareChartData();
  }, [firebaseHistory, selectedParameter, timeRange]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFirebaseData();
  }, [fetchFirebaseData]);

 
  const generateTestData = () => {
    const now = new Date();
    const testFirebaseData: FirebaseData = {};
    
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      const key = `test_${i}`;
      testFirebaseData[key] = {
        PM2_5: 50 + Math.random() * 100,
        PM10: 100 + Math.random() * 80,
        CO: 15 + Math.random() * 20,
        passengers: Math.floor(Math.random() * 200),
        trains: Math.floor(Math.random() * 3),
        timestamp: time.toISOString()
      };
    }
    
    const testSensorData: SensorData = {
      PM2_5: 75 + Math.random() * 50,
      PM10: 120 + Math.random() * 80,
      CO: 15 + Math.random() * 20,
      passengers: Math.floor(Math.random() * 200),
      trains: Math.floor(Math.random() * 3),
      timestamp: now.toISOString()
    };
    
    const testStats = {
      PM2_5: {
        count: 24,
        mean: 85.5,
        median: 82.3,
        min: 52.1,
        max: 145.7,
        trend: 12.3
      }
    };
    
    saveToStorage({
      sensors: testSensorData,
      firebaseHistory: testFirebaseData,
      stats: testStats
    });
    
    Alert.alert('Тестові дані', 'Тестові дані завантажено. Додаток працює в офлайн режимі.');
  };

  
  const renderParameterSelector = () => (
    <View style={styles.parameterSelector}>
      <Text style={styles.selectorTitle}>Параметр:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {['PM2_5', 'PM10', 'CO', 'passengers', 'trains'].map(param => (
          <TouchableOpacity
            key={param}
            style={[
              styles.parameterButton,
              selectedParameter === param && styles.parameterButtonActive
            ]}
            onPress={() => setSelectedParameter(param)}
          >
            <Text style={[
              styles.parameterText,
              selectedParameter === param && styles.parameterTextActive
            ]}>
              {param === 'PM2_5' ? 'PM2.5' : 
               param === 'PM10' ? 'PM10' :
               param === 'CO' ? 'CO' :
               param === 'passengers' ? 'Пасажири' : 'Потяги'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Завантаження даних...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
    
      {connectionError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{connectionError}</Text>
          <TouchableOpacity style={styles.testButton} onPress={generateTestData}>
            <Text style={styles.testButtonText}>Використати тестові дані</Text>
          </TouchableOpacity>
          <Text style={styles.serverInfo}>
            Сервер: {API_URL}
            {'\n'}
            Статус: {isOnline ? 'Онлайн' : 'Офлайн'}
          </Text>
        </View>
      ) : null}

      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]} />
        <Text style={styles.statusText}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Поточні показники</Text>
        <View style={styles.sensorGrid}>
          <View style={styles.sensorItem}>
            <Text style={styles.sensorLabel}>PM2.5</Text>
            <Text style={[
              styles.sensorValue, 
              sensorData.PM2_5 > 150 ? styles.warning : styles.normal
            ]}>
              {sensorData.PM2_5.toFixed(1)} µg/m³
            </Text>
          </View>
          <View style={styles.sensorItem}>
            <Text style={styles.sensorLabel}>PM10</Text>
            <Text style={[
              styles.sensorValue,
              sensorData.PM10 > 300 ? styles.warning : styles.normal
            ]}>
              {sensorData.PM10.toFixed(1)} µg/m³
            </Text>
          </View>
          <View style={styles.sensorItem}>
            <Text style={styles.sensorLabel}>CO</Text>
            <Text style={[
              styles.sensorValue,
              sensorData.CO > 30 ? styles.warning : styles.normal
            ]}>
              {sensorData.CO.toFixed(1)} ppm
            </Text>
          </View>
        </View>
        <Text style={styles.timestamp}>
          Останнє оновлення: {sensorData.timestamp ? new Date(sensorData.timestamp).toLocaleTimeString() : 'Немає даних'}
        </Text>
      </View>

      <View style={{ margin: 5, alignItems: 'flex-end' }}>
        <TouchableOpacity 
          onPress={() => setModalVisible(true)}
          style={{
            paddingHorizontal: 12,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          <Ionicons name="settings-outline" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      
      <GeneratorSettingsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveSettings}
        initialConfig={generatorConfig}
      />

      <StatusBar style="auto" />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Графік {selectedParameter === 'PM2_5' ? 'PM2.5' : 
                  selectedParameter === 'PM10' ? 'PM10' :
                  selectedParameter === 'CO' ? 'CO' :
                  selectedParameter === 'passengers' ? 'пасажирів' : 'потягів'}
        </Text>

        {renderParameterSelector()}

        {chartHistory.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <LineChart
              data={{
                labels: chartHistory.map(item =>
                  new Date(item.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                ),
                datasets: [{
                  data: chartHistory.map(item => item.value)
                }]
              }}
              width={Math.max(chartHistory.length * 70, screenWidth)}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: selectedParameter === 'passengers' || selectedParameter === 'trains' ? 0 : 1,
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              bezier
              style={styles.chart}
              fromZero={selectedParameter === 'passengers' || selectedParameter === 'trains'}
            />
          </ScrollView>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>Немає даних для графіку</Text>
            <Text style={styles.noDataSubtext}>
              Кількість записів у Firebase: {Object.keys(firebaseHistory).length}
            </Text>
            <TouchableOpacity style={styles.smallButton} onPress={generateTestData}>
              <Text style={styles.smallButtonText}>Завантажити тестові дані</Text>
            </TouchableOpacity>
          </View>
        )}

        
        <View style={styles.timeRangeSelector}>
          {[1, 6, 12, 24].map(hours => (
            <TouchableOpacity
              key={hours}
              style={[
                styles.timeRangeButton,
                timeRange === hours && styles.timeRangeButtonActive
              ]}
              onPress={() => setTimeRange(hours)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === hours && styles.timeRangeTextActive
                ]}
              >
                {hours}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Статистика (24h)</Text>
        {statistics.PM2_5 ? (
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Середнє</Text>
              <Text style={styles.statValue}>
                {statistics.PM2_5.mean?.toFixed(1) || '0.0'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Медіана</Text>
              <Text style={styles.statValue}>
                {statistics.PM2_5.median?.toFixed(1) || '0.0'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Тренд</Text>
              <Text style={[
                styles.statValue,
                (statistics.PM2_5.trend || 0) > 0 ? styles.trendUp : styles.trendDown
              ]}>
                {(statistics.PM2_5.trend || 0).toFixed(1)}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noDataText}>Немає статистичних даних</Text>
        )}
      </View>

      
    </ScrollView>
  );
}