/**
 * 白噪音服务
 * 提供各种白噪音和自然声音播放功能
 * 支持混合音效、循环播放、渐入渐出效果
 */

import TrackPlayer from 'react-native-track-player';
import { Platform } from 'react-native';

// 白噪音类型定义
export const WHITE_NOISE_TYPES = {
  // 自然声音
  RAIN: {
    id: 'rain',
    name: '雨声',
    description: '轻柔的雨滴声，帮助放松入睡',
    category: 'natural',
    duration: 0, // 0表示无限循环
    icon: '🌧️',
    color: '#4A90E2',
  },
  THUNDERSTORM: {
    id: 'thunderstorm',
    name: '雷雨声',
    description: '伴随雷声的雨声，适合深度睡眠',
    category: 'natural',
    duration: 0,
    icon: '⛈️',
    color: '#2C3E50',
  },
  OCEAN: {
    id: 'ocean',
    name: '海浪声',
    description: '海浪拍打沙滩的声音，平静心灵',
    category: 'natural',
    duration: 0,
    icon: '🌊',
    color: '#3498DB',
  },
  FOREST: {
    id: 'forest',
    name: '森林声',
    description: '鸟鸣和树叶沙沙声，自然催眠',
    category: 'natural',
    duration: 0,
    icon: '🌲',
    color: '#27AE60',
  },
  CAMPFIRE: {
    id: 'campfire',
    name: '篝火声',
    description: '柴火燃烧的噼啪声，温暖舒适',
    category: 'natural',
    duration: 0,
    icon: '🔥',
    color: '#E67E22',
  },
  WIND: {
    id: 'wind',
    name: '风声',
    description: '轻柔的风声，让人放松',
    category: 'natural',
    duration: 0,
    icon: '💨',
    color: '#BDC3C7',
  },
  
  // 白噪音
  WHITE: {
    id: 'white',
    name: '白噪音',
    description: '均匀的音频频谱，掩盖环境噪音',
    category: 'noise',
    duration: 0,
    icon: '📻',
    color: '#FFFFFF',
  },
  PINK: {
    id: 'pink',
    name: '粉红噪音',
    description: '低频增强，促进深度睡眠',
    category: 'noise',
    duration: 0,
    icon: '🎛️',
    color: '#E84393',
  },
  BROWN: {
    id: 'brown',
    name: '布朗噪音',
    description: '更强调低频，类似瀑布声',
    category: 'noise',
    duration: 0,
    icon: '🌊',
    color: '#795548',
  },
  
  // 环境声音
  FAN: {
    id: 'fan',
    name: '风扇声',
    description: '风扇转动的声音，传统助眠方式',
    category: 'environment',
    duration: 0,
    icon: '🌀',
    color: '#7F8C8D',
  },
  AIR_CONDITIONER: {
    id: 'air_conditioner',
    name: '空调声',
    description: '空调运行的低频声音',
    category: 'environment',
    duration: 0,
    icon: '❄️',
    color: '#1ABC9C',
  },
  TRAIN: {
    id: 'train',
    name: '火车声',
    description: '火车行驶的规律声音',
    category: 'environment',
    duration: 0,
    icon: '🚂',
    color: '#34495E',
  },
};

