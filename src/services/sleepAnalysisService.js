/**
 * 睡眠分析服务
 * 提供智能唤醒、睡眠质量分析和睡眠数据管理功能
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { Alert } from 'react-native';

// 睡眠阶段定义
export const SLEEP_STAGES = {
  AWAKE: 'awake',
  LIGHT: 'light',
  DEEP: 'deep',
  REM: 'rem',
};

// 睡眠质量评分标准
const SLEEP_QUALITY_SCORES = {
  EXCELLENT: { min: 85, label: '优秀', color: '#2ECC71', emoji: '😊' },
  GOOD: { min: 70, label: '良好', color: '#3498DB', emoji: '🙂' },
  FAIR: { min: 50, label: '一般', color: '#F39C12', emoji: '😐' },
  POOR: { min: 0, label: '较差', color: '#E74C3C', emoji: '😞' },
};

class SleepAnalysisService {
  constructor() {
    this.sleepData = [];
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.currentSleepSession = null;
    this.sleepStateListeners = [];
    this.STORAGE_KEY = '@SleepAlarmApp:sleepData';
    this.MAX_HISTORY_DAYS = 30; // 最多保存30天数据
  }

  /**
   * 初始化服务
   */
  async initialize() {
    try {
      await this.loadSleepData();
      console.log('睡眠分析服务初始化成功');
    } catch (error) {
      console.error('睡眠分析服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载历史睡眠数据
   */
  async loadSleepData() {
    try {
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        this.sleepData = JSON.parse(storedData);
      }
    } catch (error) {
      console.error('加载睡眠数据失败:', error);
      this.sleepData = [];
    }
  }

  /**
   * 保存睡眠数据
   */
  async saveSleepData() {
    try {
      // 只保存最近30天的数据
      const cutoffDate = dayjs().subtract(this.MAX_HISTORY_DAYS, 'day');
      this.sleepData = this.sleepData.filter(session => 
        dayjs(session.endTime).isAfter(cutoffDate)
      );
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.sleepData));
    } catch (error) {
      console.error('保存睡眠数据失败:', error);
    }
  }

  /**
   * 开始睡眠监测
   */
  async startSleepMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.currentSleepSession = {
      id: Date.now().toString(),
      startTime: new Date().toISOString(),
      stages: [],
      movements: [],
      heartRateSamples: [],
      audioLevels: [],
      qualityScore: 0,
      analysis: null,
    };

    // 启动监测定时器
    this.monitoringInterval = setInterval(() => {
      this.collectSleepData();
    }, 60000); // 每分钟收集一次数据

    // 通知监听器
    this.notifyStateChange('monitoring_started');

    console.log('睡眠监测开始');
  }

  /**
   * 停止睡眠监测
   */
  async stopSleepMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.currentSleepSession) {
      this.currentSleepSession.endTime = new Date().toISOString();
      await this.analyzeSleepSession();
      this.sleepData.unshift(this.currentSleepSession);
      await this.saveSleepData();
      
      // 通知监听器
      this.notifyStateChange('monitoring_stopped', this.currentSleepSession);
      
      this.currentSleepSession = null;
    }

    console.log('睡眠监测结束');
  }

  /**
   * 收集睡眠数据
   */
  async collectSleepData() {
    if (!this.currentSleepSession) return;

    const timestamp = Date.now();
    const currentTime = new Date().toISOString();

    try {
      // 模拟收集睡眠数据（在实际应用中，这里会连接硬件传感器）
      const stage = this.detectSleepStage();
      const movement = this.detectMovement();
      const heartRate = this.simulateHeartRate(stage);
      const audioLevel = this.simulateAudioLevel();

      this.currentSleepSession.stages.push({
        timestamp: currentTime,
        stage,
        duration: 60000, // 1分钟
      });

      this.currentSleepSession.movements.push({
        timestamp: currentTime,
        intensity: movement,
      });

      this.currentSleepSession.heartRateSamples.push({
        timestamp: currentTime,
        bpm: heartRate,
      });

      this.currentSleepSession.audioLevels.push({
        timestamp: currentTime,
        level: audioLevel,
      });

      // 通知监听器数据更新
      this.notifyStateChange('data_collected', {
        stage,
        movement,
        heartRate,
        audioLevel,
      });

    } catch (error) {
      console.error('收集睡眠数据失败:', error);
    }
  }

  /**
   * 检测睡眠阶段（模拟算法）
   */
  detectSleepStage() {
    if (!this.currentSleepSession) return SLEEP_STAGES.AWAKE;

    const sessionDuration = Date.now() - new Date(this.currentSleepSession.startTime).getTime();
    const minutes = sessionDuration / 60000;

    // 模拟睡眠周期（90分钟一个周期）
    const cyclePosition = (minutes % 90) / 90;

    if (cyclePosition < 0.1) return SLEEP_STAGES.AWAKE;      // 清醒期
    if (cyclePosition < 0.2) return SLEEP_STAGES.LIGHT;     // 浅睡期
    if (cyclePosition < 0.4) return SLEEP_STAGES.DEEP;      // 深睡期
    if (cyclePosition < 0.6) return SLEEP_STAGES.REM;       // REM期
    if (cyclePosition < 0.7) return SLEEP_STAGES.LIGHT;     // 浅睡期
    if (cyclePosition < 0.9) return SLEEP_STAGES.DEEP;      // 深睡期
    return SLEEP_STAGES.REM;                                // REM期
  }

  /**
   * 检测身体活动（模拟）
   */
  detectMovement() {
    // 模拟随机活动检测
    return Math.random() * 100;
  }

  /**
   * 模拟心率数据
   */
  simulateHeartRate(stage) {
    const baseRates = {
      [SLEEP_STAGES.AWAKE]: 70,
      [SLEEP_STAGES.LIGHT]: 65,
      [SLEEP_STAGES.DEEP]: 55,
      [SLEEP_STAGES.REM]: 68,
    };

    const baseRate = baseRates[stage] || 65;
    const variation = (Math.random() - 0.5) * 10; // ±5 BPM变化
    return Math.round(baseRate + variation);
  }

  /**
   * 模拟环境噪音水平
   */
  simulateAudioLevel() {
    // 模拟夜间环境噪音
    const hour = new Date().getHours();
    let baseLevel = 30; // dB

    if (hour >= 22 || hour < 6) {
      // 深夜时段，噪音较低
      baseLevel = 25 + Math.random() * 10;
    } else if (hour >= 6 && hour < 8) {
      // 清晨时段，噪音逐渐增加
      baseLevel = 30 + Math.random() * 20;
    } else {
      // 白天时段，噪音较高
      baseLevel = 40 + Math.random() * 30;
    }

    return Math.round(baseLevel);
  }

  /**
   * 分析睡眠会话
   */
  async analyzeSleepSession() {
    if (!this.currentSleepSession) return;

    const session = this.currentSleepSession;
    const stages = session.stages;

    // 计算各阶段时长
    const stageDurations = {};
    Object.values(SLEEP_STAGES).forEach(stage => {
      stageDurations[stage] = stages
        .filter(s => s.stage === stage)
        .reduce((sum, s) => sum + s.duration, 0);
    });

    // 计算总睡眠时间
    const totalSleepTime = Object.values(stageDurations)
      .reduce((sum, duration) => sum + duration, 0);

    // 计算睡眠效率（睡眠时间/卧床时间）
    const bedTime = new Date(session.endTime).getTime() - 
                   new Date(session.startTime).getTime();
    const sleepEfficiency = totalSleepTime / bedTime;

    // 计算睡眠潜伏期（入睡时间）
    const firstSleepStage = stages.find(s => s.stage !== SLEEP_STAGES.AWAKE);
    const sleepLatency = firstSleepStage ? 
      new Date(firstSleepStage.timestamp).getTime() - 
      new Date(session.startTime).getTime() : 0;

    // 计算唤醒次数
    const wakeCount = stages.filter(s => s.stage === SLEEP_STAGES.AWAKE).length;

    // 计算平均心率
    const avgHeartRate = session.heartRateSamples.length > 0 ?
      session.heartRateSamples.reduce((sum, sample) => sum + sample.bpm, 0) / 
      session.heartRateSamples.length : 0;

    // 计算平均活动水平
    const avgMovement = session.movements.length > 0 ?
      session.movements.reduce((sum, movement) => sum + movement.intensity, 0) / 
      session.movements.length : 0;

    // 计算平均噪音水平
    const avgAudioLevel = session.audioLevels.length > 0 ?
      session.audioLevels.reduce((sum, audio) => sum + audio.level, 0) / 
      session.audioLevels.length : 0;

    // 计算睡眠质量评分
    const qualityScore = this.calculateSleepQualityScore({
      totalSleepTime,
      sleepEfficiency,
      sleepLatency,
      wakeCount,
      avgHeartRate,
      avgMovement,
      avgAudioLevel,
      stageDurations,
    });

    // 生成睡眠分析报告
    const analysis = {
      stageDurations,
      totalSleepTime,
      sleepEfficiency,
      sleepLatency,
      wakeCount,
      avgHeartRate,
      avgMovement,
      avgAudioLevel,
      qualityScore,
      recommendations: this.generateRecommendations(qualityScore, {
        avgHeartRate,
        avgMovement,
        avgAudioLevel,
        stageDurations,
      }),
    };

    session.analysis = analysis;
    session.qualityScore = qualityScore;

    return analysis;
  }

  /**
   * 计算睡眠质量评分
   */
  calculateSleepQualityScore(metrics) {
    let score = 100;

    // 睡眠效率权重：30%
    const efficiencyScore = Math.min(100, metrics.sleepEfficiency * 100);
    score = score * 0.3 + efficiencyScore * 0.7;

    // 睡眠时间权重：25%
    const sleepTimeHours = metrics.totalSleepTime / 3600000; // 转换为小时
    let sleepTimeScore;
    if (sleepTimeHours >= 7 && sleepTimeHours <= 9) {
      sleepTimeScore = 100; // 理想睡眠时间
    } else if (sleepTimeHours >= 6 && sleepTimeHours < 7) {
      sleepTimeScore = 80; // 稍短
    } else if (sleepTimeHours > 9 && sleepTimeHours <= 10) {
      sleepTimeScore = 80; // 稍长
    } else {
      sleepTimeScore = 50; // 不理想
    }
    score = score * 0.25 + sleepTimeScore * 0.75;

    // 唤醒次数权重：20%
    const wakeScore = Math.max(0, 100 - metrics.wakeCount * 10);
    score = score * 0.2 + wakeScore * 0.8;

    // 深睡比例权重：15%
    const deepSleepRatio = metrics.stageDurations.deep / metrics.totalSleepTime;
    const deepSleepScore = Math.min(100, deepSleepRatio * 300); // 理想深睡比例约30%
    score = score * 0.15 + deepSleepScore * 0.85;

    // REM比例权重：10%
    const remSleepRatio = metrics.stageDurations.rem / metrics.totalSleepTime;
    const remSleepScore = Math.min(100, remSleepRatio * 400); // 理想REM比例约25%
    score = score * 0.1 + remSleepScore * 0.9;

    // 环境因素调整
    if (metrics.avgAudioLevel > 50) {
      score *= 0.9; // 噪音过大扣分
    }
    if (metrics.avgHeartRate > 75) {
      score *= 0.95; // 心率偏高扣分
    }

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * 生成改善建议
   */
  generateRecommendations(qualityScore, metrics) {
    const recommendations = [];

    if (qualityScore < 70) {
      recommendations.push({
        priority: 'high',
        title: '改善睡眠环境',
        description: '建议调整卧室温度、光线和噪音水平',
        action: '检查睡眠环境',
      });
    }

    if (metrics.avgAudioLevel > 50) {
      recommendations.push({
        priority: 'high',
        title: '降低环境噪音',
        description: '环境噪音偏高，建议使用白噪音或耳塞',
        action: '开启白噪音',
      });
    }

    if (metrics.stageDurations.deep / (metrics.totalSleepTime || 1) < 0.2) {
      recommendations.push({
        priority: 'medium',
        title: '增加深睡时间',
        description: '深睡时间不足，建议保持规律作息和适量运动',
        action: '查看作息建议',
      });
    }

    if (metrics.avgHeartRate > 75) {
      recommendations.push({
        priority: 'medium',
        title: '降低心率',
        description: '睡眠中心率偏高，建议睡前放松和深呼吸',
        action: '尝试放松练习',
      });
    }

    if (qualityScore >= 85) {
      recommendations.push({
        priority: 'low',
        title: '保持良好习惯',
        description: '睡眠质量优秀，继续保持当前作息习惯',
        action: '查看详细报告',
      });
    }

    return recommendations;
  }

  /**
   * 计算智能唤醒时间
   */
  calculateSmartWakeTime(targetWakeTime, minDuration = 20, maxDuration = 30) {
    const targetTime = dayjs(targetWakeTime);
    const now = dayjs();
    
    if (targetTime.isBefore(now)) {
      throw new Error('目标唤醒时间不能早于当前时间');
    }

    // 计算90分钟睡眠周期
    const timeToTarget = targetTime.diff(now, 'minute');
    const cycles = Math.floor(timeToTarget / 90);
    
    if (cycles === 0) {
      // 如果时间不足一个周期，直接使用目标时间
      return targetTime.toISOString();
    }

    // 计算最佳唤醒时间（在目标时间前的浅睡期）
    const optimalWakeTime = targetTime.subtract(minDuration, 'minute');
    const cycleBasedWakeTime = now.add(cycles * 90, 'minute');

    // 选择最接近目标时间且在浅睡期的唤醒时间
    let wakeTime;
    if (Math.abs(optimalWakeTime.diff(cycleBasedWakeTime, 'minute')) < 30) {
      wakeTime = optimalWakeTime;
    } else {
      wakeTime = cycleBasedWakeTime;
    }

    // 确保唤醒时间在目标时间的[min, max]分钟范围内
    const diffFromTarget = targetTime.diff(wakeTime, 'minute');
    if (diffFromTarget < minDuration) {
      wakeTime = targetTime.subtract(minDuration, 'minute');
    } else if (diffFromTarget > maxDuration) {
      wakeTime = targetTime.subtract(maxDuration, 'minute');
    }

    return wakeTime.toISOString();
  }

  /**
   * 获取睡眠质量标签
   */
  getSleepQualityLabel(score) {
    for (const [key, criteria] of Object.entries(SLEEP_QUALITY_SCORES)) {
      if (score >= criteria.min) {
        return criteria;
      }
    }
    return SLEEP_QUALITY_SCORES.POOR;
  }

  /**
   * 获取历史睡眠数据
   */
  getSleepHistory(days = 7) {
    const cutoffDate = dayjs().subtract(days, 'day');
    return this.sleepData.filter(session =>
      dayjs(session.endTime).isAfter(cutoffDate)
    );
  }

  /**
   * 获取睡眠统计数据
   */
  getSleepStatistics(days = 7) {
    const history = this.getSleepHistory(days);
    
    if (history.length === 0) {
      return null;
    }

    const totalSessions = history.length;
    const avgQualityScore = Math.round(
      history.reduce((sum, session) => sum + session.qualityScore, 0) / totalSessions
    );

    const avgSleepTime = Math.round(
      history.reduce((sum, session) => {
        const duration = new Date(session.endTime).getTime() - 
                        new Date(session.startTime).getTime();
        return sum + duration;
      }, 0) / totalSessions / 3600000 * 10
    ) / 10; // 转换为小时，保留一位小数

    const consistencyScore = this.calculateConsistencyScore(history);

    return {
      totalSessions,
      avgQualityScore,
      avgSleepTime,
      consistencyScore,
      qualityLabel: this.getSleepQualityLabel(avgQualityScore),
      trends: this.calculateSleepTrends(history),
    };
  }

  /**
   * 计算睡眠一致性评分
   */
  calculateConsistencyScore(history) {
    if (history.length < 2) return 100;

    const bedTimes = history.map(session => 
      dayjs(session.startTime).hour() * 60 + dayjs(session.startTime).minute()
    );

    const wakeTimes = history.map(session => 
      dayjs(session.endTime).hour() * 60 + dayjs(session.endTime).minute()
    );

    // 计算标准差
    const bedTimeStd = this.calculateStandardDeviation(bedTimes);
    const wakeTimeStd = this.calculateStandardDeviation(wakeTimes);

    // 转换为评分（标准差越小，评分越高）
    const bedTimeScore = Math.max(0, 100 - bedTimeStd * 5);
    const wakeTimeScore = Math.max(0, 100 - wakeTimeStd * 5);

    return Math.round((bedTimeScore + wakeTimeScore) / 2);
  }

  /**
   * 计算标准差
   */
  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * 计算睡眠趋势
   */
  calculateSleepTrends(history) {
    if (history.length < 3) return null;

    const recentScores = history.slice(0, 3).map(session => session.qualityScore);
    const olderScores = history.slice(3, 6).map(session => session.qualityScore);

    if (olderScores.length === 0) return 'stable';

    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;

    const diff = recentAvg - olderAvg;

    if (diff > 10) return 'improving';
    if (diff < -10) return 'declining';
    return 'stable';
  }

  /**
   * 添加状态监听器
   */
  addStateListener(listener) {
    this.sleepStateListeners.push(listener);
  }

  /**
   * 移除状态监听器
   */
  removeStateListener(listener) {
    this.sleepStateListeners = this.sleepStateListeners.filter(l => l !== listener);
  }

  /**
   * 通知状态变化
   */
  notifyStateChange(event, data = null) {
    this.sleepStateListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('状态监听器错误:', error);
      }
    });
  }

  /**
   * 清理所有数据
   */
  async clearAllData() {
    this.sleepData = [];
    this.currentSleepSession = null;
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    this.notifyStateChange('data_cleared');
  }

  /**
   * 导出睡眠数据
   */
  async exportSleepData() {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      sleepSessions: this.sleepData,
      statistics: this.getSleepStatistics(30),
    };

    return JSON.stringify(data, null, 2);
  }
}

// 创建单例实例
const sleepAnalysisService = new SleepAnalysisService();

export default sleepAnalysisService;