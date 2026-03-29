/**
 * 网易云音乐API服务
 * 提供网易云音乐搜索、播放列表、歌曲详情等功能
 * 
 * 注意：由于网易云音乐官方API限制，这里使用模拟API和代理服务
 * 实际部署时需要使用合法的网易云音乐API或使用官方SDK
 */

import { Platform } from 'react-native';
import { getMusicLibrary, saveMusicLibrary } from '../utils/storageUtils';

// API配置
const API_CONFIG = {
  // 模拟API基础URL（实际使用时需要替换为真实API）
  baseUrl: 'https://api.example.com/netease',
  
  // 开发模式使用模拟数据
  useMockData: true,
  
  // API请求超时时间
  timeout: 10000,
  
  // 支持的API版本
  apiVersion: 'v1',
};

// 模拟网易云音乐API响应
const MOCK_API_RESPONSES = {
  // 搜索歌曲
  search: {
    code: 200,
    result: {
      songs: [
        {
          id: '123456',
          name: '平凡之路',
          artists: [{ name: '朴树' }],
          album: { name: '猎户星座' },
          duration: 256000, // 毫秒
          mvid: 0,
          alias: [],
          transNames: null,
        },
        {
          id: '234567',
          name: '夜空中最亮的星',
          artists: [{ name: '逃跑计划' }],
          album: { name: '世界' },
          duration: 283000,
          mvid: 0,
          alias: [],
          transNames: null,
        },
        {
          id: '345678',
          name: '成都',
          artists: [{ name: '赵雷' }],
          album: { name: '无法长大' },
          duration: 317000,
          mvid: 0,
          alias: [],
          transNames: null,
        },
        {
          id: '456789',
          name: '起风了',
          artists: [{ name: '买辣椒也用券' }],
          album: { name: '起风了' },
          duration: 325000,
          mvid: 0,
          alias: [],
          transNames: null,
        },
        {
          id: '567890',
          name: '光年之外',
          artists: [{ name: 'G.E.M.邓紫棋' }],
          album: { name: '光年之外' },
          duration: 236000,
          mvid: 0,
          alias: [],
          transNames: null,
        },
      ],
      songCount: 5,
    },
  },
  
  // 获取歌曲详情
  songDetail: {
    code: 200,
    songs: [
      {
        id: '123456',
        name: '平凡之路',
        ar: [{ name: '朴树' }],
        al: {
          name: '猎户星座',
          picUrl: 'https://example.com/album1.jpg',
        },
        dt: 256000,
        mv: 0,
        alia: [],
        transNames: null,
      },
    ],
    privileges: [{
      id: '123456',
      fee: 0,
      payed: 0,
      st: 0,
      pl: 320000,
      dl: 320000,
      cp: 1,
      maxbr: 999000,
    }],
  },
  
  // 获取歌曲URL
  songUrl: {
    code: 200,
    data: [{
      id: '123456',
      url: 'https://example.com/music/pingfanzhilu.mp3',
      br: 320000,
      size: 10240000,
      md5: 'abc123',
      type: 'mp3',
    }],
  },
  
  // 获取歌单详情
  playlistDetail: {
    code: 200,
    playlist: {
      id: '123456789',
      name: '华语流行经典',
      coverImgUrl: 'https://example.com/playlist1.jpg',
      creator: {
        nickname: '网易云音乐',
      },
      trackCount: 20,
      playCount: 1000000,
      description: '华语流行经典歌曲合集',
      tracks: [
        {
          id: '123456',
          name: '平凡之路',
          ar: [{ name: '朴树' }],
          al: { name: '猎户星座' },
          dt: 256000,
        },
        {
          id: '234567',
          name: '夜空中最亮的星',
          ar: [{ name: '逃跑计划' }],
          al: { name: '世界' },
          dt: 283000,
        },
      ],
    },
  },
  
  // 获取推荐歌单
  personalizedPlaylist: {
    code: 200,
    result: [
      {
        id: '123456789',
        name: '每日推荐',
        picUrl: 'https://example.com/recommend1.jpg',
        playCount: 500000,
      },
      {
        id: '234567890',
        name: '私人FM',
        picUrl: 'https://example.com/fm1.jpg',
        playCount: 300000,
      },
      {
        id: '345678901',
        name: '热歌榜',
        picUrl: 'https://example.com/hot1.jpg',
        playCount: 2000000,
      },
    ],
  },
};