// 音频资源映射（在开发阶段使用本地模拟，生产环境使用真实音频）
const AUDIO_RESOURCES = {
  rain: Platform.select({
    ios: { uri: 'https://www.soundjay.com/nature/sounds/rain-01.mp3' },
    android: { uri: 'asset:///audio/rain.mp3' },
  }),
  thunderstorm: Platform.select({
    ios: { uri: 'https://www.soundjay.com/nature/sounds/thunder-01.mp3' },
    android: { uri: 'asset:///audio/thunderstorm.mp3' },
  }),
  ocean: Platform.select({
    ios: { uri: 'https://www.soundjay.com/nature/sounds/ocean-wave-01.mp3' },
    android: { uri: 'asset:///audio/ocean.mp3' },
  }),
  forest: Platform.select({
    ios: { uri: 'https://www.soundjay.com/nature/sounds/forest-01.mp3' },
    android: { uri: 'asset:///audio/forest.mp3' },
  }),
  campfire: Platform.select({
    ios: { uri: 'https://www.soundjay.com/nature/sounds/fire-01.mp3' },
    android: { uri: 'asset:///audio/campfire.mp3' },
  }),
  wind: Platform.select({
    ios: { uri: 'https://www.soundjay.com/nature/sounds/wind-01.mp3' },
    android: { uri: 'asset:///audio/wind.mp3' },
  }),
  white: Platform.select({
    ios: { uri: 'https://www.soundjay.com/noise/sounds/white-noise-01.mp3' },
    android: { uri: 'asset:///audio/white_noise.mp3' },
  }),
  pink: Platform.select({
    ios: { uri: 'https://www.soundjay.com/noise/sounds/pink-noise-01.mp3' },
    android: { uri: 'asset:///audio/pink_noise.mp3' },
  }),
  brown: Platform.select({
    ios: { uri: 'https://www.soundjay.com/noise/sounds/brown-noise-01.mp3' },
    android: { uri: 'asset:///audio/brown_noise.mp3' },
  }),
  fan: Platform.select({
    ios: { uri: 'https://www.soundjay.com/machine/sounds/fan-01.mp3' },
    android: { uri: 'asset:///audio/fan.mp3' },
  }),
  air_conditioner: Platform.select({
    ios: { uri: 'https://www.soundjay.com/machine/sounds/air-conditioner-01.mp3' },
    android: { uri: 'asset:///audio/air_conditioner.mp3' },
  }),
  train: Platform.select({
    ios: { uri: 'https://www.soundjay.com/transportation/sounds/train-01.mp3' },
    android: { uri: 'asset:///audio/train.mp3' },
  }),
};

// 默认混合配置
const DEFAULT_MIX_CONFIG = {
  volume: 0.7,
  fadeInDuration: 3000, // 3秒渐入
  fadeOutDuration: 5000, // 5秒渐出
  loop: true,
};

class WhiteNoiseService {
  constructor() {
    this.currentNoises = new Map(); // 当前正在播放的噪音
    this.mixConfig = { ...DEFAULT_MIX_CONFIG };
    this.isInitialized = false;
  }

  /**
   * 初始化白噪音服务
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // 确保TrackPlayer已初始化
      await TrackPlayer.setupPlayer();
      
      // 设置音频会话（iOS）
      if (Platform.OS === 'ios') {
        await TrackPlayer.updateOptions({
          capabilities: [
            TrackPlayer.CAPABILITY_PLAY,
            TrackPlayer.CAPABILITY_PAUSE,
            TrackPlayer.CAPABILITY_STOP,
          ],
          compactCapabilities: [
            TrackPlayer.CAPABILITY_PLAY,
            TrackPlayer.CAPABILITY_PAUSE,
          ],
        });
      }

      this.isInitialized = true;
      console.log('白噪音服务初始化成功');
    } catch (error) {
      console.error('白噪音服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 播放单个白噪音
   */
  async playNoise(noiseType, volume = 0.7) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const noiseConfig = WHITE_NOISE_TYPES[noiseType.toUpperCase()];
    if (!noiseConfig) {
      throw new Error(`未知的白噪音类型: ${noiseType}`);
    }

    // 停止当前相同类型的噪音
    if (this.currentNoises.has(noiseType)) {
      await this.stopNoise(noiseType);
    }

    const track = {
      id: noiseConfig.id,
      url: AUDIO_RESOURCES[noiseConfig.id],
      title: noiseConfig.name,
      artist: '白噪音',
      artwork: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${noiseConfig.color}"/><text x="50" y="50" font-size="30" text-anchor="middle" dy=".3em" fill="white">${noiseConfig.icon}</text></svg>`,
      duration: noiseConfig.duration,
    };

