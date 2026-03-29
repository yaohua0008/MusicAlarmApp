import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { 
  fetchSleepStatistics,
  fetchSleepData,
  clearSleepData 
} from '../store/slices/sleepSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SleepDetailAnalysis = () => {
  const dispatch = useDispatch();
  
  // 从Redux获取数据
  const sleepData = useSelector(state => state.sleep?.data || {});
  const sleepStatistics = useSelector(state => state.sleep?.statistics || {});
  const sleepSettings = useSelector(state => state.sleep?.settings || {});
  const loading = useSelector(state => state.sleep?.loading || false);
  
  // 本地状态
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year'
  const [selectedMetric, setSelectedMetric] = useState('hours'); // 'hours', 'quality', 'stages'

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchSleepStatistics()),
        dispatch(fetchSleepData()),
      ]);
    } catch (error) {
      console.error('加载睡眠数据失败:', error);
    }
  };

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // 清除数据
  const handleClearData = () => {
    Alert.alert(
      '确认清除',
      '确定要清除所有睡眠数据吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        { text: '清除', style: 'destructive', onPress: () => {
          dispatch(clearSleepData());
          Alert.alert('成功', '睡眠数据已清除');
        }},
      ]
    );
  };

  // 生成图表数据
  const generateChartData = () => {
    const { last7Days = [], monthlyTrend = [] } = sleepStatistics;
    
    switch (timeRange) {
      case 'week':
        return {
          labels: last7Days.map(day => day.day.substring(5)), // 显示月-日
          datasets: [{
            data: last7Days.map(day => selectedMetric === 'hours' ? day.totalSleepHours : day.qualityScore),
            color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
            strokeWidth: 2,
          }]
        };
      case 'month':
        return {
          labels: monthlyTrend.map(month => `${month.month}月`),
          datasets: [{
            data: monthlyTrend.map(month => selectedMetric === 'hours' ? month.avgHours : month.avgQuality),
            color: (opacity = 1) => `rgba(52, 168, 83, ${opacity})`,
            strokeWidth: 2,
          }]
        };
      default:
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            data: [7, 6.5, 7.5, 8, 7, 8.5, 9],
            color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
            strokeWidth: 2,
          }]
        };
    }
  };

  // 生成睡眠阶段饼图数据
  const generateStageData = () => {
    const stages = sleepStatistics.stageDistribution || {
      light: 50,
      deep: 25,
      rem: 20,
      awake: 5,
    };

    return [
      {
        name: '浅睡',
        population: stages.light,
        color: '#4CAF50',
        legendFontColor: '#333',
        legendFontSize: 12,
      },
      {
        name: '深睡',
        population: stages.deep,
        color: '#2196F3',
        legendFontColor: '#333',
        legendFontSize: 12,
      },
      {
        name: 'REM睡眠',
        population: stages.rem,
        color: '#9C27B0',
        legendFontColor: '#333',
        legendFontSize: 12,
      },
      {
        name: '清醒',
        population: stages.awake,
        color: '#FF9800',
        legendFontColor: '#333',
        legendFontSize: 12,
      },
    ];
  };

  // 生成健康指标数据
  const generateHealthMetrics = () => {
    return [
      {
        title: '入睡时间',
        value: sleepStatistics.avgFallAsleepTime || '25分钟',
        icon: 'bedtime',
        color: '#4CAF50',
        description: '平均入睡所需时间',
      },
      {
        title: '睡眠效率',
        value: sleepStatistics.sleepEfficiency || '85%',
        icon: 'trending-up',
        color: '#2196F3',
        description: '在床上实际睡眠的时间比例',
      },
      {
        title: '夜间觉醒',
        value: sleepStatistics.avgAwakenings || '2次',
        icon: 'nightlight',
        color: '#9C27B0',
        description: '平均夜间觉醒次数',
      },
      {
        title: '起床时间',
        value: sleepStatistics.avgWakeupTime || '6:30',
        icon: 'alarm',
        color: '#FF9800',
        description: '平均起床时间',
      },
    ];
  };

  // 生成睡眠建议
  const generateSleepAdvice = () => {
    const quality = sleepStatistics.avgSleepQuality || 0;
    
    if (quality >= 80) {
      return {
        title: '睡眠质量优秀',
        description: '继续保持良好的睡眠习惯！',
        icon: 'emoji-events',
        color: '#4CAF50',
        tips: [
          '保持规律的睡眠时间',
          '继续保持睡前放松习惯',
          '白天适当运动',
        ],
      };
    } else if (quality >= 60) {
      return {
        title: '睡眠质量良好',
        description: '可以进一步提升睡眠质量',
        icon: 'thumb-up',
        color: '#2196F3',
        tips: [
          '尝试睡前冥想',
          '避免睡前使用电子设备',
          '保持卧室温度适宜',
        ],
      };
    } else {
      return {
        title: '需要改善睡眠',
        description: '建议关注以下方面',
        icon: 'warning',
        color: '#F44336',
        tips: [
          '建立规律的作息时间',
          '睡前1小时远离电子设备',
          '考虑使用白噪音助眠',
          '避免晚间摄入咖啡因',
        ],
      };
    }
  };

  const chartData = generateChartData();
  const stageData = generateStageData();
  const healthMetrics = generateHealthMetrics();
  const sleepAdvice = generateSleepAdvice();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 头部统计 */}
      <View style={styles.header}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="bedtime" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>
              {sleepStatistics.avgSleepHours?.toFixed(1) || '--'}h
            </Text>
            <Text style={styles.statLabel}>平均睡眠</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="star" size={24} color="#FF9800" />
            <Text style={styles.statValue}>
              {sleepStatistics.avgSleepQuality?.toFixed(0) || '--'}/100
            </Text>
            <Text style={styles.statLabel}>睡眠质量</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="calendar-today" size={24} color="#2196F3" />
            <Text style={styles.statValue}>
              {sleepStatistics.sleepStreak || 0}天
            </Text>
            <Text style={styles.statLabel}>连续记录</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="trending-up" size={24} color="#9C27B0" />
            <Text style={styles.statValue}>
              {sleepStatistics.totalSleepDays || 0}天
            </Text>
            <Text style={styles.statLabel}>总记录天数</Text>
          </View>
        </View>
      </View>

      {/* 时间范围选择 */}
      <View style={styles.timeRangeSelector}>
        <Text style={styles.sectionTitle}>睡眠趋势</Text>
        <View style={styles.rangeButtons}>
          {['week', 'month', 'year'].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.rangeButton,
                timeRange === range && styles.rangeButtonActive,
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[
                styles.rangeButtonText,
                timeRange === range && styles.rangeButtonTextActive,
              ]}>
                {range === 'week' ? '周' : range === 'month' ? '月' : '年'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 趋势图表 */}
      <View style={styles.chartSection}>
        <View style={styles.metricSelector}>
          {[
            { id: 'hours', label: '睡眠时长', icon: 'schedule' },
            { id: 'quality', label: '睡眠质量', icon: 'star' },
            { id: 'stages', label: '睡眠阶段', icon: 'pie-chart' },
          ].map((metric) => (
            <TouchableOpacity
              key={metric.id}
              style={[
                styles.metricButton,
                selectedMetric === metric.id && styles.metricButtonActive,
              ]}
              onPress={() => setSelectedMetric(metric.id)}
            >
              <Icon 
                name={metric.icon} 
                size={16} 
                color={selectedMetric === metric.id ? '#FFFFFF' : '#666'} 
              />
              <Text style={[
                styles.metricButtonText,
                selectedMetric === metric.id && styles.metricButtonTextActive,
              ]}>
                {metric.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedMetric === 'stages' ? (
          <View style={styles.pieChartContainer}>
            <PieChart
              data={stageData}
              width={SCREEN_WIDTH - 32}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        ) : (
          <LineChart
            data={chartData}
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
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ffa726',
              },
            }}
            bezier
            style={styles.chart}
          />
        )}
      </View>

      {/* 健康指标 */}
      <View style={styles.healthMetricsSection}>
        <Text style={styles.sectionTitle}>健康指标</Text>
        <View style={styles.healthGrid}>
          {healthMetrics.map((metric, index) => (
            <View key={index} style={styles.healthMetricCard}>
              <Icon name={metric.icon} size={20} color={metric.color} />
              <Text style={styles.healthMetricValue}>{metric.value}</Text>
              <Text style={styles.healthMetricTitle}>{metric.title}</Text>
              <Text style={styles.healthMetricDesc}>{metric.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 睡眠建议 */}
      <View style={styles.adviceSection}>
        <View style={styles.adviceHeader}>
          <Icon name={sleepAdvice.icon} size={24} color={sleepAdvice.color} />
          <View style={styles.adviceTitleContainer}>
            <Text style={styles.adviceTitle}>{sleepAdvice.title}</Text>
            <Text style={styles.adviceDescription}>{sleepAdvice.description}</Text>
          </View>
        </View>
        <View style={styles.tipsContainer}>
          {sleepAdvice.tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 最近睡眠记录 */}
      <View style={styles.recentRecordsSection}>
        <Text style={styles.sectionTitle}>最近睡眠记录</Text>
        {sleepData.sleepRecords?.slice(0, 5).map((record, index) => (
          <View key={index} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <Text style={styles.recordDate}>
                {new Date(record.startTime).toLocaleDateString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </Text>
              <View style={styles.recordStats}>
                <Text style={styles.recordHours}>
                  {record.totalHours?.toFixed(1) || '--'}h
                </Text>
                <View style={styles.qualityBadge}>
                  <Text style={styles.qualityText}>
                    质量: {record.qualityScore || '--'}/100
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.recordDetails}>
              <View style={styles.detailItem}>
                <Icon name="schedule" size={14} color="#666" />
                <Text style={styles.detailText}>
                  入睡: {new Date(record.startTime).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="alarm" size={14} color="#666" />
                <Text style={styles.detailText}>
                  醒来: {new Date(record.endTime).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="restart-alt" size={14} color="#666" />
                <Text style={styles.detailText}>
                  夜间觉醒: {record.movements || 0}次
                </Text>
              </View>
            </View>
          </View>
        ))}
        {(!sleepData.sleepRecords || sleepData.sleepRecords.length === 0) && (
          <View style={styles.emptyRecords}>
            <Icon name="bedtime" size={48} color="#E0E0E0" />
            <Text style={styles.emptyText}>暂无睡眠记录</Text>
            <Text style={styles.emptySubtext}>开始睡眠跟踪后，这里会显示您的睡眠数据</Text>
          </View>
        )}
      </View>

      {/* 数据管理 */}
      <View style={styles.dataManagementSection}>
        <Text style={styles.sectionTitle}>数据管理</Text>
        <TouchableOpacity 
          style={styles.clearDataButton}
          onPress={handleClearData}
        >
          <Icon name="delete" size={20} color="#F44336" />
          <Text style={styles.clearDataText}>清除所有睡眠数据</Text>
        </TouchableOpacity>
        <Text style={styles.dataInfo}>
          数据最后更新: {new Date().toLocaleDateString('zh-CN')}
        </Text>
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
    backgroundColor: '#ffffff',
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  timeRangeSelector: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  rangeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rangeButtonActive: {
    backgroundColor: '#5D3FD3',
    borderColor: '#5D3FD3',
  },
  rangeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  rangeButtonTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  chartSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
  },
  metricSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 4,
  },
  metricButtonActive: {
    backgroundColor: '#5D3FD3',
    borderColor: '#5D3FD3',
  },
  metricButtonText: {
    fontSize: 12,
    color: '#666',
  },
  metricButtonTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  healthMetricsSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  healthMetricCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  healthMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  healthMetricTitle: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  healthMetricDesc: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  adviceSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  adviceTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  adviceDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tipsContainer: {
    marginTop: 8,
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
    flex: 1,
  },
  recentRecordsSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  recordCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  recordStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordHours: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D3FD3',
  },
  qualityBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qualityText: {
    fontSize: 10,
    color: '#FF9800',
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  emptyRecords: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  dataManagementSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 20,
  },
  clearDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginBottom: 12,
    gap: 8,
  },
  clearDataText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: 'bold',
  },
  dataInfo: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default SleepDetailAnalysis;