// 热门搜索关键词
const HOT_SEARCH_KEYWORDS = [
  '周杰伦', '林俊杰', '陈奕迅', '邓紫棋', '薛之谦',
  '毛不易', '五月天', 'Taylor Swift', 'Ed Sheeran',
  '古典音乐', '纯音乐', '白噪音', 'ASMR', '冥想音乐',
  '工作专注', '运动健身', '睡眠放松', '通勤路上', '开车音乐',
];

// 缓存管理
const CACHE_MANAGER = {
  // 缓存过期时间（毫秒）
  cacheExpiry: 30 * 60 * 1000, // 30分钟
  
  // 获取缓存
  getCache: async (key) => {
    try {
      const cache = await getMusicLibrary(`netease_cache_${key}`);
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
  setCache: async (key, data) => {
    try {
      const cache = {
        data,
        expiry: Date.now() + CACHE_MANAGER.cacheExpiry,
      };
      await saveMusicLibrary(cache, `netease_cache_${key}`);
    } catch (error) {
      console.error('设置缓存失败:', error);
    }
  },
  
  // 清除缓存
  clearCache: async (key) => {
    try {
      await saveMusicLibrary(null, `netease_cache_${key}`);
    } catch (error) {
      console.error('清除缓存失败:', error);
    }
  },
};

/**
 * 搜索歌曲
 * @param {string} keyword - 搜索关键词
 * @param {number} limit - 返回结果数量
 * @param {number} offset - 偏移量
 * @returns {Promise<Array>} 歌曲列表
 */
export const searchSongs = async (keyword, limit = 20, offset = 0) => {
  try {
    // 检查缓存
    const cacheKey = `search_${keyword}_${limit}_${offset}`;
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    if (API_CONFIG.useMockData) {
      // 使用模拟数据
      const mockSongs = MOCK_API_RESPONSES.search.result.songs;
      
      // 根据关键词过滤模拟数据
      const filteredSongs = mockSongs.filter(song => 
        song.name.toLowerCase().includes(keyword.toLowerCase()) ||
        song.artists.some(artist => 
          artist.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      // 格式化歌曲数据
      const formattedSongs = filteredSongs.map(song => ({
        id: song.id,
        title: song.name,
        artist: song.artists.map(a => a.name).join(' / '),
        album: song.album?.name || '未知专辑',
        duration: Math.floor(song.duration / 1000), // 转换为秒
        cover: `https://p2.music.126.net/${song.id}/cover.jpg`,
        source: 'netease',
        isLocal: false,
        url: null, // 需要单独获取歌曲URL
        playable: true,
      }));
      
      // 缓存结果
      await CACHE_MANAGER.setCache(cacheKey, formattedSongs);
      
      return formattedSongs;
    } else {
      // 实际API调用（需要实现）
      // const response = await fetch(`${API_CONFIG.baseUrl}/search?keywords=${keyword}&limit=${limit}&offset=${offset}`);
      // const data = await response.json();
      // return data;
      
      // 暂时返回模拟数据
      return searchSongs(keyword, limit, offset);
    }
  } catch (error) {
    console.error('搜索歌曲失败:', error);
    return [];
  }
};

/**
 * 获取歌曲详情
 * @param {string|Array} songIds - 歌曲ID或ID数组
 * @returns {Promise<Array>} 歌曲详情列表
 */
export const getSongDetails = async (songIds) => {
  try {
    const ids = Array.isArray(songIds) ? songIds : [songIds];
    const cacheKey = `details_${ids.join('_')}`;
    
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    if (API_CONFIG.useMockData) {
      // 使用模拟数据
      const mockDetails = MOCK_API_RESPONSES.songDetail.songs;
      
      const formattedDetails = mockDetails.map(song => ({
        id: song.id,
        title: song.name,
        artist: song.ar.map(a => a.name).join(' / '),
        album: song.al?.name || '未知专辑',
        cover: song.al?.picUrl || `https://p2.music.126.net/${song.id}/cover.jpg`,
        duration: Math.floor(song.dt / 1000),
        source: 'netease',
        isLocal: false,
        playable: true,
        albumId: song.al?.id,
        artistId: song.ar[0]?.id,
        lyrics: null, // 需要单独获取歌词
      }));
      
      await CACHE_MANAGER.setCache(cacheKey, formattedDetails);
      
      return formattedDetails;
    } else {
      // 实际API调用
      return [];
    }
  } catch (error) {
    console.error('获取歌曲详情失败:', error);
    return [];
  }
};

/**
 * 获取歌曲播放URL
 * @param {string} songId - 歌曲ID
 * @param {string} quality - 音质（standard, higher, exhigh, lossless）
 * @returns {Promise<string>} 歌曲播放URL
 */
export const getSongUrl = async (songId, quality = 'standard') => {
  try {
    const cacheKey = `url_${songId}_${quality}`;
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    if (API_CONFIG.useMockData) {
      // 模拟歌曲URL
      const mockUrl = MOCK_API_RESPONSES.songUrl.data[0].url;
      
      // 根据音质调整URL（模拟）
      let url = mockUrl;
      switch (quality) {
        case 'higher':
          url = url.replace('.mp3', '_hq.mp3');
          break;
        case 'exhigh':
          url = url.replace('.mp3', '_exhigh.mp3');
          break;
        case 'lossless':
          url = url.replace('.mp3', '_lossless.flac');
          break;
      }
      
      await CACHE_MANAGER.setCache(cacheKey, url);
      
      return url;
    } else {
      // 实际API调用
      return null;
    }
  } catch (error) {
    console.error('获取歌曲URL失败:', error);
    return null;
  }
};

/**
 * 获取推荐歌单
 * @param {number} limit - 返回数量
 * @returns {Promise<Array>} 推荐歌单列表
 */
export const getRecommendedPlaylists = async (limit = 10) => {
  try {
    const cacheKey = `recommended_playlists_${limit}`;
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    if (API_CONFIG.useMockData) {
      const mockPlaylists = MOCK_API_RESPONSES.personalizedPlaylist.result;
      
      const formattedPlaylists = mockPlaylists.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        cover: playlist.picUrl,
        description: '',
        trackCount: 0,
        playCount: playlist.playCount,
        creator: '网易云音乐',
        source: 'netease',
      }));
      
      await CACHE_MANAGER.setCache(cacheKey, formattedPlaylists);
      
      return formattedPlaylists;
    } else {
      // 实际API调用
      return [];
    }
  } catch (error) {
    console.error('获取推荐歌单失败:', error);
    return [];
  }
};

/**
 * 获取歌单详情
 * @param {string} playlistId - 歌单ID
 * @returns {Promise<Object>} 歌单详情
 */
export const getPlaylistDetail = async (playlistId) => {
  try {
    const cacheKey = `playlist_detail_${playlistId}`;
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    if (API_CONFIG.useMockData) {
      const mockPlaylist = MOCK_API_RESPONSES.playlistDetail.playlist;
      
      const formattedPlaylist = {
        id: mockPlaylist.id,
        name: mockPlaylist.name,
        cover: mockPlaylist.coverImgUrl,
        description: mockPlaylist.description,
        trackCount: mockPlaylist.trackCount,
        playCount: mockPlaylist.playCount,
        creator: mockPlaylist.creator.nickname,
        songs: mockPlaylist.tracks.map(track => ({
          id: track.id,
          title: track.name,
          artist: track.ar.map(a => a.name).join(' / '),
          album: track.al?.name || '未知专辑',
          duration: Math.floor(track.dt / 1000),
          cover: mockPlaylist.coverImgUrl,
          source: 'netease',
          isLocal: false,
        })),
        source: 'netease',
      };
      
      await CACHE_MANAGER.setCache(cacheKey, formattedPlaylist);
      
      return formattedPlaylist;
    } else {
      // 实际API调用
      return null;
    }
  } catch (error) {
    console.error('获取歌单详情失败:', error);
    return null;
  }
};

/**
 * 获取热门搜索关键词
 * @returns {Promise<Array>} 热门搜索关键词
 */
export const getHotSearchKeywords = async () => {
  try {
    const cacheKey = 'hot_search_keywords';
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // 返回热门搜索关键词
    const keywords = HOT_SEARCH_KEYWORDS.map(keyword => ({
      keyword,
      searchCount: Math.floor(Math.random() * 1000000),
    }));
    
    await CACHE_MANAGER.setCache(cacheKey, keywords);
    
    return keywords;
  } catch (error) {
    console.error('获取热门搜索关键词失败:', error);
    return [];
  }
};

/**
 * 获取每日推荐歌曲
 * @returns {Promise<Array>} 每日推荐歌曲列表
 */
export const getDailyRecommendSongs = async () => {
  try {
    const cacheKey = `daily_recommend_${new Date().toISOString().split('T')[0]}`;
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    if (API_CONFIG.useMockData) {
      // 模拟每日推荐歌曲
      const dailySongs = [
        {
          id: '111111',
          title: '早安，晨之美',
          artist: '卢广仲',
          album: '100种生活',
          duration: 210,
          cover: 'https://example.com/daily1.jpg',
          reason: '早安唤醒，元气满满的一天',
          source: 'netease',
          isLocal: false,
        },
        {
          id: '222222',
          title: '午后阳光',
          artist: '许巍',
          album: '时光·漫步',
          duration: 245,
          cover: 'https://example.com/daily2.jpg',
          reason: '午后小憩，放松心情',
          source: 'netease',
          isLocal: false,
        },
        {
          id: '333333',
          title: '夜色温柔',
          artist: '莫文蔚',
          album: '如果没有你',
          duration: 280,
          cover: 'https://example.com/daily3.jpg',
          reason: '夜晚放松，助眠好曲',
          source: 'netease',
          isLocal: false,
        },
      ];
      
      await CACHE_MANAGER.setCache(cacheKey, dailySongs);
      
      return dailySongs;
    } else {
      // 实际API调用
      return [];
    }
  } catch (error) {
    console.error('获取每日推荐歌曲失败:', error);
    return [];
  }
};

/**
 * 获取歌手热门歌曲
 * @param {string} artistId - 歌手ID
 * @param {number} limit - 返回数量
 * @returns {Promise<Array>} 歌手热门歌曲列表
 */
export const getArtistHotSongs = async (artistId, limit = 10) => {
  try {
    const cacheKey = `artist_hot_songs_${artistId}_${limit}`;
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    if (API_CONFIG.useMockData) {
      // 模拟歌手热门歌曲
      const hotSongs = [
        {
          id: '444444',
          title: '青花瓷',
          artist: '周杰伦',
          album: '我很忙',
          duration: 240,
          cover: 'https://example.com/artist1.jpg',
          source: 'netease',
          isLocal: false,
        },
        {
          id: '555555',
          title: '七里香',
          artist: '周杰伦',
          album: '七里香',
          duration: 260,
          cover: 'https://example.com/artist2.jpg',
          source: 'netease',
          isLocal: false,
        },
      ];
      
      await CACHE_MANAGER.setCache(cacheKey, hotSongs);
      
      return hotSongs;
    } else {
      // 实际API调用
      return [];
    }
  } catch (error) {
    console.error('获取歌手热门歌曲失败:', error);
    return [];
  }
};

/**
 * 获取歌曲歌词
 * @param {string} songId - 歌曲ID
 * @returns {Promise<string>} 歌词文本
 */
export const getSongLyrics = async (songId) => {
  try {
    const cacheKey = `lyrics_${songId}`;
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    if (API_CONFIG.useMockData) {
      // 模拟歌词
      const lyrics = `[00:00.00]平凡之路 - 朴树
[00:05.00]作曲：朴树
[00:10.00]作词：韩寒, 朴树
[00:15.00]
[00:20.00]徘徊着的 在路上的
[00:25.00]你要走吗
[00:30.00]易碎的 骄傲着
[00:35.00]那也曾是我的模样
[00:40.00]
[00:45.00]沸腾着的 不安着的
[00:50.00]你要去哪
[00:55.00]谜一样的 沉默着的
[01:00.00]故事你真的在听吗`;
      
      await CACHE_MANAGER.setCache(cacheKey, lyrics);
      
      return lyrics;
    } else {
      // 实际API调用
      return null;
    }
  } catch (error) {
    console.error('获取歌词失败:', error);
    return null;
  }
};

/**
 * 清除所有缓存
 */
export const clearAllCache = async () => {
  try {
    // 这里可以遍历清除所有网易云音乐相关的缓存
    const cacheKeys = [
      'search_',
      'details_',
      'url_',
      'recommended_playlists_',
      'playlist_detail_',
      'hot_search_keywords',
      'daily_recommend_',
      'artist_hot_songs_',
      'lyrics_',
    ];
    
    for (const key of cacheKeys) {
      await CACHE_MANAGER.clearCache(key);
    }
    
    console.log('网易云音乐缓存已清除');
    return true;
  } catch (error) {
    console.error('清除缓存失败:', error);
    return false;
  }
};

// 导出所有函数
export default {
  searchSongs,
  getSongDetails,
  getSongUrl,
  getRecommendedPlaylists,
  getPlaylistDetail,
  getHotSearchKeywords,
  getDailyRecommendSongs,
  getArtistHotSongs,
  getSongLyrics,
  clearAllCache,
};