    try {
      await TrackPlayer.add(track);
      await TrackPlayer.play();
      
      // 设置音量（渐入效果）
      await TrackPlayer.setVolume(0);
      await TrackPlayer.setVolume(volume, { duration: this.mixConfig.fadeInDuration });

      this.currentNoises.set(noiseType, {
        id: noiseConfig.id,
        volume,
        startTime: Date.now(),
      });

      return noiseConfig;
    } catch (error) {
      console.error('播放白噪音失败:', error);
      throw error;
    }
  }

  /**
   * 播放混合白噪音
   */
  async playMix(noiseTypes, volumes = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 停止所有当前噪音
    await this.stopAll();

    const results = [];
    for (let i = 0; i < noiseTypes.length; i++) {
      const noiseType = noiseTypes[i];
      const volume = volumes[i] || this.mixConfig.volume;
      
      try {
        const result = await this.playNoise(noiseType, volume);
        results.push(result);
      } catch (error) {
        console.error(`播放混合噪音 ${noiseType} 失败:`, error);
      }
    }

    return results;
  }

  /**
   * 停止特定白噪音
   */
  async stopNoise(noiseType, immediate = false) {
    if (!this.currentNoises.has(noiseType)) {
      return;
    }

    const noiseInfo = this.currentNoises.get(noiseType);
    
    try {
      if (!immediate && this.mixConfig.fadeOutDuration > 0) {
        // 渐出效果
        await TrackPlayer.setVolume(0, { duration: this.mixConfig.fadeOutDuration });
        await new Promise(resolve => setTimeout(resolve, this.mixConfig.fadeOutDuration));
      }

      // 从播放列表中移除
      const tracks = await TrackPlayer.getQueue();
      const trackIndex = tracks.findIndex(track => track.id === noiseInfo.id);
      if (trackIndex !== -1) {
        await TrackPlayer.remove(trackIndex);
      }

      this.currentNoises.delete(noiseType);
    } catch (error) {
      console.error('停止白噪音失败:', error);
    }
  }

  /**
   * 停止所有白噪音
   */
  async stopAll(immediate = false) {
    const noiseTypes = Array.from(this.currentNoises.keys());
    
    for (const noiseType of noiseTypes) {
      await this.stopNoise(noiseType, immediate);
    }
  }

  /**
   * 暂停所有白噪音
   */
  async pauseAll() {
    try {
      await TrackPlayer.pause();
    } catch (error) {
      console.error('暂停白噪音失败:', error);
    }
  }

  /**
   * 恢复播放
   */
  async resumeAll() {
    try {
      await TrackPlayer.play();
    } catch (error) {
      console.error('恢复白噪音失败:', error);
    }
  }

  /**
   * 调整音量
   */
  async adjustVolume(noiseType, volume, fadeDuration = 1000) {
    if (!this.currentNoises.has(noiseType)) {
      throw new Error(`未找到正在播放的噪音: ${noiseType}`);
    }

    try {
      await TrackPlayer.setVolume(volume, { duration: fadeDuration });
      
      const noiseInfo = this.currentNoises.get(noiseType);
      noiseInfo.volume = volume;
      this.currentNoises.set(noiseType, noiseInfo);
    } catch (error) {
      console.error('调整音量失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前播放状态
   */
  async getPlaybackState() {
    try {
      const state = await TrackPlayer.getState();
      const currentTrack = await TrackPlayer.getCurrentTrack();
      const position = await TrackPlayer.getPosition();
      const duration = await TrackPlayer.getDuration();
      const volume = await TrackPlayer.getVolume();

      return {
        state,
        currentTrack,
        position,
        duration,
        volume,
        activeNoises: Array.from(this.currentNoises.entries()).map(([type, info]) => ({
          type,
          ...info,
        })),
      };
    } catch (error) {
      console.error('获取播放状态失败:', error);
      return null;
    }
  }

  /**
   * 获取推荐的白噪音组合
   */
  getRecommendedMixes() {
    return [
      {
        id: 'deep_sleep',
        name: '深度睡眠',
        description: '促进深度睡眠的最佳组合',
        noises: ['rain', 'pink'],
        volumes: [0.6, 0.4],
        icon: '😴',
      },
      {
        id: 'relaxation',
        name: '放松冥想',
        description: '帮助放松和冥想',
        noises: ['ocean', 'wind'],
        volumes: [0.7, 0.3],
        icon: '🧘',
      },
      {
        id: 'focus',
        name: '专注工作',
        description: '提高注意力和工作效率',
        noises: ['white', 'fan'],
        volumes: [0.5, 0.5],
        icon: '💻',
      },
      {
        id: 'stress_relief',
        name: '压力缓解',
        description: '缓解压力和焦虑',
        noises: ['forest', 'campfire'],
        volumes: [0.6, 0.4],
        icon: '🌿',
      },
    ];
  }

  /**
   * 设置混合配置
   */
  setMixConfig(config) {
    this.mixConfig = { ...this.mixConfig, ...config };
  }

  /**
   * 清理资源
   */
  async cleanup() {
    await this.stopAll(true);
    this.currentNoises.clear();
    this.isInitialized = false;
  }
}

// 创建单例实例
const whiteNoiseService = new WhiteNoiseService();

export default whiteNoiseService;