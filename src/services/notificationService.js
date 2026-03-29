/**
 * 推送通知服务
 * 处理闹钟通知的调度、触发和交互
 */

import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// 设置中文语言
dayjs.locale('zh-cn');

// 导入音乐服务和闹钟服务
import musicService from './musicService';
import alarmService from './alarmService';
import { store } from '../store/store';
import { updateAlarm } from '../store/slices/alarmSlice';

// 通知配置
const NOTIFICATION_CONFIG = {
  channelId: 'alarm_channel',
  channelName: '闹钟提醒',
  channelDescription: '闹钟提醒通知',
  playSound: true,
  soundName: 'default',
  importance: 5, // 高优先级
  vibrate: true,
  vibration: 1000,
  priority: 'high',
};

// 通知类型
const NOTIFICATION_TYPES = {
  ALARM: 'alarm',
  REMINDER: 'reminder',
  SNOOZE: 'snooze',
  TEST: 'test',
};

/**
 * 初始化推送通知服务
 */
export const initializeNotificationService = async () => {
  try {
    console.log('初始化推送通知服务...');
    
    // 配置推送通知
    PushNotification.configure({
      // 必需的配置
      onRegister: function (token) {
        console.log('设备令牌:', token);
        // 这里可以将token发送到服务器
      },

      // 当通知被接收时调用
      onNotification: function (notification) {
        console.log('收到通知:', notification);
        
        // 处理通知点击
        handleNotificationClick(notification);
        
        // 处理iOS通知完成
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },

      // 权限请求
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // IOS专用配置
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // 创建通知频道（Android）
    if (Platform.OS === 'android') {
      createNotificationChannel();
    }

    // 请求通知权限
    const hasPermission = await requestNotificationPermission();
    console.log('通知权限状态:', hasPermission ? '已授权' : '未授权');

    // 清除所有计划通知（调试时使用）
    // await cancelAllScheduledNotifications();

    return true;
  } catch (error) {
    console.error('初始化推送通知服务失败:', error);
    return false;
  }
};

/**
 * 创建通知频道（Android）
 */
const createNotificationChannel = () => {
  PushNotification.createChannel(
    {
      channelId: NOTIFICATION_CONFIG.channelId,
      channelName: NOTIFICATION_CONFIG.channelName,
      channelDescription: NOTIFICATION_CONFIG.channelDescription,
      playSound: NOTIFICATION_CONFIG.playSound,
      soundName: NOTIFICATION_CONFIG.soundName,
      importance: NOTIFICATION_CONFIG.importance,
      vibrate: NOTIFICATION_CONFIG.vibrate,
    },
    (created) => console.log(`通知频道 ${created ? '创建成功' : '已存在'}`)
  );
};

/**
 * 请求通知权限
 */
export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      // Android权限在createChannel时会自动请求
      return true;
    } else if (Platform.OS === 'ios') {
      // iOS需要显式请求
      const result = await PushNotification.requestPermissions();
      return result.alert || result.badge || result.sound;
    }
    return false;
  } catch (error) {
    console.error('请求通知权限失败:', error);
    return false;
  }
};

/**
 * 检查通知权限状态
 */
export const checkNotificationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const result = await PushNotification.checkPermissions();
      return result.alert || result.badge || result.sound;
    }
    return true; // Android默认返回true，实际权限由系统控制
  } catch (error) {
    console.error('检查通知权限失败:', error);
    return false;
  }
};

/**
 * 调度闹钟通知
 */
