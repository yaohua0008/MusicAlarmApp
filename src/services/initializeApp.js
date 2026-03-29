/**
 * 应用初始化服务
 * 负责应用启动时的数据初始化和状态设置
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateMockMusic, generateMockAlarms, generateMockPlaylists } from '../data/mockData';
import notificationService from './notificationService';

// 存储键名
const STORAGE_KEYS = {
  ALARMS: '@MusicAlarmApp:alarms',
  MUSIC_LIBRARY: '@MusicAlarmApp:musicLibrary',
  PLAYBACK_STATE: '@MusicAlarmApp:playbackState',
  SETTINGS: '@MusicAlarmApp:settings',
  STATS: '@MusicAlarmApp:stats',
  FIRST_RUN: '@MusicAlarmApp:firstRun',
  SLEEP_DATA: '@SleepAlarmApp:sleepData',  // 新增睡眠数据存储
  WHITE_NOISE_SETTINGS: '@SleepAlarmApp:whiteNoiseSettings',  // 新增白噪音设置
};

/**
 * 检查是否是首次运行应用
 */
export const checkFirstRun = async () => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_RUN);
    if (value === null) {
      // 首次运行，生成初始数据
      await initializeAppData();
      await AsyncStorage.setItem(STORAGE_KEYS.FIRST_RUN, 'false');
      return true;
    }
    return false;
  } catch (error) {
    console.error('检查首次运行失败:', error);
    return false;
  }
};

/**
 * 初始化应用数据（首次运行时调用）
 */
export const initializeAppData = async () => {
  try {
    console.log('初始化应用数据...');
    
    // 生成测试数据
    const mockAlarms = generateMockAlarms(8);
    const mockMusic = generateMockMusic(25);
    const mockPlaylists = generateMockPlaylists();
    
    // 存储到AsyncStorage
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(mockAlarms)),
      AsyncStorage.setItem(STORAGE_KEYS.MUSIC_LIBRARY, JSON.stringify(mockMusic)),
      AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(getDefaultSettings())),
      AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(getDefaultStats())),
    ]);
    
    console.log('应用数据初始化完成');
    return true;
  } catch (error) {
    console.error('初始化应用数据失败:', error);
    return false;
  }
};

/**
 * 获取默认设置
 */
export const getDefaultSettings = () => {
  return {
    theme: 'light',
    language: 'zh-CN',
    timeFormat: '24h',
    defaultVolume: 0.7,
    defaultVibration: true,
    defaultSnooze: true,
    defaultSnoozeMinutes: 10,
    defaultFadeIn: true,
    defaultFadeInDuration: 2,
    musicLibraryPath: null,
    autoBackup: true,
    backupInterval: 7,
    dataRetentionDays: 90,
    notificationEnabled: true,
    notificationSound: 'default',
    hapticFeedback: true,
    alarmCategories: [
      { id: 'work', name: '上班途中', color: '#2196F3', icon: 'briefcase', enabled: true },
      { id: 'rest', name: '休息提醒', color: '#4CAF50', icon: 'coffee', enabled: true },
      { id: 'focus', name: '专注模式', color: '#FF9800', icon: 'timer', enabled: true },
      { id: 'custom', name: '自定义', color: '#9C27B0', icon: 'pencil', enabled: true },
    ],
    musicEqualizer: 'normal',
    crossfadeEnabled: false,
    crossfadeDuration: 3,
    lyricsEnabled: true,
    playbackQuality: 'high',
    analyticsEnabled: true,
    crashReportsEnabled: true,
    
    // 新增睡眠分析设置
    sleepAnalysis: {
      enabled: true,
      autoMonitoring: false,
      smartWakeEnabled: true,
      smartWakeWindow: 30, // 分钟
      deepSleepThreshold: 0.2, // 深睡比例阈值
      qualityThresholds: {
        excellent: 85,
        good: 70,
        fair: 50,
      },
      recommendationsEnabled: true,
      dataRetentionDays: 30,
    },
    
    // 新增白噪音设置
    whiteNoise: {
      enabled: true,
      defaultMix: 'deep_sleep',
      autoStart: false,
      fadeDuration: 3, // 秒
      volume: 0.7,
      scheduledPlay: null,
      favorites: ['rain', 'ocean', 'white'],
    },
  };
};

/**
 * 获取默认统计信息
 */
