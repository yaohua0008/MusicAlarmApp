/**
 * QQ音乐API服务
 * 提供QQ音乐搜索、播放列表、歌曲详情等功能
 * 
 * 注意：由于QQ音乐官方API限制，这里使用模拟API和代理服务
 * 实际部署时需要使用合法的QQ音乐API或使用官方SDK
 */

import { Platform } from 'react-native';
import { getMusicLibrary, saveMusicLibrary } from '../utils/storageUtils';

// API配置
const API_CONFIG = {
  // 模拟API基础URL（实际使用时需要替换为真实API）
  baseUrl: 'https://api.example.com/qqmusic',
  
  // 开发模式使用模拟数据
  useMockData: true,
  
  // API请求超时时间
  timeout: 10000,
  
  // 支持的API版本
  apiVersion: 'v1',
};

// 模拟QQ音乐API响应
const MOCK_API_RESPONSES = {
  // 搜索歌曲
  search: {
    code: 0,
    data: {
      song: {
        list: [
          {
            songid: '001',
            songmid: '001mid',
            songname: '海阔天空',
            singer: [
              { name: 'Beyond' },
            ],
            albumname: '海阔天空',
            interval: 325, // 秒
            size: 10485760, // 10MB
            strMediaMid: '001mid',
          },
          {
            songid: '002',
            songmid: '002mid',
            songname: '光辉岁月',
            singer: [
              { name: 'Beyond' },
            ],
            albumname: '光辉岁月',
            interval: 298,
            size: 9437184, // 9MB
            strMediaMid: '002mid',
          },
          {
            songid: '003',
            songmid: '003mid',
            songname: '泡沫',
            singer: [
              { name: 'G.E.M.邓紫棋' },
            ],
            albumname: 'Xposed',
            interval: 258,
            size: 8388608, // 8MB
            strMediaMid: '003mid',
          },
          {
            songid: '004',
            songmid: '004mid',
            songname: '光年之外',
            singer: [
              { name: 'G.E.M.邓紫棋' },
            ],
            albumname: '另一个童话',
            interval: 236,
            size: 7340032, // 7MB
            strMediaMid: '004mid',
          },
          {
            songid: '005',
            songmid: '005mid',
            songname: '告白气球',
            singer: [
              { name: '周杰伦' },
            ],
            albumname: '周杰伦的床边故事',
            interval: 215,
            size: 6291456, // 6MB
            strMediaMid: '005mid',
          },
        ],
        totalnum: 5,
      },
    },
  },
  
  // 获取歌曲详情
  songDetail: {
    code: 0,
    req: {
      data: {
        songinfo: {
          data: {
            track_info: {
              song_id: '001',
              song_mid: '001mid',
              song_name: '海阔天空',
              singers: [
                {
                  singer_id: '1001',
                  singer_name: 'Beyond',
                },
              ],
              album: {
                album_id: '2001',
                album_mid: '2001mid',
                album_name: '海阔天空',
              },
              interval: 325,
              genre: 1,
              language: 7, // 粤语
              publish_time: '1993-05-01',
            },
          },
        },
      },
    },
  },
  
  // 获取歌曲URL
  songUrl: {
    code: 0,
    req: {
      data: {
        sip: ['http://example.com'],
        testfile2g: '',
        testfilewifi: '',
        midurlinfo: [
          {
            songmid: '001mid',
            media_mid: '001mid',
            filename: 'C400001mid.mp3',
            purl: 'http://example.com/C400001mid.mp3',
            filehead: 1000,
            filetype: 2,
          },
        ],
      },
    },
  },
  
  // 获取歌单详情
  playlistDetail: {
    code: 0,
    cdlist: [
      {
        dissid: '123456',
        dissname: 'QQ音乐巅峰榜',
        logo: 'https://example.com/qqplaylist1.jpg',
        nick: 'QQ音乐',
        songnum: 50,
        visitnum: 5000000,
        desc: 'QQ音乐巅峰榜TOP50',
        songlist: [
          {
            songid: '001',
            songmid: '001mid',
            songname: '海阔天空',
            singer: [
              { name: 'Beyond' },
            ],
            albumname: '海阔天空',
            interval: 325,
          },
          {
            songid: '002',
            songmid: '002mid',
            songname: '光辉岁月',
            singer: [
              { name: 'Beyond' },
            ],
            albumname: '光辉岁月',
            interval: 298,
          },
        ],
      },
    ],
  },
  
  // 获取推荐歌单
  recommendedPlaylists: {
    code: 0,
    data: {
      list: [
        {
          dissid: '111111',
          dissname: '热歌榜',
          imgurl: 'https://example.com/qqhot1.jpg',
          visitnum: 10000000,
          creator: {
            name: 'QQ音乐',
          },
        },
        {
          dissid: '222222',
          dissname: '新歌榜',
          imgurl: 'https://example.com/qqnew1.jpg',
          visitnum: 8000000,
          creator: {
            name: 'QQ音乐',
          },
        },
        {
          dissid: '333333',
          dissname: '飙升榜',
          imgurl: 'https://example.com/qqrising1.jpg',
          visitnum: 6000000,
          creator: {
            name: 'QQ音乐',
          },
        },
      ],
    },
  },
};