export const scheduleAlarmNotification = async (alarm) => {
  try {
    if (!alarm.isEnabled) {
      console.log('闹钟未启用，跳过调度:', alarm.label);
      return false;
    }

    // 计算下一次触发时间
    const triggerTimes = alarmService.getNextTriggerTimes(alarm, 1);
    if (triggerTimes.length === 0) {
      console.log('没有找到有效的触发时间:', alarm.label);
      return false;
    }

    const triggerTime = triggerTimes[0];
    const now = new Date();
    
    // 如果触发时间在过去，跳过
    if (triggerTime < now) {
      console.log('触发时间已过，跳过调度:', alarm.label);
      return false;
    }

    // 通知配置
    const notificationConfig = {
      channelId: NOTIFICATION_CONFIG.channelId,
      id: `alarm_${alarm.id}_${triggerTime.getTime()}`,
      title: alarm.label || '闹钟提醒',
      message: getNotificationMessage(alarm),
      userInfo: {
        alarmId: alarm.id,
        type: NOTIFICATION_TYPES.ALARM,
        triggerTime: triggerTime.toISOString(),
        musicId: alarm.musicId,
        volume: alarm.volume || 0.7,
      },
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 1000,
      priority: 'high',
      importance: 'high',
      allowWhileIdle: true,
      repeatType: 'day', // 对于重复闹钟
      date: triggerTime,
    };

    // 添加重复规则
    if (alarm.repeat !== 'never') {
      notificationConfig.repeatType = 'day';
    }

    // 调度通知
    PushNotification.localNotificationSchedule(notificationConfig);
    
    console.log('闹钟通知已调度:', {
      alarm: alarm.label,
      triggerTime: triggerTime.toISOString(),
      notificationId: notificationConfig.id,
    });

    return true;
  } catch (error) {
    console.error('调度闹钟通知失败:', error);
    return false;
  }
};

/**
 * 调度贪睡通知
 */
export const scheduleSnoozeNotification = async (alarm, snoozeMinutes = 5) => {
  try {
    const snoozeTime = new Date(Date.now() + snoozeMinutes * 60 * 1000);
    
    const notificationConfig = {
      channelId: NOTIFICATION_CONFIG.channelId,
      id: `snooze_${alarm.id}_${Date.now()}`,
      title: '贪睡提醒',
      message: `${alarm.label || '闹钟'} - ${snoozeMinutes}分钟后再次提醒`,
      userInfo: {
        alarmId: alarm.id,
        type: NOTIFICATION_TYPES.SNOOZE,
        triggerTime: snoozeTime.toISOString(),
        musicId: alarm.musicId,
        volume: alarm.volume || 0.7,
      },
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 1000,
      priority: 'high',
      importance: 'high',
      allowWhileIdle: true,
      date: snoozeTime,
    };

    PushNotification.localNotificationSchedule(notificationConfig);
    
    console.log('贪睡通知已调度:', {
      alarm: alarm.label,
      snoozeMinutes,
      triggerTime: snoozeTime.toISOString(),
    });

    return true;
  } catch (error) {
    console.error('调度贪睡通知失败:', error);
    return false;
  }
};

/**
 * 调度休息提醒通知
 */
export const scheduleRestReminder = async (reminder) => {
  try {
    const triggerTime = new Date(reminder.time);
    
    const notificationConfig = {
      channelId: NOTIFICATION_CONFIG.channelId,
      id: `rest_${Date.now()}`,
      title: '休息提醒',
      message: reminder.message || '该休息一下了，站起来活动活动吧！',
      userInfo: {
        type: NOTIFICATION_TYPES.REMINDER,
        reminderId: reminder.id,
      },
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 500,
      priority: 'default',
      importance: 'default',
      date: triggerTime,
    };

    // 如果设置了重复，添加重复规则
    if (reminder.repeat) {
      notificationConfig.repeatType = reminder.repeat;
    }

    PushNotification.localNotificationSchedule(notificationConfig);
    
    console.log('休息提醒已调度:', {
      message: reminder.message,
      triggerTime: triggerTime.toISOString(),
    });

    return true;
  } catch (error) {
    console.error('调度休息提醒失败:', error);
    return false;
  }
};

/**
 * 处理通知点击事件
 */
const handleNotificationClick = async (notification) => {
  try {
    console.log('处理通知点击:', notification);
    
    const { userInfo } = notification;
    if (!userInfo) return;

    const { type, alarmId, musicId, volume } = userInfo;

    switch (type) {
      case NOTIFICATION_TYPES.ALARM:
        // 处理闹钟通知点击
        await handleAlarmNotification(alarmId, musicId, volume);
        break;
        
      case NOTIFICATION_TYPES.SNOOZE:
        // 处理贪睡通知点击
        await handleSnoozeNotification(alarmId);
        break;
        
      case NOTIFICATION_TYPES.REMINDER:
        // 处理休息提醒点击
        handleReminderNotification(userInfo.reminderId);
        break;
        
      case NOTIFICATION_TYPES.TEST:
        // 处理测试通知点击
        console.log('测试通知被点击');
        break;
    }
  } catch (error) {
    console.error('处理通知点击失败:', error);
  }
};

