/**
 * 存储工具函数
 * 封装本地存储操作，提供统一的数据持久化接口
 */

import {MMKV} from 'react-native-mmkv';

// 初始化MMKV存储
export const storage = new MMKV();

/**
 * 存储键常量
 */
export const StorageKeys = {
  ALARMS: 'alarms',
  MUSIC_PLAYLIST: 'music_playlist',
  SETTINGS: 'settings',
  USER_PREFERENCES: 'user_preferences',
  ALARM_HISTORY: 'alarm_history',
  BACKUP_TIMESTAMP: 'backup_timestamp',
};

/**
 * 存储数据
 * @param {string} key - 存储键
 * @param {any} data - 要存储的数据
 * @returns {boolean} 是否存储成功
 */
export const storeData = (key, data) => {
  try {
    const jsonData = JSON.stringify(data);
    storage.set(key, jsonData);
    return true;
  } catch (error) {
    console.error('存储数据失败:', error);
    return false;
  }
};

/**
 * 获取数据
 * @param {string} key - 存储键
 * @param {any} defaultValue - 默认值
 * @returns {any} 获取到的数据或默认值
 */
export const getData = (key, defaultValue = null) => {
  try {
    const jsonData = storage.getString(key);
    if (jsonData) {
      return JSON.parse(jsonData);
    }
    return defaultValue;
  } catch (error) {
    console.error('获取数据失败:', error);
    return defaultValue;
  }
};

/**
 * 删除数据
 * @param {string} key - 存储键
 * @returns {boolean} 是否删除成功
 */
export const deleteData = key => {
  try {
    storage.delete(key);
    return true;
  } catch (error) {
    console.error('删除数据失败:', error);
    return false;
  }
};

/**
 * 检查键是否存在
 * @param {string} key - 存储键
 * @returns {boolean} 是否存在
 */
export const hasKey = key => {
  return storage.contains(key);
};

/**
 * 获取所有键
 * @returns {Array<string>} 所有存储键
 */
export const getAllKeys = () => {
  return storage.getAllKeys();
};

/**
 * 清除所有数据（谨慎使用）
 * @returns {boolean} 是否清除成功
 */
export const clearAllData = () => {
  try {
    storage.clearAll();
    return true;
  } catch (error) {
    console.error('清除所有数据失败:', error);
    return false;
  }
};

/**
 * 存储闹钟数据
 * @param {Array} alarms - 闹钟列表
 * @returns {boolean} 是否存储成功
 */
export const storeAlarms = alarms => {
  return storeData(StorageKeys.ALARMS, alarms);
};

/**
 * 获取闹钟数据
 * @returns {Array} 闹钟列表
 */
export const getAlarms = () => {
  return getData(StorageKeys.ALARMS, []);
};

/**
 * 存储音乐播放列表
 * @param {Array} playlist - 播放列表
 * @returns {boolean} 是否存储成功
 */
export const storePlaylist = playlist => {
  return storeData(StorageKeys.MUSIC_PLAYLIST, playlist);
};

/**
 * 获取音乐播放列表
 * @returns {Array} 播放列表
 */
export const getPlaylist = () => {
  return getData(StorageKeys.MUSIC_PLAYLIST, []);
};

/**
 * 存储设置数据
 * @param {Object} settings - 设置对象
 * @returns {boolean} 是否存储成功
 */
export const storeSettings = settings => {
  return storeData(StorageKeys.SETTINGS, settings);
};

/**
 * 获取设置数据
 * @returns {Object} 设置对象
 */
export const getSettings = () => {
  return getData(StorageKeys.SETTINGS, {});
};

/**
 * 存储用户偏好
 * @param {Object} preferences - 用户偏好
 * @returns {boolean} 是否存储成功
 */
export const storeUserPreferences = preferences => {
  return storeData(StorageKeys.USER_PREFERENCES, preferences);
};

/**
 * 获取用户偏好
 * @returns {Object} 用户偏好
 */
export const getUserPreferences = () => {
  return getData(StorageKeys.USER_PREFERENCES, {});
};

/**
 * 记录闹钟历史
 * @param {Object} alarmHistory - 闹钟历史记录
 * @returns {boolean} 是否记录成功
 */
export const recordAlarmHistory = alarmHistory => {
  const history = getAlarmHistory();
  history.unshift({
    ...alarmHistory,
    timestamp: new Date().toISOString(),
  });
  
  // 只保留最近100条记录
  const trimmedHistory = history.slice(0, 100);
  
  return storeData(StorageKeys.ALARM_HISTORY, trimmedHistory);
};

/**
 * 获取闹钟历史
 * @returns {Array} 闹钟历史记录
 */
export const getAlarmHistory = () => {
  return getData(StorageKeys.ALARM_HISTORY, []);
};

/**
 * 记录备份时间戳
 * @param {string} timestamp - 时间戳
 * @returns {boolean} 是否记录成功
 */
export const recordBackupTimestamp = timestamp => {
  return storeData(StorageKeys.BACKUP_TIMESTAMP, timestamp);
};

/**
 * 获取备份时间戳
 * @returns {string|null} 备份时间戳
 */
export const getBackupTimestamp = () => {
  return getData(StorageKeys.BACKUP_TIMESTAMP, null);
};

/**
 * 获取存储统计信息
 * @returns {Object} 存储统计
 */
export const getStorageStats = () => {
  const keys = getAllKeys();
  let totalSize = 0;
  
  keys.forEach(key => {
    const value = storage.getString(key);
    if (value) {
      totalSize += value.length * 2; // 估算UTF-16大小
    }
  });
  
  return {
    totalKeys: keys.length,
    totalSizeBytes: totalSize,
    totalSizeKB: (totalSize / 1024).toFixed(2),
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(4),
  };
};

/**
 * 导出所有数据
 * @returns {Object} 所有存储数据
 */
export const exportAllData = () => {
  const keys = getAllKeys();
  const data = {};
  
  keys.forEach(key => {
    data[key] = getData(key);
  });
  
  return {
    metadata: {
      exportTime: new Date().toISOString(),
      version: '1.0',
      keyCount: keys.length,
    },
    data,
  };
};

/**
 * 导入数据
 * @param {Object} exportData - 导出的数据
 * @returns {Object} 导入结果
 */
export const importData = exportData => {
  try {
    if (!exportData || !exportData.data) {
      return {success: false, error: '数据格式错误'};
    }
    
    const data = exportData.data;
    let importedCount = 0;
    let errorCount = 0;
    
    Object.keys(data).forEach(key => {
      try {
        storeData(key, data[key]);
        importedCount++;
      } catch (error) {
        console.error(`导入键 ${key} 失败:`, error);
        errorCount++;
      }
    });
    
    return {
      success: true,
      importedCount,
      errorCount,
      totalCount: Object.keys(data).length,
    };
  } catch (error) {
    console.error('导入数据失败:', error);
    return {success: false, error: error.message};
  }
};