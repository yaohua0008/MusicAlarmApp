/**
 * 音乐服务模块
 * 处理音乐播放、音乐库管理和播放列表功能
 * 集成本地音乐和在线音乐
 */

import TrackPlayer, {
  Capability,
  Event,
  State,
  RepeatMode,
} from 'react-native-track-player';
import { Platform } from 'react-native';
import { getMusicLibrary, saveMusicLibrary } from '../utils/storageUtils';

// 导入在线音乐服务
import onlineMusicService from './onlineMusicService';
import localMusicScanner from './localMusicScanner';

// 默认音乐库（用于演示）
const DEFAULT_MUSIC_LIBRARY = [
  {
    id: '1',
    title: '清晨阳光',
    artist: '自然之声',
    album: '放松音乐',
    url: 'https://example.com/music/morning-sunshine.mp3',
    duration: 180, // 3分钟
    category: 'relax',
    cover: 'https://example.com/covers/morning.jpg',
    isLocal: false,
  },
  {
    id: '2',
    title: '上班路上',
    artist: '节奏大师',
    album: '通勤音乐',
    url: 'https://example.com/music/commute-beat.mp3',
    duration: 240, // 4分钟
    category: 'work',
    cover: 'https://example.com/covers/commute.jpg',
    isLocal: false,
  },
  {
    id: '3',
    title: '专注时刻',
    artist: '白噪音',
    album: '工作背景音',
    url: 'https://example.com/music/focus-noise.mp3',
    duration: 300, // 5分钟
    category: 'focus',
    cover: 'https://example.com/covers/focus.jpg',
    isLocal: false,
  },
  {
    id: '4',
    title: '午休时光',
    artist: '轻音乐团',
    album: '休息音乐',
    url: 'https://example.com/music/lunch-break.mp3',
    duration: 150, // 2.5分钟
    category: 'rest',
    cover: 'https://example.com/covers/lunch.jpg',
    isLocal: false,
  },
  {
    id: '5',
    title: '下班回家',
    artist: '放松乐队',
    album: '回家路上',
    url: 'https://example.com/music/going-home.mp3',
    duration: 210, // 3.5分钟
    category: 'relax',
    cover: 'https://example.com/covers/home.jpg',
    isLocal: false,
  },
];

// 音乐分类
const MUSIC_CATEGORIES = [
  { id: 'work', name: '工作', icon: 'briefcase', color: '#4A90E2' },
  { id: 'relax', name: '放松', icon: 'coffee', color: '#50E3C2' },
  { id: 'focus', name: '专注', icon: 'target', color: '#9013FE' },
  { id: 'rest', name: '休息', icon: 'moon', color: '#F5A623' },
  { id: 'exercise', name: '运动', icon: 'dumbbell', color: '#7ED321' },
  { id: 'all', name: '全部', icon: 'music', color: '#9B9B9B' },
];

/**
 * 初始化音乐播放器
 */
export const initializeMusicPlayer = async () => {
  try {
    // 设置播放器能力
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
        Capability.SeekTo,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
    });

    // 设置默认重复模式
    await TrackPlayer.setRepeatMode(RepeatMode.Off);

    console.log('音乐播放器初始化成功');
    return true;
  } catch (error) {
    console.error('音乐播放器初始化失败:', error);
    return false;
  }
};

/**
 * 获取音乐库
 * @param {string} source - 音乐源：'local', 'online', 'all'
 * @returns {Promise<Array>} 音乐列表
 */
export const getMusicLibraryData = async (source = 'all') => {
  try {
    const savedLibrary = await getMusicLibrary();
    let musicList = savedLibrary && savedLibrary.length > 0 ? savedLibrary : DEFAULT_MUSIC_LIBRARY;
    
    // 根据音乐源过滤
    if (source === 'local') {
      return musicList.filter(music => music.isLocal === true);
    } else if (source === 'online') {
      return musicList.filter(music => music.isLocal === false);
    }
    
    return musicList;
  } catch (error) {
    console.error('获取音乐库失败:', error);
    return DEFAULT_MUSIC_LIBRARY;
  }
};

/**
 * 加载本地音乐
 */