/**
 * 处理闹钟通知
 */
const handleAlarmNotification = async (alarmId, musicId, volume = 0.7) => {
  try {
    console.log('处理闹钟通知:', { alarmId, musicId, volume });
    
    // 获取当前Redux状态
    const state = store.getState();
    const alarm = state.alarm.alarms.find(a => a.id === alarmId);
    
    if (!alarm) {
      console.log('未找到对应的闹钟:', alarmId);
      return;
    }

    // 更新闹钟统计信息
    const updatedAlarm = {
      ...alarm,
      triggeredCount: (alarm.triggeredCount || 0) + 1,
      lastTriggered: new Date().toISOString(),
    };

    // 更新Redux状态
    store.dispatch(updateAlarm(updatedAlarm));

    // 播放音乐（如果设置了音乐）
    if (musicId) {
      const music = state.music.musicList.find(m => m.id === musicId);
      if (music) {
        // 设置音量
        await musicService.setVolume(volume);
        // 播放音乐
        await musicService.playMusic(music);
      }
    }

    // 发送震动（如果设置了震动）
    if (alarm.hasVibration) {
      // 这里可以使用react-native-haptic-feedback库
      console.log('触发震动');
    }

    // 显示全屏闹钟界面（可选）
    // navigation.navigate('AlarmTriggered', { alarm: updatedAlarm });

  } catch (error) {
    console.error('处理闹钟通知失败:', error);
  }
};

/**
 * 处理贪睡通知
 */
const handleSnoozeNotification = async (alarmId) => {
  try {
    console.log('处理贪睡通知:', alarmId);
    
    // 获取当前Redux状态
    const state = store.getState();
    const alarm = state.alarm.alarms.find(a => a.id === alarmId);
    
    if (!alarm) {
      console.log('未找到对应的闹钟:', alarmId);
      return;
    }

    // 更新贪睡统计
    const updatedAlarm = {
      ...alarm,
      snoozeCount: (alarm.snoozeCount || 0) + 1,
    };

    // 更新Redux状态
    store.dispatch(updateAlarm(updatedAlarm));

    // 播放音乐（如果设置了音乐）
    if (alarm.musicId) {
      const music = state.music.musicList.find(m => m.id === alarm.musicId);
      if (music) {
        await musicService.setVolume(alarm.volume || 0.7);
        await musicService.playMusic(music);
      }
    }

  } catch (error) {
    console.error('处理贪睡通知失败:', error);
  }
};

/**
 * 处理休息提醒通知
 */
const handleReminderNotification = (reminderId) => {
  console.log('处理休息提醒通知:', reminderId);
  // 这里可以跳转到休息提醒页面或显示相关界面
};

/**
 * 获取通知消息内容
 */
const getNotificationMessage = (alarm) => {
  const now = dayjs();
  const time = alarm.time;
  
  let message = `时间：${time}`;
  
  if (alarm.categoryName) {
    message += ` | 分类：${alarm.categoryName}`;
  }
  
  // 根据时间添加问候语
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 5 && hour < 12) {
    message += ' | 早上好！开始新的一天吧！';
  } else if (hour >= 12 && hour < 18) {
    message += ' | 下午好！保持高效！';
  } else if (hour >= 18 && hour < 22) {
    message += ' | 晚上好！放松一下吧！';
  } else {
    message += ' | 该休息了！';
  }
  
  return message;
};

/**
 * 调度所有启用的闹钟
 */
export const scheduleAllAlarms = async () => {
  try {
    const state = store.getState();
    const enabledAlarms = state.alarm.alarms.filter(alarm => alarm.isEnabled);
    
    console.log(`开始调度 ${enabledAlarms.length} 个启用的闹钟...`);
    
    // 取消所有已调度的闹钟通知
    await cancelAllScheduledAlarms();
    
    // 调度每个闹钟
    const results = await Promise.all(
      enabledAlarms.map(alarm => scheduleAlarmNotification(alarm))
    );
    
    const successCount = results.filter(result => result).length;
    console.log(`闹钟调度完成：${successCount}/${enabledAlarms.length} 个成功`);
    
    return successCount;
  } catch (error) {
    console.error('调度所有闹钟失败:', error);
    return 0;
  }
};

/**
 * 取消特定闹钟的所有通知
 */
