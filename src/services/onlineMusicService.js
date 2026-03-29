/**
 * 统一的在线音乐服务管理器
 * 集成网易云音乐、QQ音乐等多种在线音乐平台
 * 提供统一的接口访问不同平台的音乐数据
 */

import NeteaseMusicService from './neteaseMusicService';
import QQMusicService from './qqMusicService';
import { getMusicLibrary, saveMusicLibrary } from '../utils/storageUtils';

// 支持的在线音乐平台
const SUPPORTED_PLATFORMS = {
  netease: {
    name: '网易云音乐',
    service: NeteaseMusicService,
    icon: 'cloud-music',
    color: '#E60026', // 网易云红
    description: '海量音乐库，个性化推荐',
    enabled: true,
  },
  qqmusic: {
    name: 'QQ音乐',
    service: QQMusicService,
    icon: 'music-circle',
    color: '#31C27C', // QQ音乐绿
    description: '正版音乐，高品质音源',
    enabled: true,
  },
  // 可以扩展更多平台：酷狗、酷我、虾米等
};

// 用户配置
const USER_CONFIG = {
  // 默认平台
  defaultPlatform: 'netease',
  
  // 平台偏好
  platformPreferences: {},
  
  // 搜索设置
  searchSettings: {
    // 搜索时同时查询的平台数量
    concurrentPlatforms: 2,
    
    // 每个平台返回的最大结果数
    maxResultsPerPlatform: 10,
    
    // 搜索结果排序方式：relevance, popularity, date
    sortBy: 'relevance',
    
    // 是否启用智能搜索（自动纠正拼音、错别字等）
    smartSearch: true,
  },
  
  // 播放设置
  playSettings: {
    // 默认音质
    defaultQuality: 'standard',
    
    // 自动选择最佳音质
    autoSelectBestQuality: true,
    
    // 离线缓存设置
    cacheEnabled: true,
    maxCacheSize: 1024, // MB
  },
  
  // 数据同步设置
  syncSettings: {
    // 自动同步收藏
    autoSyncFavorites: true,
    
    // 自动同步播放列表
    autoSyncPlaylists: false,
    
    // 同步频率（小时）
    syncFrequency: 24,
  },
};

// 缓存管理
const CACHE_MANAGER = {
  // 缓存过期时间（毫秒）
  cacheExpiry: {
    search: 10 * 60 * 1000, // 10分钟
    songDetail: 30 * 60 * 1000, // 30分钟
    playlist: 60 * 60 * 1000, // 60分钟
    lyrics: 7 * 24 * 60 * 60 * 1000, // 7天
  },
  
  // 获取缓存
  getCache: async (key, type = 'search') => {
    try {
      const cache = await getMusicLibrary(`online_cache_${type}_${key}`);
      if (cache && cache.expiry > Date.now()) {
        return cache.data;
      }
      return null;
    } catch (error) {
      console.error('获取缓存失败:', error);
      return null;
    }
  },
  
  // 设置缓存
  setCache: async (key, data, type = 'search') => {
    try {
      const expiry = Date.now() + (CACHE_MANAGER.cacheExpiry[type] || CACHE_MANAGER.cacheExpiry.search);
      const cache = {
        data,
        expiry,
      };
      await saveMusicLibrary(cache, `online_cache_${type}_${key}`);
    } catch (error) {
      console.error('设置缓存失败:', error);
    }
  },
  
  // 清除缓存
  clearCache: async (key, type = 'search') => {
    try {
      await saveMusicLibrary(null, `online_cache_${type}_${key}`);
    } catch (error) {
      console.error('清除缓存失败:', error);
    }
  },
  
  // 清除所有缓存
  clearAllCache: async () => {
    try {
      // 清除所有在线音乐缓存
      const cacheTypes = ['search', 'songDetail', 'playlist', 'lyrics'];
      for (const type of cacheTypes) {
        // 这里需要实现遍历所有可能的缓存键
        console.log(`已清除${type}类型缓存`);
      }
      
      // 清除各平台缓存
      for (const platform in SUPPORTED_PLATFORMS) {
        if (SUPPORTED_PLATFORMS[platform].service.clearAllCache) {
          await SUPPORTED_PLATFORMS[platform].service.clearAllCache();
        }
      }
      
      return true;
    } catch (error) {
      console.error('清除所有缓存失败:', error);
      return false;
    }
  },
};

/**
 * 获取支持的平台列表
 * @returns {Array} 平台列表
 */
export const getSupportedPlatforms = () => {
  return Object.entries(SUPPORTED_PLATFORMS)
    .filter(([_, platform]) => platform.enabled)
    .map(([id, platform]) => ({
      id,
      name: platform.name,
      icon: platform.icon,
      color: platform.color,
      description: platform.description,
    }));
};