export const getDefaultStats = () => {
  return {
    alarmsCreated: 0,
    alarmsTriggered: 0,
    totalMusicPlayTime: '0分钟',
    favoriteSongs: 0,
    playlistsCreated: 0,
    mostUsedCategory: '上班途中',
    mostPlayedSong: '',
    appUsageDays: 0,
    lastBackup: null,
    version: '1.0.0',
    buildNumber: '20240329.1',
    
    // 新增睡眠分析统计
    sleepAnalysis: {
      totalSessions: 0,
      avgQualityScore: 0,
      avgSleepHours: 0,
      bestQualityScore: 0,
      worstQualityScore: 0,
      deepSleepRatio: 0,
      remSleepRatio: 0,
      consistencyScore: 0,
      smartWakeUsed: 0,
      whiteNoiseUsed: 0,
      recommendationsFollowed: 0,
    },
    
    // 新增白噪音统计
    whiteNoiseStats: {
      totalPlayTime: 0,
      mostUsedSound: '',
      favoriteMixes: [],
      autoStartCount: 0,
    },
  };
};

/**
 * 加载所有应用数据
 */
export const loadAppData = async () => {
  try {
    const [
      alarmsData,
      musicData,
      settingsData,
      statsData,
    ] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.ALARMS),
      AsyncStorage.getItem(STORAGE_KEYS.MUSIC_LIBRARY),
      AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      AsyncStorage.getItem(STORAGE_KEYS.STATS),
    ]);
    
    return {
      alarms: alarmsData ? JSON.parse(alarmsData) : [],
      music: musicData ? JSON.parse(musicData) : [],
      settings: settingsData ? JSON.parse(settingsData) : getDefaultSettings(),
      stats: statsData ? JSON.parse(statsData) : getDefaultStats(),
    };
  } catch (error) {
    console.error('加载应用数据失败:', error);
    return {
      alarms: [],
      music: [],
      settings: getDefaultSettings(),
      stats: getDefaultStats(),
    };
  }
};

/**
 * 保存所有应用数据
 */
export const saveAppData = async (data) => {
  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(data.alarms || [])),
      AsyncStorage.setItem(STORAGE_KEYS.MUSIC_LIBRARY, JSON.stringify(data.music || [])),
      AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings || getDefaultSettings())),
      AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(data.stats || getDefaultStats())),
    ]);
    return true;
  } catch (error) {
    console.error('保存应用数据失败:', error);
    return false;
  }
};

/**
 * 重置应用数据（清除所有数据）
 */
export const resetAppData = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ALARMS),
      AsyncStorage.removeItem(STORAGE_KEYS.MUSIC_LIBRARY),
      AsyncStorage.removeItem(STORAGE_KEYS.PLAYBACK_STATE),
      AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS),
      AsyncStorage.removeItem(STORAGE_KEYS.STATS),
      AsyncStorage.removeItem(STORAGE_KEYS.FIRST_RUN),
    ]);
    
    // 重新初始化数据
    await initializeAppData();
    return true;
  } catch (error) {
    console.error('重置应用数据失败:', error);
    return false;
  }
};

/**
 * 导出所有数据（用于备份）
 */
export const exportAllData = async () => {
  try {
    const data = await loadAppData();
    return {
      ...data,
      exportDate: new Date().toISOString(),
      platform: Platform.OS,
      version: data.stats.version || '1.0.0',
    };
  } catch (error) {
    console.error('导出数据失败:', error);
    return null;
  }
};

/**
 * 导入数据（用于恢复备份）
 */
export const importData = async (importData) => {
  try {
    // 验证导入数据
    if (!importData || typeof importData !== 'object') {
      throw new Error('无效的导入数据格式');
    }
    
    // 保存导入数据
    await saveAppData({
      alarms: importData.alarms || [],
      music: importData.music || [],
      settings: importData.settings || getDefaultSettings(),
      stats: importData.stats || getDefaultStats(),
    });
    
    return true;
  } catch (error) {
    console.error('导入数据失败:', error);
    return false;
  }
};

/**
 * 检查应用更新
 */
export const checkForUpdates = async () => {
  // 这里可以集成实际的更新检查逻辑
  // 例如从API获取最新版本信息
  
  return {
    updateAvailable: false,
    latestVersion: '1.0.0',
    releaseNotes: '',
    downloadUrl: '',
  };
};

/**
 * 记录应用使用统计
 */
export const logAppUsage = async (action, data = {}) => {
  try {
    const statsData = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
    let stats = statsData ? JSON.parse(statsData) : getDefaultStats();
    
    // 更新统计信息
    switch (action) {
      case 'alarm_created':
        stats.alarmsCreated += 1;
        break;
      case 'alarm_triggered':
        stats.alarmsTriggered += 1;
        break;
      case 'music_played':
        // 更新播放时间统计
        break;
      case 'app_opened':
        // 更新使用天数统计
        const today = new Date().toISOString().split('T')[0];
        if (stats.lastOpened !== today) {
          stats.appUsageDays += 1;
          stats.lastOpened = today;
        }
        break;
      default:
        break;
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    return true;
  } catch (error) {
    console.error('记录应用使用统计失败:', error);
    return false;
  }
};

export default {
  checkFirstRun,
  initializeAppData,
  loadAppData,
  saveAppData,
  resetAppData,
  exportAllData,
  importData,
  checkForUpdates,
  logAppUsage,
};