// 热门搜索关键词
const HOT_SEARCH_KEYWORDS = [
  '周杰伦', '林俊杰', '陈奕迅', '邓紫棋', '薛之谦',
  'Beyond', '五月天', 'Taylor Swift', 'Ed Sheeran',
  '经典老歌', '网络热歌', '抖音歌曲', '车载音乐',
  '胎教音乐', '睡眠音乐', '工作音乐', '运动音乐',
];

// 缓存管理
const CACHE_MANAGER = {
  // 缓存过期时间（毫秒）
  cacheExpiry: 30 * 60 * 1000, // 30分钟
  
  // 获取缓存
  getCache: async (key) => {
    try {
      const cache = await getMusicLibrary(`qqmusic_cache_${key}`);
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
      await saveMusicLibrary(cache, `qqmusic_cache_${key}`);
    } catch (error) {
      console.error('设置缓存失败:', error);
    }
  },
  
  // 清除缓存
  clearCache: async (key) => {
    try {
      await saveMusicLibrary(null, `qqmusic_cache_${key}`);
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
      const mockSongs = MOCK_API_RESPONSES.search.data.song.list;
      
      // 根据关键词过滤模拟数据
      const filteredSongs = mockSongs.filter(song => 
        song.songname.toLowerCase().includes(keyword.toLowerCase()) ||
        song.singer.some(singer => 
          singer.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      // 格式化歌曲数据
      const formattedSongs = filteredSongs.map(song => ({
        id: song.songid,
        title: song.songname,
        artist: song.singer.map(s => s.name).join(' / '),
        album: song.albumname || '未知专辑',
        duration: song.interval, // 秒
        cover: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.strMediaMid}.jpg`,
        source: 'qqmusic',
        isLocal: false,
        url: null, // 需要单独获取歌曲URL
        playable: true,
        songmid: song.songmid,
        size: song.size,
      }));
      
      // 缓存结果
      await CACHE_MANAGER.setCache(cacheKey, formattedSongs);
      
      return formattedSongs;
    } else {
      // 实际API调用（需要实现）
      // const response = await fetch(`${API_CONFIG.baseUrl}/search?keyword=${keyword}&limit=${limit}&offset=${offset}`);
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
      const mockDetails = MOCK_API_RESPONSES.songDetail.req.data.songinfo.data.track_info;
      
      const formattedDetails = {
        id: mockDetails.song_id,
        title: mockDetails.song_name,
        artist: mockDetails.singers.map(s => s.singer_name).join(' / '),
        album: mockDetails.album?.album_name || '未知专辑',
        cover: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${mockDetails.song_mid}.jpg`,
        duration: mockDetails.interval,
        source: 'qqmusic',
        isLocal: false,
        playable: true,
        albumId: mockDetails.album?.album_id,
        artistId: mockDetails.singers[0]?.singer_id,
        songmid: mockDetails.song_mid,
        genre: mockDetails.genre,
        language: mockDetails.language,
        publishTime: mockDetails.publish_time,
        lyrics: null, // 需要单独获取歌词
      };
      
      await CACHE_MANAGER.setCache(cacheKey, [formattedDetails]);
      
      return [formattedDetails];
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
 * @param {string} songmid - 歌曲MID
 * @param {string} quality - 音质（m4a, 128, 320, ape, flac）
 * @returns {Promise<string>} 歌曲播放URL
 */
export const getSongUrl = async (songmid, quality = '128') => {
  try {
    const cacheKey = `url_${songmid}_${quality}`;
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    if (API_CONFIG.useMockData) {
      // 模拟歌曲URL
      const mockUrl = MOCK_API_RESPONSES.songUrl.req.data.midurlinfo[0].purl;
      
      // 根据音质调整URL（模拟）
      let url = mockUrl;
      switch (quality) {
        case 'm4a':
          url = url.replace('.mp3', '.m4a');
          break;
        case '320':
          url = url.replace('.mp3', '_320.mp3');
          break;
        case 'ape':
          url = url.replace('.mp3', '.ape');
          break;
        case 'flac':
          url = url.replace('.mp3', '.flac');
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
      const mockPlaylists = MOCK_API_RESPONSES.recommendedPlaylists.data.list;
      
      const formattedPlaylists = mockPlaylists.map(playlist => ({
        id: playlist.dissid,
        name: playlist.dissname,
        cover: playlist.imgurl,
        description: '',
        trackCount: 0,
        playCount: playlist.visitnum,
        creator: playlist.creator?.name || 'QQ音乐',
        source: 'qqmusic',
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
      const mockPlaylist = MOCK_API_RESPONSES.playlistDetail.cdlist[0];
      
      const formattedPlaylist = {
        id: mockPlaylist.dissid,
        name: mockPlaylist.dissname,
        cover: mockPlaylist.logo,
        description: mockPlaylist.desc,
        trackCount: mockPlaylist.songnum,
        playCount: mockPlaylist.visitnum,
        creator: mockPlaylist.nick,
        songs: mockPlaylist.songlist.map(track => ({
          id: track.songid,
          title: track.songname,
          artist: track.singer.map(s => s.name).join(' / '),
          album: track.albumname || '未知专辑',
          duration: track.interval,
          cover: mockPlaylist.logo,
          source: 'qqmusic',
          isLocal: false,
          songmid: track.songmid,
        })),
        source: 'qqmusic',
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
          id: '006',
          songmid: '006mid',
          title: '晴天',
          artist: '周杰伦',
          album: '叶惠美',
          duration: 268,
          cover: 'https://example.com/qqdaily1.jpg',
          reason: '晴天心情，适合清晨唤醒',
          source: 'qqmusic',
          isLocal: false,
        },
        {
          id: '007',
          songmid: '007mid',
          title: '温柔',
          artist: '五月天',
          album: '爱情万岁',
          duration: 245,
          cover: 'https://example.com/qqdaily2.jpg',
          reason: '温柔旋律，适合午休放松',
          source: 'qqmusic',
          isLocal: false,
        },
        {
          id: '008',
          songmid: '008mid',
          title: '突然好想你',
          artist: '五月天',
          album: '后青春期的诗',
          duration: 295,
          cover: 'https://example.com/qqdaily3.jpg',
          reason: '经典情歌，夜晚独处时刻',
          source: 'qqmusic',
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
          id: '009',
          songmid: '009mid',
          title: '青花瓷',
          artist: '周杰伦',
          album: '我很忙',
          duration: 240,
          cover: 'https://example.com/qqartist1.jpg',
          source: 'qqmusic',
          isLocal: false,
        },
        {
          id: '010',
          songmid: '010mid',
          title: '发如雪',
          artist: '周杰伦',
          album: '十一月的萧邦',
          duration: 265,
          cover: 'https://example.com/qqartist2.jpg',
          source: 'qqmusic',
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
 * @param {string} songmid - 歌曲MID
 * @returns {Promise<string>} 歌词文本
 */
export const getSongLyrics = async (songmid) => {
  try {
    const cacheKey = `lyrics_${songmid}`;
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    if (API_CONFIG.useMockData) {
      // 模拟歌词
      const lyrics = `[00:00.00]海阔天空 - Beyond
[00:05.00]作曲：黄家驹
[00:10.00]作词：黄家驹
[00:15.00]
[00:20.00]今天我 寒夜里看雪飘过
[00:27.00]怀着冷却了的心窝漂远方
[00:34.00]风雨里追赶 雾里分不清影踪
[00:41.00]天空海阔你与我可会变
[00:47.00]
[00:48.00]多少次 迎着冷眼与嘲笑
[00:55.00]从没有放弃过心中的理想
[01:02.00]一刹那恍惚 若有所失的感觉
[01:09.00]不知不觉已变淡心里爱`;
      
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
 * 获取电台列表
 * @returns {Promise<Array>} 电台列表
 */
export const getRadioStations = async () => {
  try {
    const cacheKey = 'radio_stations';
    const cachedResult = await CACHE_MANAGER.getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    if (API_CONFIG.useMockData) {
      // 模拟电台列表
      const radioStations = [
        {
          id: 'radio1',
          name: '经典老歌电台',
          cover: 'https://example.com/qqradio1.jpg',
          description: '经典华语老歌，怀旧时光',
          category: '经典',
        },
        {
          id: 'radio2',
          name: '轻音乐电台',
          cover: 'https://example.com/qqradio2.jpg',
          description: '轻柔舒缓，放松心情',
          category: '轻音乐',
        },
        {
          id: 'radio3',
          name: '运动健身电台',
          cover: 'https://example.com/qqradio3.jpg',
          description: '动感节奏，激发活力',
          category: '运动',
        },
      ];
      
      await CACHE_MANAGER.setCache(cacheKey, radioStations);
      
      return radioStations;
    } else {
      return [];
    }
  } catch (error) {
    console.error('获取电台列表失败:', error);
    return [];
  }
};

/**
 * 清除所有缓存
 */
export const clearAllCache = async () => {
  try {
    // 这里可以遍历清除所有QQ音乐相关的缓存
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
      'radio_stations',
    ];
    
    for (const key of cacheKeys) {
      await CACHE_MANAGER.clearCache(key);
    }
    
    console.log('QQ音乐缓存已清除');
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
  getRadioStations,
  clearAllCache,
};