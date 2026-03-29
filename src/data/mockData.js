/**
 * 测试数据生成器
 * 用于演示应用功能
 */

// 生成随机ID
const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// 音乐分类
const musicCategories = ['晨间唤醒', '工作专注', '放松休息', '睡眠助眠', '运动活力', '学习思考'];

// 艺术家列表
const artists = [
  '周杰伦', '林俊杰', '邓紫棋', '五月天', 'Taylor Swift', 'Ed Sheeran',
  'Adele', 'Coldplay', 'Imagine Dragons', 'Maroon 5', 'Bruno Mars', 'Billie Eilish'
];

// 专辑列表
const albums = [
  '范特西', '七里香', '跨时代', '伟大的渺小', '启示录', '1989',
  '÷', '25', 'A Head Full of Dreams', 'Evolve', 'Red Pill Blues', 'When We All Fall Asleep, Where Do We Go?'
];

// 音乐类型
const genres = ['流行', '摇滚', '电子', '古典', '爵士', '民谣', '嘻哈', 'R&B'];

// 生成随机音乐数据
export const generateMockMusic = (count = 20) => {
  const mockMusic = [];
  
  for (let i = 0; i < count; i++) {
    const artist = artists[Math.floor(Math.random() * artists.length)];
    const album = albums[Math.floor(Math.random() * albums.length)];
    const genre = genres[Math.floor(Math.random() * genres.length)];
    const category = musicCategories[Math.floor(Math.random() * musicCategories.length)];
    
    // 生成随机时长（90-300秒）
    const duration = Math.floor(Math.random() * 210) + 90;
    const durationFormatted = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
    
    // 生成随机年份
    const year = Math.floor(Math.random() * 20) + 2000;
    
    // 随机添加到播放列表
    const playlists = [];
    const playlistCount = Math.floor(Math.random() * 3);
    for (let j = 0; j < playlistCount; j++) {
      const playlist = ['morning', 'work', 'relax', 'sleep'][Math.floor(Math.random() * 4)];
      if (!playlists.includes(playlist)) {
        playlists.push(playlist);
      }
    }
    
    mockMusic.push({
      id: generateId(),
      title: `歌曲 ${i + 1}`,
      artist,
      album,
      duration,
      durationFormatted,
      genre,
      category,
      year,
      isFavorite: Math.random() > 0.7,
      playlists,
      addedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      // 模拟专辑封面URL（使用随机颜色）
      cover: `https://via.placeholder.com/300/${Math.floor(Math.random()*16777215).toString(16)}/FFFFFF?text=${encodeURIComponent(album)}`,
    });
  }
  
  return mockMusic;
};

// 生成测试闹钟数据
export const generateMockAlarms = (count = 10) => {
  const mockAlarms = [];
  const categories = ['work', 'rest', 'focus', 'custom'];
  const categoryNames = {
    work: '上班途中',
    rest: '休息提醒',
    focus: '专注模式',
    custom: '自定义'
  };
  
  for (let i = 0; i < count; i++) {
    // 生成随机时间（6:00 - 22:00之间）
    const hour = Math.floor(Math.random() * 16) + 6;
    const minute = Math.floor(Math.random() * 60);
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // 随机选择分类
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    // 随机重复规则
    const repeatOptions = ['never', 'daily', 'weekdays', 'weekends', 'custom'];
    const repeat = repeatOptions[Math.floor(Math.random() * repeatOptions.length)];
    
    // 自定义重复天数（如果repeat为custom）
    const repeatDays = repeat === 'custom' 
      ? [1, 2, 3, 4, 5].filter(() => Math.random() > 0.5)
      : [];
    
    // 随机音量（0.3 - 1.0）
    const volume = Math.floor(Math.random() * 8) / 10 + 0.3;
    
    mockAlarms.push({
      id: generateId(),
      time,
      label: `闹钟 ${i + 1}`,
      category,
      categoryName: categoryNames[category],
      isEnabled: Math.random() > 0.3,
      repeat,
      repeatDays,
      volume,
      hasVibration: Math.random() > 0.5,
      hasSnooze: Math.random() > 0.3,
      snoozeMinutes: Math.floor(Math.random() * 5) + 5,
      fadeInDuration: Math.floor(Math.random() * 3) + 1,
      // 随机音乐（从音乐列表中选择）
      musicId: generateId(),
      musicTitle: `音乐 ${Math.floor(Math.random() * 20) + 1}`,
      createdDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastModified: new Date().toISOString(),
      // 统计信息
      triggeredCount: Math.floor(Math.random() * 50),
      snoozeCount: Math.floor(Math.random() * 10),
      lastTriggered: Math.random() > 0.5 
        ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
        : null,
    });
  }
  
  return mockAlarms;
};