export const loadLocalMusic = async () => {
  try {
    // 获取本地扫描的音乐
    const localMusic = await localMusicScanner.getLocalMusic();
    
    if (localMusic.length > 0) {
      // 获取现有的音乐库
      const existingLibrary = await getMusicLibraryData();
      
      // 合并本地音乐到现有库中（避免重复）
      const mergedLibrary = [...existingLibrary];
      for (const music of localMusic) {
        const isDuplicate = existingLibrary.some(
          existing => existing.id === music.id && existing.isLocal === true
        );
        if (!isDuplicate) {
          mergedLibrary.push({
            ...music,
            isLocal: true,
          });
        }
      }
      
      // 保存合并后的音乐库
      await saveMusicLibrary(mergedLibrary);
      return localMusic;
    }
    
    return [];
  } catch (error) {
    console.error('加载本地音乐失败:', error);
    return [];
  }
};

/**
 * 加载在线音乐
 */
export const loadOnlineMusic = async () => {
  try {
    // 获取每日推荐歌曲
    const dailyRecommendations = await onlineMusicService.getDailyRecommendSongs();
    
    if (dailyRecommendations.length > 0) {
      // 获取现有的音乐库
      const existingLibrary = await getMusicLibraryData();
      
      // 合并在线音乐到现有库中
      const mergedLibrary = [...existingLibrary];
      for (const music of dailyRecommendations) {
        const isDuplicate = existingLibrary.some(
          existing => existing.id === music.id && existing.platform === music.platform && existing.isLocal === false
        );
        if (!isDuplicate) {
          mergedLibrary.push({
            ...music,
            isLocal: false,
          });
        }
      }
      
      // 保存合并后的音乐库
      await saveMusicLibrary(mergedLibrary);
      return dailyRecommendations;
    }
    
    return [];
  } catch (error) {
    console.error('加载在线音乐失败:', error);
    return [];
  }
};

/**
 * 添加音乐到库
 */
export const addMusicToLibrary = async (music) => {
  try {
    const library = await getMusicLibraryData();
    const newMusic = {
      ...music,
      id: Date.now().toString(),
      addedAt: new Date().toISOString(),
    };
    
    const updatedLibrary = [...library, newMusic];
    await saveMusicLibrary(updatedLibrary);
    return { success: true, music: newMusic };
  } catch (error) {
    console.error('添加音乐失败:', error);
    return { success: false, error };
  }
};

/**
 * 从库中删除音乐
 */
export const removeMusicFromLibrary = async (musicId) => {
  try {
    const library = await getMusicLibraryData();
    const updatedLibrary = library.filter(music => music.id !== musicId);
    await saveMusicLibrary(updatedLibrary);
    return { success: true };
  } catch (error) {
    console.error('删除音乐失败:', error);
    return { success: false, error };
  }
};

/**
 * 创建播放列表
 */
