import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { 
  startSleepTracking, 
  stopSleepTracking, 
  getSleepAnalysis,
  getSleepStatistics,
  setSleepGoal,
  setSmartWakeup
} from '../services/sleepAnalysisService';
import { 
  startWhiteNoise, 
  stopWhiteNoise, 
  getWhiteNoiseList,
  setWhiteNoiseVolume
} from '../services/whiteNoiseService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SleepAnalysisScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // 从Redux获取睡眠数据
  const sleepData = useSelector(state => state.sleep?.data || {});
  const sleepSettings = useSelector(state => state.sleep?.settings || {});
  const whiteNoiseSettings = useSelector(state => state.whiteNoise?.settings || {});
  
  // 本地状态
  const [isTracking, setIsTracking] = useState(false);
  const [sleepGoal, setLocalSleepGoal] = useState(sleepSettings.sleepGoal || 8);
  const [smartWakeupEnabled, setSmartWakeupEnabled] = useState(sleepSettings.smartWakeupEnabled || false);
  const [whiteNoiseEnabled, setWhiteNoiseEnabled] = useState(whiteNoiseSettings.enabled || false);
  const [whiteNoiseVolume, setLocalWhiteNoiseVolume] = useState(whiteNoiseSettings.volume || 0.5);
  const [selectedWhiteNoise, setSelectedWhiteNoise] = useState(whiteNoiseSettings.selectedNoise || 'rain');
  const [sleepStatistics, setSleepStatistics] = useState({});
  const [sleepChartData, setSleepChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [7, 6.5, 7.5, 8, 7, 8.5, 9]
    }]
  });
  const [whiteNoiseList, setWhiteNoiseList] = useState([]);

  // 初始化数据
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // 获取睡眠统计
      const stats = await getSleepStatistics();
      setSleepStatistics(stats);
      
      // 获取白噪音列表
      const noises = await getWhiteNoiseList();
      setWhiteNoiseList(noises);
      
      // 获取当前睡眠跟踪状态
      const currentTrackingStatus = sleepData.isTracking || false;
      setIsTracking(currentTrackingStatus);
      
      // 更新图表数据
      updateChartData(stats);
    } catch (error) {
      console.error('加载睡眠数据失败:', error);
    }
  };

  const updateChartData = (stats) => {
    if (stats.last7Days && stats.last7Days.length > 0) {
      const labels = stats.last7Days.map(day => day.day.substring(0, 3));
      const data = stats.last7Days.map(day => day.totalSleepHours);
      
      setSleepChartData({
        labels,
        datasets: [{
          data,
          color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
          strokeWidth: 2
        }]
      });
    }
  };

  // 开始/停止睡眠跟踪
  const toggleSleepTracking = async () => {
    try {
      if (isTracking) {
        await stopSleepTracking();
        setIsTracking(false);
        Alert.alert('睡眠跟踪已停止', '睡眠数据已保存');
        
        // 重新加载统计
        const stats = await getSleepStatistics();
        setSleepStatistics(stats);
        updateChartData(stats);
      } else {
        await startSleepTracking();
        setIsTracking(true);
        Alert.alert('睡眠跟踪已开始', '正在监测您的睡眠...');
      }
    } catch (error) {
      Alert.alert('错误', '操作失败: ' + error.message);
    }
  };

  // 切换白噪音
  const toggleWhiteNoise = async () => {
    try {
      if (whiteNoiseEnabled) {
        await stopWhiteNoise();
        setWhiteNoiseEnabled(false);
      } else {
        await startWhiteNoise(selectedWhiteNoise, whiteNoiseVolume);
        setWhiteNoiseEnabled(true);
      }
    } catch (error) {
      Alert.alert('错误', '切换白噪音失败: ' + error.message);
    }
  };

  // 更新睡眠目标
  const updateSleepGoal = async (value) => {
    try {
      setLocalSleepGoal(value);
      await setSleepGoal(value);
    } catch (error) {
      Alert.alert('错误', '更新睡眠目标失败: ' + error.message);
    }
  };

  // 更新智能唤醒设置
  const updateSmartWakeup = async (value) => {
    try {
      setSmartWakeupEnabled(value);
      await setSmartWakeup(value);
    } catch (error) {
      Alert.alert('错误', '更新智能唤醒设置失败: ' + error.message);
    }
  };

  // 更新白噪音音量
  const updateWhiteNoiseVolume = async (value) => {
    try {
      setLocalWhiteNoiseVolume(value);
      await setWhiteNoiseVolume(value);
      
      // 如果白噪音正在播放，更新音量
      if (whiteNoiseEnabled) {
        await startWhiteNoise(selectedWhiteNoise, value);
      }
    } catch (error) {
      Alert.alert('错误', '更新音量失败: ' + error.message);
    }
  };

  // 选择白噪音类型
  const selectWhiteNoise = async (noiseId) => {
    try {
      setSelectedWhiteNoise(noiseId);
      
      // 如果白噪音正在播放，切换类型
      if (whiteNoiseEnabled) {
        await startWhiteNoise(noiseId, whiteNoiseVolume);
      }
    } catch (error) {
      Alert.alert('错误', '切换白噪音类型失败: ' + error.message);
    }
  };

  // 导航到详细分析页面
  const navigateToDetailAnalysis = () => {
    navigation.navigate('SleepDetailAnalysis');
  };

  // 导航到白噪音选择页面
  const navigateToWhiteNoiseSelection = () => {
    navigation.navigate('WhiteNoiseSelection');
  };

  return (
    <ScrollView style={styles.container}>
      {/* 头部状态 */}
      <View style={styles.header}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>睡眠状态</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>{sleepStatistics.avgSleepHours?.toFixed(1) || '--'}</Text>
              <Text style={styles.statusLabel}>平均睡眠(小时)</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>{sleepStatistics.avgSleepQuality?.toFixed(1) || '--'}</Text>
              <Text style={styles.statusLabel}>睡眠质量(分)</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>{sleepStatistics.sleepStreak || 0}</Text>
              <Text style={styles.statusLabel}>连续记录(天)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 睡眠跟踪控制 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>睡眠跟踪</Text>
        <TouchableOpacity 
          style={[styles.trackingButton, isTracking ? styles.trackingActive : styles.trackingInactive]}
          onPress={toggleSleepTracking}
        >
          <Icon 
            name={isTracking ? 'pause-circle-filled' : 'play-circle-filled'} 
            size={40} 
            color={isTracking ? '#FF6B6B' : '#4CAF50'} 
          />
          <Text style={styles.trackingButtonText}>
            {isTracking ? '停止睡眠跟踪' : '开始睡眠跟踪'}
          </Text>
          <Text style={styles.trackingSubText}>
            {isTracking ? '正在监测您的睡眠...' : '点击开始监测睡眠质量'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 睡眠图表 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>睡眠趋势</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={sleepChartData}
            width={SCREEN_WIDTH - 32}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ffa726'
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>
        <TouchableOpacity 
          style={styles.detailButton}
          onPress={navigateToDetailAnalysis}
        >
          <Text style={styles.detailButtonText}>查看详细分析</Text>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 睡眠设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>睡眠设置</Text>
        
        {/* 睡眠目标 */}
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="bedtime" size={24} color="#5D3FD3" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>睡眠目标</Text>
              <Text style={styles.settingDescription}>{sleepGoal} 小时/天</Text>
            </View>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>4h</Text>
              <Text style={styles.sliderLabel}>12h</Text>
            </View>
            <View style={styles.sliderTrack}>
              <View 
                style={[
                  styles.sliderThumb, 
                  { left: `${((sleepGoal - 4) / 8) * 100}%` }
                ]} 
              />
            </View>
            <TouchableOpacity 
              style={styles.sliderButton}
              onPress={() => updateSleepGoal(Math.max(4, sleepGoal - 0.5))}
            >
              <Icon name="remove" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sliderButton}
              onPress={() => updateSleepGoal(Math.min(12, sleepGoal + 0.5))}
            >
              <Icon name="add" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 智能唤醒 */}
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="alarm" size={24} color="#5D3FD3" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>智能唤醒</Text>
              <Text style={styles.settingDescription}>在浅睡阶段唤醒，减少起床困难</Text>
            </View>
          </View>
          <Switch
            value={smartWakeupEnabled}
            onValueChange={updateSmartWakeup}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={smartWakeupEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* 白噪音设置 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>白噪音</Text>
        
        {/* 白噪音开关 */}
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="waves" size={24} color="#5D3FD3" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>启用白噪音</Text>
              <Text style={styles.settingDescription}>帮助放松入睡</Text>
            </View>
          </View>
          <Switch
            value={whiteNoiseEnabled}
            onValueChange={toggleWhiteNoise}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={whiteNoiseEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        {/* 白噪音类型 */}
        {whiteNoiseEnabled && (
          <>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="music-note" size={24} color="#5D3FD3" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>白噪音类型</Text>
                  <Text style={styles.settingDescription}>
                    {whiteNoiseList.find(n => n.id === selectedWhiteNoise)?.name || '雨声'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={navigateToWhiteNoiseSelection}
              >
                <Text style={styles.selectButtonText}>选择</Text>
                <Icon name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* 音量控制 */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon name="volume-up" size={24} color="#5D3FD3" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>音量</Text>
                  <Text style={styles.settingDescription}>
                    {Math.round(whiteNoiseVolume * 100)}%
                  </Text>
                </View>
              </View>
              <View style={styles.volumeSliderContainer}>
                <Icon name="volume-down" size={20} color="#666" />
                <View style={styles.volumeSliderTrack}>
                  <View 
                    style={[
                      styles.volumeSliderThumb, 
                      { left: `${whiteNoiseVolume * 100}%` }
                    ]} 
                  />
                </View>
                <Icon name="volume-up" size={20} color="#666" />
              </View>
            </View>
          </>
        )}
      </View>

      {/* 睡眠小贴士 */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 睡眠小贴士</Text>
        <View style={styles.tipItem}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.tipText}>保持规律的睡眠时间</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.tipText}>睡前1小时避免使用电子设备</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.tipText}>保持卧室温度在18-22°C</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.tipText}>睡前可以尝试冥想或深呼吸</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5D3FD3',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  trackingButton: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
  },
  trackingActive: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF6B6B',
  },
  trackingInactive: {
    backgroundColor: '#F5FFF5',
    borderColor: '#4CAF50',
  },
  trackingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  trackingSubText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  detailButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginTop: 12,
  },
  detailButtonText: {
    fontSize: 14,
    color: '#333',
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
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 60,
    marginRight: 8,
  },
  sliderLabel: {
    fontSize: 10,
    color: '#666',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    position: 'relative',
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: '#5D3FD3',
    borderRadius: 8,
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  selectButtonText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  volumeSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  volumeSliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginHorizontal: 8,
    position: 'relative',
  },
  volumeSliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: '#5D3FD3',
    borderRadius: 8,
  },
  tipsSection: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    marginBottom: 20,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 18,
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

export default SleepAnalysisScreen;