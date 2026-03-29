/**
 * 闹钟服务模块
 * 处理闹钟的业务逻辑和数据操作
 */

import {getNextTriggerTime} from '../utils/timeUtils';

/**
 * 验证闹钟数据
 * @param {Object} alarmData - 闹钟数据
 * @returns {Object} 验证结果 {isValid: boolean, errors: Array}
 */
export const validateAlarmData = alarmData => {
  const errors = [];

  if (!alarmData.time) {
    errors.push('请设置闹钟时间');
  }

  if (alarmData.label && alarmData.label.length > 50) {
    errors.push('闹钟标签不能超过50个字符');
  }

  if (alarmData.snoozeDuration && (alarmData.snoozeDuration < 1 || alarmData.snoozeDuration > 60)) {
    errors.push('贪睡时间必须在1-60分钟之间');
  }

  if (alarmData.fadeInDuration && (alarmData.fadeInDuration < 1 || alarmData.fadeInDuration > 30)) {
    errors.push('渐强时间必须在1-30秒之间');
  }

  if (alarmData.volume && (alarmData.volume < 0 || alarmData.volume > 1)) {
    errors.push('音量必须在0-1之间');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 计算下一个触发时间
 * @param {Array} alarms - 闹钟列表
 * @returns {Array} 包含下一个触发时间的闹钟列表
 */
export const calculateNextTriggers = alarms => {
  return alarms.map(alarm => ({
    ...alarm,
    nextTriggerTime: getNextTriggerTime(alarm),
  }));
};

/**
 * 获取即将触发的闹钟
 * @param {Array} alarms - 闹钟列表
 * @param {number} minutesAhead - 提前几分钟
 * @returns {Array} 即将触发的闹钟
 */
export const getUpcomingAlarms = (alarms, minutesAhead = 15) => {
  const now = new Date();
  const threshold = new Date(now.getTime() + minutesAhead * 60 * 1000);

  return alarms.filter(alarm => {
    if (!alarm.isActive) return false;
    
    const nextTrigger = getNextTriggerTime(alarm);
    return nextTrigger > now && nextTrigger <= threshold;
  });
};

/**
 * 获取今日闹钟
 * @param {Array} alarms - 闹钟列表
 * @returns {Array} 今日会触发的闹钟
 */
export const getTodayAlarms = alarms => {
  const today = new Date();
  const todayDay = today.getDay();

  return alarms.filter(alarm => {
    if (!alarm.isActive) return false;
    
    // 一次性闹钟
    if (!alarm.repeatDays || alarm.repeatDays.length === 0) {
      const alarmTime = new Date(alarm.time);
      return alarmTime.getDate() === today.getDate() &&
             alarmTime.getMonth() === today.getMonth() &&
             alarmTime.getFullYear() === today.getFullYear();
    }
    
    // 重复闹钟
    return alarm.repeatDays.includes(todayDay);
  }).sort((a, b) => {
    const timeA = new Date(a.time);
    const timeB = new Date(b.time);
    return (timeA.getHours() * 60 + timeA.getMinutes()) - 
           (timeB.getHours() * 60 + timeB.getMinutes());
  });
};

/**
 * 获取闹钟统计信息
 * @param {Array} alarms - 闹钟列表
 * @returns {Object} 统计信息
 */
export const getAlarmStats = alarms => {
  const total = alarms.length;
  const active = alarms.filter(alarm => alarm.isActive).length;
  const inactive = total - active;
  
  const categories = {};
  alarms.forEach(alarm => {
    const cat = alarm.category || 'uncategorized';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  const todayAlarms = getTodayAlarms(alarms);
  const upcomingAlarms = getUpcomingAlarms(alarms);

  return {
    total,
    active,
    inactive,
    categories,
    todayCount: todayAlarms.length,
    upcomingCount: upcomingAlarms.length,
  };
};

/**
 * 生成闹钟数据用于测试
 * @returns {Array} 测试闹钟数据
 */
export const generateTestAlarms = () => {
  const now = new Date();
  
  // 设置今天的时间
  const morningTime = new Date(now);
  morningTime.setHours(8, 30, 0, 0);
  
  const noonTime = new Date(now);
  noonTime.setHours(12, 0, 0, 0);
  
  const afternoonTime = new Date(now);
  afternoonTime.setHours(15, 0, 0, 0);
  
  const eveningTime = new Date(now);
  eveningTime.setHours(18, 0, 0, 0);
  
  return [
    {
      id: '1',
      time: morningTime.toISOString(),
      label: '上班提醒',
      category: 'work',
      repeatDays: [1, 2, 3, 4, 5], // 周一到周五
      music: {
        id: 'music1',
        title: '晨间活力',
        artist: '自然之声',
        duration: 180,
        uri: 'local://morning_music.mp3',
      },
      vibration: true,
      snooze: true,
      snoozeDuration: 5,
      fadeIn: true,
      fadeInDuration: 10,
      volume: 0.8,
      isActive: true,
      createdAt: new Date(now.getTime() - 86400000).toISOString(), // 昨天
    },
    {
      id: '2',
      time: noonTime.toISOString(),
      label: '午休提醒',
      category: 'break',
      repeatDays: [1, 2, 3, 4, 5],
      music: {
        id: 'music2',
        title: '放松时刻',
        artist: '轻音乐',
        duration: 300,
        uri: 'local://relax_music.mp3',
      },
      vibration: false,
      snooze: false,
      fadeIn: true,
      fadeInDuration: 5,
      volume: 0.6,
      isActive: true,
      createdAt: new Date(now.getTime() - 172800000).toISOString(), // 前天
    },
    {
      id: '3',
      time: afternoonTime.toISOString(),
      label: '下午茶提醒',
      category: 'break',
      repeatDays: [1, 2, 3, 4, 5],
      music: {
        id: 'music3',
        title: '清新午后',
        artist: '钢琴曲',
        duration: 240,
        uri: 'local://afternoon_music.mp3',
      },
      vibration: true,
      snooze: true,
      snoozeDuration: 10,
      fadeIn: true,
      fadeInDuration: 8,
      volume: 0.7,
      isActive: false,
      createdAt: new Date(now.getTime() - 259200000).toISOString(), // 3天前
    },
    {
      id: '4',
      time: eveningTime.toISOString(),
      label: '下班提醒',
      category: 'work',
      repeatDays: [1, 2, 3, 4, 5],
      music: {
        id: 'music4',
        title: '黄昏时分',
        artist: '吉他独奏',
        duration: 200,
        uri: 'local://evening_music.mp3',
      },
      vibration: true,
      snooze: true,
      snoozeDuration: 3,
      fadeIn: false,
      volume: 0.9,
      isActive: true,
      createdAt: new Date(now.getTime() - 345600000).toISOString(), // 4天前
    },
  ];
};

/**
 * 格式化闹钟显示信息
 * @param {Object} alarm - 闹钟对象
 * @returns {string} 格式化后的显示信息
 */
export const formatAlarmDisplay = alarm => {
  const time = new Date(alarm.time);
  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  
  let display = `${hours}:${minutes}`;
  
  if (alarm.label) {
    display += ` - ${alarm.label}`;
  }
  
  return display;
};