// 生成播放列表数据
export const generateMockPlaylists = () => {
  return [
    {
      id: 'morning',
      name: '晨间唤醒',
      description: '清新活力的音乐，唤醒美好一天',
      color: '#FF8A65',
      icon: 'weather-sunny',
      count: 12,
      createdDate: new Date().toISOString(),
      isDefault: true,
    },
    {
      id: 'work',
      name: '工作专注',
      description: '提高工作效率的专注音乐',
      color: '#4FC3F7',
      icon: 'briefcase',
      count: 8,
      createdDate: new Date().toISOString(),
      isDefault: true,
    },
    {
      id: 'relax',
      name: '放松休息',
      description: '放松身心，缓解压力',
      color: '#81C784',
      icon: 'leaf',
      count: 15,
      createdDate: new Date().toISOString(),
      isDefault: true,
    },
    {
      id: 'sleep',
      name: '睡眠助眠',
      description: '帮助入睡的舒缓音乐',
      color: '#9575CD',
      icon: 'moon-waning-crescent',
      count: 10,
      createdDate: new Date().toISOString(),
      isDefault: true,
    },
    {
      id: 'study',
      name: '学习思考',
      description: '提高学习效率的纯音乐',
      color: '#FFB74D',
      icon: 'book-open-variant',
      count: 7,
      createdDate: new Date().toISOString(),
      isDefault: false,
    },
    {
      id: 'workout',
      name: '运动活力',
      description: '运动时的动感音乐',
      color: '#F06292',
      icon: 'dumbbell',
      count: 9,
      createdDate: new Date().toISOString(),
      isDefault: false,
    },
  ];
};

// 生成应用统计数据
export const generateAppStats = () => {
  return {
    alarmsCreated: 42,
    alarmsTriggered: 128,
    totalMusicPlayTime: '45小时28分钟',
    favoriteSongs: 8,
    playlistsCreated: 3,
    mostUsedCategory: '上班途中',
    mostPlayedSong: '歌曲 12',
    appUsageDays: 28,
    lastBackup: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    version: '1.0.0',
    buildNumber: '20240329.1',
  };
};

// 生成用户设置
export const generateDefaultSettings = () => {
  return {
    theme: 'light', // light, dark, auto
    language: 'zh-CN',
    timeFormat: '24h', // 12h, 24h
    defaultVolume: 0.7,
    defaultVibration: true,
    defaultSnooze: true,
    defaultSnoozeMinutes: 10,
    defaultFadeIn: true,
    defaultFadeInDuration: 2,
    musicLibraryPath: null,
    autoBackup: true,
    backupInterval: 7, // 天
    dataRetentionDays: 90,
    notificationEnabled: true,
    notificationSound: 'default',
    hapticFeedback: true,
    // 闹钟分类设置
    alarmCategories: [
      { id: 'work', name: '上班途中', color: '#2196F3', icon: 'briefcase', enabled: true },
      { id: 'rest', name: '休息提醒', color: '#4CAF50', icon: 'coffee', enabled: true },
      { id: 'focus', name: '专注模式', color: '#FF9800', icon: 'timer', enabled: true },
      { id: 'custom', name: '自定义', color: '#9C27B0', icon: 'pencil', enabled: true },
    ],
    // 音乐播放设置
    musicEqualizer: 'normal', // normal, pop, rock, jazz, classical, custom
    crossfadeEnabled: false,
    crossfadeDuration: 3, // 秒
    lyricsEnabled: true,
    playbackQuality: 'high', // low, medium, high
    // 隐私设置
    analyticsEnabled: true,
    crashReportsEnabled: true,
  };
};

// 导出所有测试数据
export default {
  generateMockMusic,
  generateMockAlarms,
  generateMockPlaylists,
  generateAppStats,
  generateDefaultSettings,
};