export const createPlaylist = async (name, musicIds) => {
  try {
    const library = await getMusicLibraryData();
    const playlist = {
      id: Date.now().toString(),
      name,
      musicIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // 保存播放列表到存储
    const playlists = await getPlaylists();
    const updatedPlaylists = [...playlists, playlist];
    await savePlaylists(updatedPlaylists);
    
    return { success: true, playlist };
  } catch (error) {
    console.error('创建播放列表失败:', error);
    return { success: false, error };
  }
};

/**
 * 播放音乐
 */
export const playMusic = async (music) => {
  try {
    // 停止当前播放
    await TrackPlayer.reset();
    
    // 添加到播放队列
    await TrackPlayer.add([{
      id: music.id,
      url: music.url,
      title: music.title,
      artist: music.artist,
      artwork: music.cover,
      duration: music.duration,
    }]);
    
    // 开始播放
    await TrackPlayer.play();
    
    return { success: true };
  } catch (error) {
    console.error('播放音乐失败:', error);
    return { success: false, error };
  }
};

/**
 * 播放播放列表
 */
export const playPlaylist = async (playlist) => {
  try {
    const library = await getMusicLibraryData();
    const playlistMusic = library.filter(music => 
      playlist.musicIds.includes(music.id)
    );
    
    if (playlistMusic.length === 0) {
      return { success: false, error: '播放列表为空' };
    }
    
    // 停止当前播放
    await TrackPlayer.reset();
    
    // 添加到播放队列
    const tracks = playlistMusic.map(music => ({
      id: music.id,
      url: music.url,
      title: music.title,
      artist: music.artist,
      artwork: music.cover,
      duration: music.duration,
    }));
    
    await TrackPlayer.add(tracks);
    
    // 开始播放
    await TrackPlayer.play();
    
    return { success: true };
  } catch (error) {
    console.error('播放播放列表失败:', error);
    return { success: false, error };
  }
};

/**
 * 控制播放器
 */
export const controlMusicPlayer = {
  play: async () => {
    try {
      await TrackPlayer.play();
      return true;
    } catch (error) {
      console.error('播放失败:', error);
      return false;
    }
  },
  
  pause: async () => {
    try {
      await TrackPlayer.pause();
      return true;
    } catch (error) {
      console.error('暂停失败:', error);
      return false;
    }
  },
  
  stop: async () => {
    try {
      await TrackPlayer.stop();
      return true;
    } catch (error) {
      console.error('停止失败:', error);
      return false;
    }
  },
  
  skipToNext: async () => {
    try {
      await TrackPlayer.skipToNext();
      return true;
    } catch (error) {
      console.error('下一首失败:', error);
      return false;
    }
  },
  
  skipToPrevious: async () => {
    try {
      await TrackPlayer.skipToPrevious();
      return true;
    } catch (error) {
      console.error('上一首失败:', error);
      return false;
    }
  },
  
  seekTo: async (position) => {
    try {
      await TrackPlayer.seekTo(position);
      return true;
    } catch (error) {
      console.error('跳转失败:', error);
      return false;
    }
  },
  
  setVolume: async (volume) => {
    try {
      await TrackPlayer.setVolume(volume);
      return true;
    } catch (error) {
      console.error('设置音量失败:', error);
      return false;
    }
  },
};

/**
 * 获取播放器状态
 */
export const getPlayerState = async () => {
  try {
    const state = await TrackPlayer.getState();
    const position = await TrackPlayer.getPosition();
    const duration = await TrackPlayer.getDuration();
    const currentTrack = await TrackPlayer.getCurrentTrack();
    const trackObject = await TrackPlayer.getTrack(currentTrack);
    
    return {
      state,
      position,
      duration,
      currentTrack,
      trackObject,
      isPlaying: state === State.Playing,
      isPaused: state === State.Paused,
      isStopped: state === State.Stopped,
    };
  } catch (error) {
    console.error('获取播放器状态失败:', error);
    return null;
  }
};

/**
 * 搜索音乐
 * @param {string} query - 搜索关键词
 * @param {string} source - 音乐源：'local', 'online', 'all'
 * @returns {Promise<Array>} 搜索结果
 */
export const searchMusic = async (query, source = 'all') => {
  try {
    if (!query || query.trim() === '') {
      return await getMusicLibraryData(source);
    }
    
    const searchTerm = query.toLowerCase().trim();
    let results = [];
    
    // 搜索本地音乐
    if (source === 'local' || source === 'all') {
      const localMusic = await getMusicLibraryData('local');
      const localResults = localMusic.filter(music => 
        music.title.toLowerCase().includes(searchTerm) ||
        music.artist.toLowerCase().includes(searchTerm) ||
        music.album.toLowerCase().includes(searchTerm)
      );
      results = [...results, ...localResults];
    }
    
    // 搜索在线音乐
    if (source === 'online' || source === 'all') {
      try {
        const onlineResults = await onlineMusicService.searchSongsAcrossPlatforms(query);
        results = [...results, ...onlineResults];
      } catch (error) {
        console.error('在线搜索失败，使用本地搜索:', error);
        // 如果在线搜索失败，只返回本地结果
      }
    }
    
    return results;
  } catch (error) {
    console.error('搜索音乐失败:', error);
    return [];
  }
};

/**
 * 搜索在线音乐（跨平台）
 * @param {string} query - 搜索关键词
 * @param {Array} platforms - 要搜索的平台数组
 * @returns {Promise<Array>} 在线搜索结果
 */
export const searchOnlineMusic = async (query, platforms = null) => {
  try {
    return await onlineMusicService.searchSongsAcrossPlatforms(query, platforms);
  } catch (error) {
    console.error('搜索在线音乐失败:', error);
    return [];
  }
};

/**
 * 按分类筛选音乐
 */
export const filterMusicByCategory = async (categoryId) => {
  try {
    const musicLibrary = await getMusicLibraryData();
    
    if (categoryId === 'all') {
      return musicLibrary;
    }
    
    return musicLibrary.filter(music => music.category === categoryId);
  } catch (error) {
    console.error('按分类筛选音乐失败:', error);
    return [];
  }
};

/**
 * 获取音乐分类
 */
export const getMusicCategories = () => {
  return MUSIC_CATEGORIES;
};

/**
 * 获取在线音乐平台列表
 * @returns {Promise<Array>} 平台列表
 */
export const getOnlineMusicPlatforms = async () => {
  try {
    return await onlineMusicService.getSupportedPlatforms();
  } catch (error) {
    console.error('获取在线音乐平台失败:', error);
    return [];
  }
};

/**
 * 获取在线音乐详情
 * @param {string} songId - 歌曲ID
 * @param {string} platform - 平台ID
 * @returns {Promise<Object>} 歌曲详情
 */
export const getOnlineMusicDetails = async (songId, platform = null) => {
  try {
    return await onlineMusicService.getSongDetails(songId, platform);
  } catch (error) {
    console.error('获取在线音乐详情失败:', error);
    return null;
  }
};

/**
 * 获取在线音乐播放URL
 * @param {string} songId - 歌曲ID
 * @param {string} platform - 平台ID
 * @param {string} quality - 音质
 * @returns {Promise<string>} 播放URL
 */
export const getOnlineMusicUrl = async (songId, platform = null, quality = null) => {
  try {
    return await onlineMusicService.getSongUrl(songId, platform, quality);
  } catch (error) {
    console.error('获取在线音乐URL失败:', error);
    return null;
  }
};

/**
 * 获取推荐歌单
 * @param {string} platform - 平台ID
 * @param {number} limit - 返回数量
 * @returns {Promise<Array>} 推荐歌单列表
 */
export const getRecommendedPlaylists = async (platform = null, limit = 10) => {
  try {
    return await onlineMusicService.getRecommendedPlaylists(platform, limit);
  } catch (error) {
    console.error('获取推荐歌单失败:', error);
    return [];
  }
};

/**
 * 获取歌单详情
 * @param {string} playlistId - 歌单ID
 * @param {string} platform - 平台ID
 * @returns {Promise<Object>} 歌单详情
 */
export const getPlaylistDetail = async (playlistId, platform = null) => {
  try {
    return await onlineMusicService.getPlaylistDetail(playlistId, platform);
  } catch (error) {
    console.error('获取歌单详情失败:', error);
    return null;
  }
};

/**
 * 获取热门搜索关键词
 * @param {string} platform - 平台ID
 * @returns {Promise<Array>} 热门搜索关键词
 */
export const getHotSearchKeywords = async (platform = null) => {
  try {
    return await onlineMusicService.getHotSearchKeywords(platform);
  } catch (error) {
    console.error('获取热门搜索关键词失败:', error);
    return [];
  }
};

/**
 * 获取歌曲歌词
 * @param {string} songId - 歌曲ID
 * @param {string} platform - 平台ID
 * @returns {Promise<string>} 歌词文本
 */
export const getSongLyrics = async (songId, platform = null) => {
  try {
    return await onlineMusicService.getSongLyrics(songId, platform);
  } catch (error) {
    console.error('获取歌词失败:', error);
    return null;
  }
};

/**
 * 获取最近播放的音乐
 */
export const getRecentlyPlayed = async () => {
  try {
    const recentlyPlayed = await getRecentlyPlayedData();
    return recentlyPlayed.slice(0, 10); // 返回最近10首
  } catch (error) {
    console.error('获取最近播放失败:', error);
    return [];
  }
};

/**
 * 添加播放记录
 */
export const addPlayRecord = async (music) => {
  try {
    const recentlyPlayed = await getRecentlyPlayedData();
    const updatedList = [
      { ...music, playedAt: new Date().toISOString() },
      ...recentlyPlayed.filter(item => item.id !== music.id)
    ].slice(0, 50); // 最多保存50条记录
    
    await saveRecentlyPlayed(updatedList);
    return true;
  } catch (error) {
    console.error('添加播放记录失败:', error);
    return false;
  }
};

/**
 * 添加歌曲到收藏
 * @param {Object} song - 歌曲信息
 * @returns {Promise<boolean>} 是否收藏成功
 */
export const addToFavorites = async (song) => {
  try {
    return await onlineMusicService.saveToFavorites(song);
  } catch (error) {
    console.error('添加到收藏失败:', error);
    return false;
  }
};

/**
 * 从收藏中移除歌曲
 * @param {string} songId - 歌曲ID
 * @param {string} platform - 平台ID
 * @returns {Promise<boolean>} 是否移除成功
 */
export const removeFromFavorites = async (songId, platform) => {
  try {
    return await onlineMusicService.removeFromFavorites(songId, platform);
  } catch (error) {
    console.error('从收藏中移除失败:', error);
    return false;
  }
};

/**
 * 获取收藏列表
 * @returns {Promise<Array>} 收藏列表
 */
export const getFavorites = async () => {
  try {
    return await onlineMusicService.getFavorites();
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    return [];
  }
};

/**
 * 检查歌曲是否已收藏
 * @param {string} songId - 歌曲ID
 * @param {string} platform - 平台ID
 * @returns {Promise<boolean>} 是否已收藏
 */
export const isSongFavorited = async (songId, platform) => {
  try {
    return await onlineMusicService.isSongFavorited(songId, platform);
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    return false;
  }
};

/**
 * 获取在线音乐用户配置
 * @returns {Object} 用户配置
 */
export const getOnlineMusicUserConfig = () => {
  return onlineMusicService.getUserConfig();
};

/**
 * 更新在线音乐用户配置
 * @param {Object} config - 新的配置
 * @returns {boolean} 是否更新成功
 */
export const updateOnlineMusicUserConfig = (config) => {
  return onlineMusicService.updateUserConfig(config);
};

/**
 * 清除在线音乐缓存
 * @returns {Promise<boolean>} 是否清除成功
 */
export const clearOnlineMusicCache = async () => {
  return await onlineMusicService.clearAllCache();
};

// 存储辅助函数
const getPlaylists = async () => {
  try {
    const playlists = await getMusicLibrary('playlists');
    return playlists || [];
  } catch (error) {
    return [];
  }
};

const savePlaylists = async (playlists) => {
  try {
    await saveMusicLibrary(playlists, 'playlists');
  } catch (error) {
    console.error('保存播放列表失败:', error);
  }
};

const getRecentlyPlayedData = async () => {
  try {
    const recentlyPlayed = await getMusicLibrary('recentlyPlayed');
    return recentlyPlayed || [];
  } catch (error) {
    return [];
  }
};

const saveRecentlyPlayed = async (data) => {
  try {
    await saveMusicLibrary(data, 'recentlyPlayed');
  } catch (error) {
    console.error('保存最近播放失败:', error);
  }
};

export default {
  initializeMusicPlayer,
  getMusicLibraryData,
  loadLocalMusic,
  loadOnlineMusic,
  addMusicToLibrary,
  removeMusicFromLibrary,
  createPlaylist,
  playMusic,
  playPlaylist,
  controlMusicPlayer,
  getPlayerState,
  searchMusic,
  searchOnlineMusic,
  filterMusicByCategory,
  getMusicCategories,
  getOnlineMusicPlatforms,
  getOnlineMusicDetails,
  getOnlineMusicUrl,
  getRecommendedPlaylists,
  getPlaylistDetail,
  getHotSearchKeywords,
  getSongLyrics,
  getRecentlyPlayed,
  addPlayRecord,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  isSongFavorited,
  getOnlineMusicUserConfig,
  updateOnlineMusicUserConfig,
  clearOnlineMusicCache,
};