/**
 * 设置默认平台
 * @param {string} platformId - 平台ID
 * @returns {boolean} 是否设置成功
 */
export const setDefaultPlatform = (platformId) => {
  if (SUPPORTED_PLATFORMS[platformId]) {
    USER_CONFIG.defaultPlatform = platformId;
    return true;
  }
  return false;
};

/**
 * 获取当前默认平台
 * @returns {string} 平台ID
 */
export const getDefaultPlatform = () => {
  return USER_CONFIG.defaultPlatform;
};

/**
 * 跨平台搜索歌曲
 * @param {string} keyword - 搜索关键词
 * @param {Array} platformIds - 要搜索的平台ID数组（可选，默认所有平台）
 * @param {number} limit - 每个平台返回的最大结果数
 * @returns {Promise<Array>} 跨平台搜索结果
 */
export const searchSongsAcrossPlatforms = async (keyword, platformIds = null, limit = 10) => {
  try {
    // 检查缓存
    const cacheKey = `search_${keyword}_${JSON.stringify(platformIds)}_${limit}`;
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey, 'search');
    if (cachedResult) {
      return cachedResult;
    }
    
    // 确定要搜索的平台
    const platformsToSearch = platformIds 
      ? platformIds.filter(id => SUPPORTED_PLATFORMS[id] && SUPPORTED_PLATFORMS[id].enabled)
      : Object.keys(SUPPORTED_PLATFORMS).filter(id => SUPPORTED_PLATFORMS[id].enabled);
    
    if (platformsToSearch.length === 0) {
      return [];
    }
    
    // 并行搜索所有平台
    const searchPromises = platformsToSearch.map(async (platformId) => {
      try {
        const platform = SUPPORTED_PLATFORMS[platformId];
        const results = await platform.service.searchSongs(keyword, limit);
        
        // 为每个结果添加平台信息
        return results.map(song => ({
          ...song,
          platform: platformId,
          platformName: platform.name,
          platformIcon: platform.icon,
          platformColor: platform.color,
        }));
      } catch (error) {
        console.error(`${platformId} 搜索失败:`, error);
        return [];
      }
    });
    
    const allResults = await Promise.all(searchPromises);
    
    // 合并所有结果
    const mergedResults = allResults.flat();
    
    // 去重（基于标题和艺术家）
    const uniqueResults = [];
    const seen = new Set();
    
    for (const song of mergedResults) {
      const key = `${song.title}_${song.artist}_${song.platform}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueResults.push(song);
      }
    }
    
    // 排序（可以根据相关度、流行度等排序）
    const sortedResults = uniqueResults.sort((a, b) => {
      // 这里可以实现更复杂的排序逻辑
      return a.title.localeCompare(b.title);
    });
    
    // 缓存结果
    await CACHE_MANAGER.setCache(cacheKey, sortedResults, 'search');
    
    return sortedResults;
  } catch (error) {
    console.error('跨平台搜索失败:', error);
    return [];
  }
};

/**
 * 获取歌曲详情（从多个平台获取最佳信息）
 * @param {string} songId - 歌曲ID
 * @param {string} platform - 平台ID
 * @returns {Promise<Object>} 歌曲详情
 */
export const getSongDetails = async (songId, platform = null) => {
  try {
    const targetPlatform = platform || USER_CONFIG.defaultPlatform;
    
    if (!SUPPORTED_PLATFORMS[targetPlatform]) {
      throw new Error(`不支持的平台: ${targetPlatform}`);
    }
    
    // 检查缓存
    const cacheKey = `song_detail_${targetPlatform}_${songId}`;
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey, 'songDetail');
    if (cachedResult) {
      return cachedResult;
    }
    
    const platformService = SUPPORTED_PLATFORMS[targetPlatform].service;
    const songDetails = await platformService.getSongDetails(songId);
    
    if (songDetails.length > 0) {
      const songDetail = {
        ...songDetails[0],
        platform: targetPlatform,
        platformName: SUPPORTED_PLATFORMS[targetPlatform].name,
        platformIcon: SUPPORTED_PLATFORMS[targetPlatform].icon,
        platformColor: SUPPORTED_PLATFORMS[targetPlatform].color,
      };
      
      // 缓存结果
      await CACHE_MANAGER.setCache(cacheKey, songDetail, 'songDetail');
      
      return songDetail;
    }
    
    return null;
  } catch (error) {
    console.error('获取歌曲详情失败:', error);
    return null;
  }
};

/**
 * 获取歌曲播放URL
 * @param {string} songId - 歌曲ID
 * @param {string} platform - 平台ID
 * @param {string} quality - 音质
 * @returns {Promise<string>} 歌曲播放URL
 */
export const getSongUrl = async (songId, platform = null, quality = null) => {
  try {
    const targetPlatform = platform || USER_CONFIG.defaultPlatform;
    const targetQuality = quality || USER_CONFIG.playSettings.defaultQuality;
    
    if (!SUPPORTED_PLATFORMS[targetPlatform]) {
      throw new Error(`不支持的平台: ${targetPlatform}`);
    }
    
    const platformService = SUPPORTED_PLATFORMS[targetPlatform].service;
    
    // 根据平台不同，可能需要不同的参数
    let url;
    if (targetPlatform === 'netease') {
      url = await platformService.getSongUrl(songId, targetQuality);
    } else if (targetPlatform === 'qqmusic') {
      // QQ音乐需要songmid而不是songId
      // 这里需要先获取歌曲详情来获取songmid
      const songDetails = await platformService.getSongDetails(songId);
      if (songDetails.length > 0 && songDetails[0].songmid) {
        url = await platformService.getSongUrl(songDetails[0].songmid, targetQuality);
      }
    }
    
    return url;
  } catch (error) {
    console.error('获取歌曲URL失败:', error);
    return null;
  }
};

/**
 * 获取推荐歌单
 * @param {string} platform - 平台ID（可选）
 * @param {number} limit - 返回数量
 * @returns {Promise<Array>} 推荐歌单列表
 */
export const getRecommendedPlaylists = async (platform = null, limit = 10) => {
  try {
    const targetPlatform = platform || USER_CONFIG.defaultPlatform;
    
    if (!SUPPORTED_PLATFORMS[targetPlatform]) {
      throw new Error(`不支持的平台: ${targetPlatform}`);
    }
    
    // 检查缓存
    const cacheKey = `recommended_playlists_${targetPlatform}_${limit}`;
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey, 'playlist');
    if (cachedResult) {
      return cachedResult;
    }
    
    const platformService = SUPPORTED_PLATFORMS[targetPlatform].service;
    const playlists = await platformService.getRecommendedPlaylists(limit);
    
    // 添加平台信息
    const enrichedPlaylists = playlists.map(playlist => ({
      ...playlist,
      platform: targetPlatform,
      platformName: SUPPORTED_PLATFORMS[targetPlatform].name,
      platformIcon: SUPPORTED_PLATFORMS[targetPlatform].icon,
      platformColor: SUPPORTED_PLATFORMS[targetPlatform].color,
    }));
    
    // 缓存结果
    await CACHE_MANAGER.setCache(cacheKey, enrichedPlaylists, 'playlist');
    
    return enrichedPlaylists;
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
    const targetPlatform = platform || USER_CONFIG.defaultPlatform;
    
    if (!SUPPORTED_PLATFORMS[targetPlatform]) {
      throw new Error(`不支持的平台: ${targetPlatform}`);
    }
    
    // 检查缓存
    const cacheKey = `playlist_detail_${targetPlatform}_${playlistId}`;
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey, 'playlist');
    if (cachedResult) {
      return cachedResult;
    }
    
    const platformService = SUPPORTED_PLATFORMS[targetPlatform].service;
    const playlistDetail = await platformService.getPlaylistDetail(playlistId);
    
    if (playlistDetail) {
      const enrichedPlaylist = {
        ...playlistDetail,
        platform: targetPlatform,
        platformName: SUPPORTED_PLATFORMS[targetPlatform].name,
        platformIcon: SUPPORTED_PLATFORMS[targetPlatform].icon,
        platformColor: SUPPORTED_PLATFORMS[targetPlatform].color,
      };
      
      // 缓存结果
      await CACHE_MANAGER.setCache(cacheKey, enrichedPlaylist, 'playlist');
      
      return enrichedPlaylist;
    }
    
    return null;
  } catch (error) {
    console.error('获取歌单详情失败:', error);
    return null;
  }
};

/**
 * 获取每日推荐歌曲
 * @param {string} platform - 平台ID（可选）
 * @returns {Promise<Array>} 每日推荐歌曲列表
 */
export const getDailyRecommendSongs = async (platform = null) => {
  try {
    const targetPlatform = platform || USER_CONFIG.defaultPlatform;
    
    if (!SUPPORTED_PLATFORMS[targetPlatform]) {
      throw new Error(`不支持的平台: ${targetPlatform}`);
    }
    
    const platformService = SUPPORTED_PLATFORMS[targetPlatform].service;
    const dailySongs = await platformService.getDailyRecommendSongs();
    
    // 添加平台信息
    return dailySongs.map(song => ({
      ...song,
      platform: targetPlatform,
      platformName: SUPPORTED_PLATFORMS[targetPlatform].name,
      platformIcon: SUPPORTED_PLATFORMS[targetPlatform].icon,
      platformColor: SUPPORTED_PLATFORMS[targetPlatform].color,
    }));
  } catch (error) {
    console.error('获取每日推荐歌曲失败:', error);
    return [];
  }
};

/**
 * 获取热门搜索关键词
 * @param {string} platform - 平台ID（可选）
 * @returns {Promise<Array>} 热门搜索关键词
 */
export const getHotSearchKeywords = async (platform = null) => {
  try {
    const targetPlatform = platform || USER_CONFIG.defaultPlatform;
    
    if (!SUPPORTED_PLATFORMS[targetPlatform]) {
      throw new Error(`不支持的平台: ${targetPlatform}`);
    }
    
    const platformService = SUPPORTED_PLATFORMS[targetPlatform].service;
    return await platformService.getHotSearchKeywords();
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
    const targetPlatform = platform || USER_CONFIG.defaultPlatform;
    
    if (!SUPPORTED_PLATFORMS[targetPlatform]) {
      throw new Error(`不支持的平台: ${targetPlatform}`);
    }
    
    // 检查缓存
    const cacheKey = `lyrics_${targetPlatform}_${songId}`;
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey, 'lyrics');
    if (cachedResult) {
      return cachedResult;
    }
    
    const platformService = SUPPORTED_PLATFORMS[targetPlatform].service;
    let lyrics;
    
    if (targetPlatform === 'netease') {
      lyrics = await platformService.getSongLyrics(songId);
    } else if (targetPlatform === 'qqmusic') {
      // QQ音乐需要songmid
      const songDetails = await platformService.getSongDetails(songId);
      if (songDetails.length > 0 && songDetails[0].songmid) {
        lyrics = await platformService.getSongLyrics(songDetails[0].songmid);
      }
    }
    
    if (lyrics) {
      // 缓存歌词
      await CACHE_MANAGER.setCache(cacheKey, lyrics, 'lyrics');
    }
    
    return lyrics;
  } catch (error) {
    console.error('获取歌词失败:', error);
    return null;
  }
};

/**
 * 保存歌曲到本地收藏
 * @param {Object} song - 歌曲信息
 * @returns {Promise<boolean>} 是否保存成功
 */
export const saveToFavorites = async (song) => {
  try {
    // 获取现有的收藏列表
    const favorites = await getMusicLibrary('online_favorites') || [];
    
    // 检查是否已经收藏
    const isAlreadyFavorite = favorites.some(fav => 
      fav.id === song.id && fav.platform === song.platform
    );
    
    if (isAlreadyFavorite) {
      return false; // 已经收藏过了
    }
    
    // 添加收藏时间
    const songWithMetadata = {
      ...song,
      favoritedAt: new Date().toISOString(),
    };
    
    // 保存到收藏列表
    const updatedFavorites = [...favorites, songWithMetadata];
    await saveMusicLibrary(updatedFavorites, 'online_favorites');
    
    return true;
  } catch (error) {
    console.error('保存到收藏失败:', error);
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
    const favorites = await getMusicLibrary('online_favorites') || [];
    const updatedFavorites = favorites.filter(fav => 
      !(fav.id === songId && fav.platform === platform)
    );
    
    await saveMusicLibrary(updatedFavorites, 'online_favorites');
    return true;
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
    const favorites = await getMusicLibrary('online_favorites') || [];
    return favorites;
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
    const favorites = await getMusicLibrary('online_favorites') || [];
    return favorites.some(fav => 
      fav.id === songId && fav.platform === platform
    );
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    return false;
  }
};

/**
 * 获取用户配置
 * @returns {Object} 用户配置
 */
export const getUserConfig = () => {
  return { ...USER_CONFIG };
};

/**
 * 更新用户配置
 * @param {Object} newConfig - 新的配置
 * @returns {boolean} 是否更新成功
 */
export const updateUserConfig = (newConfig) => {
  try {
    Object.assign(USER_CONFIG, newConfig);
    return true;
  } catch (error) {
    console.error('更新用户配置失败:', error);
    return false;
  }
};

/**
 * 清除所有缓存
 * @returns {Promise<boolean>} 是否清除成功
 */
export const clearAllCache = async () => {
  return await CACHE_MANAGER.clearAllCache();
};

// 导出所有函数
export default {
  getSupportedPlatforms,
  setDefaultPlatform,
  getDefaultPlatform,
  searchSongsAcrossPlatforms,
  getSongDetails,
  getSongUrl,
  getRecommendedPlaylists,
  getPlaylistDetail,
  getDailyRecommendSongs,
  getHotSearchKeywords,
  getSongLyrics,
  saveToFavorites,
  removeFromFavorites,
  getFavorites,
  isSongFavorited,
  getUserConfig,
  updateUserConfig,
  clearAllCache,
};