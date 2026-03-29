import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  theme: 'light', // 'light' | 'dark' | 'auto'
  language: 'zh-CN',
  volume: 0.8,
  vibration: true,
  snoozeDuration: 5, // 分钟
  fadeInDuration: 10, // 秒
  notificationSound: true,
  showWeekdays: true,
  alarmCategories: [
    {id: 'work', name: '上班途中', color: '#2196F3', icon: 'briefcase'},
    {id: 'break', name: '休息提醒', color: '#4CAF50', icon: 'coffee'},
    {id: 'focus', name: '专注模式', color: '#FF9800', icon: 'brain'},
    {id: 'custom', name: '自定义', color: '#9C27B0', icon: 'star'},
  ],
  selectedCategory: 'work',
  timeFormat: '24h', // '24h' | '12h'
  firstDayOfWeek: 1, // 1 = Monday, 0 = Sunday
  backupEnabled: false,
  backupFrequency: 'daily', // 'daily', 'weekly', 'monthly'
  
  // 推送通知设置
  notificationEnabled: true,
  notificationSoundType: 'default', // 'default', 'custom', 'none'
  hapticFeedback: true,
  showNotificationOnLockScreen: true,
  showNotificationPreview: true,
  ledNotification: true,
  notificationPriority: 'high', // 'min', 'low', 'default', 'high', 'max'
  notificationTimeout: 30, // 通知显示时间（秒）
  allowSnooze: true,
  allowDismiss: true,
  showRemainingTime: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setVolume: (state, action) => {
      state.volume = Math.max(0, Math.min(1, action.payload));
    },
    toggleVibration: state => {
      state.vibration = !state.vibration;
    },
    setSnoozeDuration: (state, action) => {
      state.snoozeDuration = action.payload;
    },
    setFadeInDuration: (state, action) => {
      state.fadeInDuration = action.payload;
    },
    toggleNotificationSound: state => {
      state.notificationSound = !state.notificationSound;
    },
    toggleShowWeekdays: state => {
      state.showWeekdays = !state.showWeekdays;
    },
    addCategory: (state, action) => {
      state.alarmCategories.push(action.payload);
    },
    updateCategory: (state, action) => {
      const {id, updates} = action.payload;
      const index = state.alarmCategories.findIndex(cat => cat.id === id);
      if (index !== -1) {
        state.alarmCategories[index] = {
          ...state.alarmCategories[index],
          ...updates,
        };
      }
    },
    deleteCategory: (state, action) => {
      state.alarmCategories = state.alarmCategories.filter(
        cat => cat.id !== action.payload,
      );
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setTimeFormat: (state, action) => {
      state.timeFormat = action.payload;
    },
    setFirstDayOfWeek: (state, action) => {
      state.firstDayOfWeek = action.payload;
    },
    toggleBackupEnabled: state => {
      state.backupEnabled = !state.backupEnabled;
    },
    setBackupFrequency: (state, action) => {
      state.backupFrequency = action.payload;
    },
    resetSettings: state => {
      return {
        ...initialState,
        alarmCategories: state.alarmCategories, // 保留自定义分类
      };
    },
    
    // 推送通知设置相关动作
    updateSettings: (state, action) => {
      return {
        ...state,
        ...action.payload,
      };
    },
    setNotificationEnabled: (state, action) => {
      state.notificationEnabled = action.payload;
    },
    setNotificationSoundType: (state, action) => {
      state.notificationSoundType = action.payload;
    },
    toggleNotificationEnabled: state => {
      state.notificationEnabled = !state.notificationEnabled;
    },
    toggleHapticFeedback: state => {
      state.hapticFeedback = !state.hapticFeedback;
    },
    toggleShowNotificationOnLockScreen: state => {
      state.showNotificationOnLockScreen = !state.showNotificationOnLockScreen;
    },
    toggleShowNotificationPreview: state => {
      state.showNotificationPreview = !state.showNotificationPreview;
    },
    toggleLedNotification: state => {
      state.ledNotification = !state.ledNotification;
    },
    setNotificationPriority: (state, action) => {
      state.notificationPriority = action.payload;
    },
    setNotificationTimeout: (state, action) => {
      state.notificationTimeout = Math.max(5, Math.min(300, action.payload));
    },
    toggleAllowSnooze: state => {
      state.allowSnooze = !state.allowSnooze;
    },
    toggleAllowDismiss: state => {
      state.allowDismiss = !state.allowDismiss;
    },
    toggleShowRemainingTime: state => {
      state.showRemainingTime = !state.showRemainingTime;
    },
  },
});

export const {
  setTheme,
  setLanguage,
  setVolume,
  toggleVibration,
  setSnoozeDuration,
  setFadeInDuration,
  toggleNotificationSound,
  toggleShowWeekdays,
  addCategory,
  updateCategory,
  deleteCategory,
  setSelectedCategory,
  setTimeFormat,
  setFirstDayOfWeek,
  toggleBackupEnabled,
  setBackupFrequency,
  resetSettings,
  
  // 推送通知设置相关动作
  updateSettings,
  setNotificationEnabled,
  setNotificationSoundType,
  toggleNotificationEnabled,
  toggleHapticFeedback,
  toggleShowNotificationOnLockScreen,
  toggleShowNotificationPreview,
  toggleLedNotification,
  setNotificationPriority,
  setNotificationTimeout,
  toggleAllowSnooze,
  toggleAllowDismiss,
  toggleShowRemainingTime,
} = settingsSlice.actions;

export default settingsSlice.reducer;