export const cancelAlarmNotifications = async (alarmId) => {
  try {
    // 获取所有计划的通知
    const scheduledNotifications = await getScheduledNotifications();
    
    // 找到并取消该闹钟的所有通知
    const alarmNotifications = scheduledNotifications.filter(
      notification => notification.userInfo?.alarmId === alarmId
    );
    
    alarmNotifications.forEach(notification => {
      PushNotification.cancelLocalNotification(notification.id);
    });
    
    console.log(`已取消闹钟 ${alarmId} 的 ${alarmNotifications.length} 个通知`);
    
    return alarmNotifications.length;
  } catch (error) {
    console.error('取消闹钟通知失败:', error);
    return 0;
  }
};

/**
 * 取消所有已调度的闹钟通知
 */
export const cancelAllScheduledAlarms = async () => {
  try {
    const scheduledNotifications = await getScheduledNotifications();
    
    // 找到所有闹钟通知
    const alarmNotifications = scheduledNotifications.filter(
      notification => notification.userInfo?.type === NOTIFICATION_TYPES.ALARM
    );
    
    alarmNotifications.forEach(notification => {
      PushNotification.cancelLocalNotification(notification.id);
    });
    
    console.log(`已取消所有 ${alarmNotifications.length} 个闹钟通知`);
    
    return alarmNotifications.length;
  } catch (error) {
    console.error('取消所有闹钟通知失败:', error);
    return 0;
  }
};

/**
 * 取消所有计划的通知
 */
export const cancelAllScheduledNotifications = async () => {
  try {
    PushNotification.cancelAllLocalNotifications();
    console.log('已取消所有计划的通知');
    return true;
  } catch (error) {
    console.error('取消所有通知失败:', error);
    return false;
  }
};

/**
 * 获取所有计划的通知
 */
export const getScheduledNotifications = async () => {
  return new Promise((resolve) => {
    PushNotification.getScheduledLocalNotifications(resolve);
  });
};

/**
 * 发送测试通知
 */
export const sendTestNotification = async () => {
  try {
    const notificationConfig = {
      channelId: NOTIFICATION_CONFIG.channelId,
      title: '测试通知',
      message: '这是一个测试通知，用于验证通知功能是否正常工作。',
      userInfo: {
        type: NOTIFICATION_TYPES.TEST,
        timestamp: Date.now(),
      },
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 500,
    };

    PushNotification.localNotification(notificationConfig);
    
    console.log('测试通知已发送');
    return true;
  } catch (error) {
    console.error('发送测试通知失败:', error);
    return false;
  }
};

/**
 * 检查并修复通知调度
 */
export const checkAndFixNotificationSchedule = async () => {
  try {
    console.log('检查通知调度状态...');
    
    const state = store.getState();
    const enabledAlarms = state.alarm.alarms.filter(alarm => alarm.isEnabled);
    const scheduledNotifications = await getScheduledNotifications();
    
    // 检查每个启用的闹钟是否都有相应的通知
    const missingAlarms = enabledAlarms.filter(alarm => {
      const hasNotification = scheduledNotifications.some(
        notification => notification.userInfo?.alarmId === alarm.id
      );
      return !hasNotification;
    });
    
    if (missingAlarms.length > 0) {
      console.log(`发现 ${missingAlarms.length} 个闹钟缺少通知，正在修复...`);
      
      // 重新调度缺少通知的闹钟
      const results = await Promise.all(
        missingAlarms.map(alarm => scheduleAlarmNotification(alarm))
      );
      
      const successCount = results.filter(result => result).length;
      console.log(`通知调度修复完成：${successCount}/${missingAlarms.length} 个成功`);
      
      return successCount;
    } else {
      console.log('所有启用的闹钟都有相应的通知，无需修复');
      return 0;
    }
  } catch (error) {
    console.error('检查修复通知调度失败:', error);
    return 0;
  }
};

export default {
  initializeNotificationService,
  requestNotificationPermission,
  checkNotificationPermission,
  scheduleAlarmNotification,
  scheduleSnoozeNotification,
  scheduleRestReminder,
  scheduleAllAlarms,
  cancelAlarmNotifications,
  cancelAllScheduledAlarms,
  cancelAllScheduledNotifications,
  getScheduledNotifications,
  sendTestNotification,
  checkAndFixNotificationSchedule,
};