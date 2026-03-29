import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchSleepSettings,
  updateSleepGoal,
  updateSmartWakeup,
} from '../store/slices/sleepSlice';
import {
  fetchWhiteNoiseSettings,
  toggleWhiteNoise,
  updateWhiteNoiseVolume,
} from '../store/slices/whiteNoiseSlice';

const SleepAnalysisSettings = ({ alarmData, onSleepSettingsChange }) => {
  const dispatch = useDispatch();
  
  // 从Redux获取睡眠设置
  const sleepSettings = useSelector(state => state.sleep?.settings || {});
  const whiteNoiseSettings = useSelector(state => state.whiteNoise?.settings || {});
  const whiteNoiseList = useSelector(state => state.whiteNoise?.list || []);
  
  // 本地状态
  const [sleepGoal, setLocalSleepGoal] = useState(sleepSettings.sleepGoal || 8);
  const [smartWakeupEnabled, setSmartWakeupEnabled] = useState(
    sleepSettings.smartWakeupEnabled || false
  );
  const [whiteNoiseEnabled, setWhiteNoiseEnabled] = useState(
    whiteNoiseSettings.enabled || false
  );
  const [whiteNoiseVolume, setLocalWhiteNoiseVolume] = useState(
    whiteNoiseSettings.volume || 0.5
  );
  const [selectedWhiteNoise, setSelectedWhiteNoise] = useState(
    whiteNoiseSettings.selectedNoise || 'rain'
  );

  // 初始化数据
  useEffect(() => {
    dispatch(fetchSleepSettings());
    dispatch(fetchWhiteNoiseSettings());
  }, [dispatch]);

  // 更新睡眠目标
  const handleSleepGoalChange = async (value) => {
    setLocalSleepGoal(value);
    await dispatch(updateSleepGoal(value));
    
    // 通知父组件
    if (onSleepSettingsChange) {
      onSleepSettingsChange({
        sleepGoal: value,
        smartWakeupEnabled,
        whiteNoiseEnabled,
        whiteNoiseVolume,
        selectedWhiteNoise,
      });
    }
  };

  // 切换智能唤醒
  const handleSmartWakeupToggle = async (value) => {
    setSmartWakeupEnabled(value);
    await dispatch(updateSmartWakeup(value));
    
    // 通知父组件
    if (onSleepSettingsChange) {
      onSleepSettingsChange({
        sleepGoal,
        smartWakeupEnabled: value,
        whiteNoiseEnabled,
        whiteNoiseVolume,
        selectedWhiteNoise,
      });
    }
  };

  // 切换白噪音
  const handleWhiteNoiseToggle = async () => {
    const newEnabled = !whiteNoiseEnabled;
    setWhiteNoiseEnabled(newEnabled);
    
    await dispatch(toggleWhiteNoise({
      noiseId: selectedWhiteNoise,
      volume: whiteNoiseVolume,
    }));
    
    // 通知父组件
    if (onSleepSettingsChange) {
      onSleepSettingsChange({
        sleepGoal,
        smartWakeupEnabled,
        whiteNoiseEnabled: newEnabled,
        whiteNoiseVolume,
        selectedWhiteNoise,
      });
    }
  };

  // 更新白噪音音量
  const handleWhiteNoiseVolumeChange = async (value) => {
    setLocalWhiteNoiseVolume(value);
    await dispatch(updateWhiteNoiseVolume(value));
    
    // 通知父组件
    if (onSleepSettingsChange) {
      onSleepSettingsChange({
        sleepGoal,
        smartWakeupEnabled,
        whiteNoiseEnabled,
        whiteNoiseVolume: value,
        selectedWhiteNoise,
      });
    }
  };

  // 选择白噪音类型
  const handleSelectWhiteNoise = async (noiseId) => {
    setSelectedWhiteNoise(noiseId);
    
    // 如果白噪音正在播放，切换到新的类型
    if (whiteNoiseEnabled) {
      await dispatch(toggleWhiteNoise({
        noiseId: noiseId,
        volume: whiteNoiseVolume,
      }));
    }
    
    // 通知父组件
    if (onSleepSettingsChange) {
      onSleepSettingsChange({
        sleepGoal,
        smartWakeupEnabled,
        whiteNoiseEnabled,
        whiteNoiseVolume,
        selectedWhiteNoise: noiseId,
      });
    }
  };

  // 白噪音图标映射
  const getWhiteNoiseIcon = (noiseId) => {
    const iconMap = {
      'rain': 'water-drop',
      'thunder': 'flash-on',
      'wind': 'air',
      'waves': 'waves',
      'forest': 'park',
      'birds': 'emoji-nature',
      'fireplace': 'whatshot',
      'fan': 'toys',
      'white': 'filter-drama',
      'pink': 'color-lens',
    };
    return iconMap[noiseId] || 'music-note';
  };

  // 白噪音颜色映射
  const getWhiteNoiseColor = (noiseId) => {
    const colorMap = {
      'rain': '#2196F3',
      'thunder': '#9C27B0',
      'wind': '#4CAF50',
      'waves': '#03A9F4',
      'forest': '#8BC34A',
      'birds': '#FF9800',
      'fireplace': '#F44336',
      'fan': '#607D8B',
      'white': '#E0E0E0',
      'pink': '#E91E63',
    };
    return colorMap[noiseId] || '#9E9E9E';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>睡眠分析设置</Text>
      
      {/* 睡眠目标 */}
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Icon name="bedtime" size={24} color="#5D3FD3" />
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>睡眠目标</Text>
            <Text style={styles.settingDescription}>
              建议每天睡 {sleepGoal} 小时
            </Text>
          </View>
        </View>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={4}
            maximumValue={12}
            step={0.5}
            value={sleepGoal}
            onValueChange={handleSleepGoalChange}
            minimumTrackTintColor="#5D3FD3"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#5D3FD3"
          />
          <Text style={styles.sliderValue}>{sleepGoal.toFixed(1)}h</Text>
        </View>
      </View>

      {/* 智能唤醒 */}
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Icon name="alarm" size={24} color="#5D3FD3" />
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>智能唤醒</Text>
            <Text style={styles.settingDescription}>
              在浅睡阶段唤醒，减少起床困难
            </Text>
          </View>
        </View>
        <Switch
          value={smartWakeupEnabled}
          onValueChange={handleSmartWakeupToggle}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={smartWakeupEnabled ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>

      {/* 白噪音设置 */}
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Icon name="waves" size={24} color="#5D3FD3" />
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>白噪音助眠</Text>
            <Text style={styles.settingDescription}>
              帮助放松入睡，提高睡眠质量
            </Text>
          </View>
        </View>
        <Switch
          value={whiteNoiseEnabled}
          onValueChange={handleWhiteNoiseToggle}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={whiteNoiseEnabled ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>

      {/* 白噪音详情（仅在启用时显示） */}
      {whiteNoiseEnabled && (
        <View style={styles.whiteNoiseDetails}>
          {/* 音量控制 */}
          <View style={styles.volumeControl}>
            <Icon name="volume-down" size={20} color="#666" />
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={whiteNoiseVolume}
              onValueChange={handleWhiteNoiseVolumeChange}
              minimumTrackTintColor="#5D3FD3"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#5D3FD3"
            />
            <Icon name="volume-up" size={20} color="#666" />
            <Text style={styles.volumeValue}>
              {Math.round(whiteNoiseVolume * 100)}%
            </Text>
          </View>

          {/* 白噪音类型选择 */}
          <Text style={styles.whiteNoiseTitle}>选择白噪音类型</Text>
          <View style={styles.whiteNoiseGrid}>
            {whiteNoiseList.slice(0, 6).map((noise) => (
              <TouchableOpacity
                key={noise.id}
                style={[
                  styles.whiteNoiseOption,
                  selectedWhiteNoise === noise.id && styles.whiteNoiseOptionSelected,
                ]}
                onPress={() => handleSelectWhiteNoise(noise.id)}
              >
                <Icon
                  name={getWhiteNoiseIcon(noise.id)}
                  size={24}
                  color={getWhiteNoiseColor(noise.id)}
                />
                <Text style={[
                  styles.whiteNoiseName,
                  selectedWhiteNoise === noise.id && styles.whiteNoiseNameSelected,
                ]}>
                  {noise.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 睡眠建议 */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 睡眠建议</Text>
        <View style={styles.tipItem}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.tipText}>
            睡前1小时避免使用电子设备
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.tipText}>
            保持卧室温度在18-22°C
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.tipText}>
            睡前可以尝试冥想或深呼吸
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  slider: {
    flex: 1,
  },
  sliderValue: {
    fontSize: 14,
    color: '#5D3FD3',
    fontWeight: 'bold',
    marginLeft: 8,
    minWidth: 40,
    textAlign: 'right',
  },
  whiteNoiseDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 8,
  },
  volumeValue: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    minWidth: 40,
  },
  whiteNoiseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  whiteNoiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  whiteNoiseOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  whiteNoiseOptionSelected: {
    borderColor: '#5D3FD3',
    backgroundColor: '#F5F9FF',
  },
  whiteNoiseName: {
    fontSize: 12,
    color: '#333',
    marginLeft: 8,
  },
  whiteNoiseNameSelected: {
    color: '#5D3FD3',
    fontWeight: 'bold',
  },
  tipsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
});

export default SleepAnalysisSettings;