import React, { useState, useEffect } from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import Slider from '@react-native-community/slider';
import { styles } from "./styles";

interface GeneratorSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (newConfig: {
    PM2_5: [number, number];
    PM10: [number, number];
    CO: [number, number];
    passengers: [number, number];
    trains: [number, number];
    interval_sec: number;
  }) => void;
  initialConfig: {
    PM2_5: [number, number];
    PM10: [number, number];
    CO: [number, number];
    passengers: [number, number];
    trains: [number, number];
    interval_sec: number;
  };
}

const CONSTRAINTS = {
  PM2_5: { min: 0, max: 500, step: 1 },
  PM10: { min: 0, max: 1000, step: 1 },
  CO: { min: 0, max: 100, step: 0.1 },
  passengers: { min: 0, max: 500, step: 1 },
  trains: { min: 0, max: 10, step: 1 },
  interval_sec: { min: 5, max: 60, step: 5 }
};

export default function GeneratorSettingsModal({ visible, onClose, onSave, initialConfig }: GeneratorSettingsModalProps) {
  const [config, setConfig] = useState(initialConfig);

  useEffect(() => {
    if (visible) setConfig(initialConfig);
  }, [visible, initialConfig]);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const renderMultiSlider = (param: keyof typeof CONSTRAINTS, label: string) => {
    const [min, max] = config[param] as [number, number];
    const constraint = CONSTRAINTS[param];

    return (
      <View style={styles.sliderContainer} key={param}>
        <Text style={styles.label}>{label}</Text>
        <MultiSlider
          values={[min, max]}
          min={constraint.min}
          max={constraint.max}
          step={constraint.step}
          allowOverlap={false}
          snapped
          onValuesChange={(values) => setConfig(prev => ({ ...prev, [param]: [values[0], values[1]] }))}
          selectedStyle={{ backgroundColor: '#2196F3' }}
          unselectedStyle={{ backgroundColor: '#BBDEFB' }}
          containerStyle={{ height: 40 }}
        />
        <Text style={styles.rangeInfo}>
          Мін: {min.toFixed(constraint.step < 1 ? 1 : 0)} — Макс: {max.toFixed(constraint.step < 1 ? 1 : 0)}
        </Text>
      </View>
    );
  };

  const renderInterval = () => {
    const val = config.interval_sec;
    return (
      <View style={styles.sliderContainer}>
        <Text style={styles.label}>Інтервал (секунди)</Text>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={CONSTRAINTS.interval_sec.min}
          maximumValue={CONSTRAINTS.interval_sec.max}
          step={CONSTRAINTS.interval_sec.step}
          value={val}
          onValueChange={(value) => setConfig(prev => ({ ...prev, interval_sec: value }))}
          minimumTrackTintColor="#FF9800"
          maximumTrackTintColor="#FFE0B2"
        />
        <Text style={styles.rangeInfo}>{val} сек</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView>
            <Text style={styles.title}>Налаштування генерації даних</Text>
            {renderMultiSlider('PM2_5', 'PM2.5')}
            {renderMultiSlider('PM10', 'PM10')}
            {renderMultiSlider('CO', 'CO')}
            {renderMultiSlider('passengers', 'Пасажири')}
            {renderMultiSlider('trains', 'Поїзди')}
            {renderInterval()}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={onClose}>
                <Text style={styles.buttonText}>Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                <Text style={styles.buttonText}>Зберегти</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

