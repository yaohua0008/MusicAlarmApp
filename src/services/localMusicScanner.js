/**
 * 本地音乐扫描服务
 * 负责扫描设备上的音乐文件，提取元数据，并转换为应用内部格式
 */

import {
  Platform,
  PermissionsAndroid,
  NativeModules,
  Alert,
} from 'react-native';
import RNFS from 'react-native-fs';
import mmkvStorage from '../utils/storage';
import musicService from './musicService';

// 音乐文件扩展名
const MUSIC_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.flac',
  '.aac',
  '.m4a',
  '.ogg',
  '.wma',
  '.ape',
  '.opus',
  '.alac',
];

// 常见音乐文件夹路径
const COMMON_MUSIC_PATHS = {
  android: [
    '/storage/emulated/0/Music',
    '/storage/emulated/0/Download',
    '/storage/emulated/0/DCIM',
    '/storage/emulated/0/Pictures',
    '/storage/emulated/0/WhatsApp/Media',
    '/storage/emulated/0/Telegram',
  ],
  ios: [
    'Documents',
    'Library',
    'Music',
    'Downloads',
  ],
};

class LocalMusicScanner {
  constructor() {
    this.scannedMusic = [];
    this.currentScanProgress = 0;
    this.isScanning = false;
    this.totalFilesToScan = 0;
    this.scannedFilesCount = 0;
    this.onProgressCallback = null;
    this.onCompleteCallback = null;
    this.onErrorCallback = null;
  }

  /**
   * 初始化扫描器
   */
  initializeScanner() {
    console.log('本地音乐扫描器初始化');
    return this.checkAndRequestPermissions();
  }

  /**
   * 检查和请求文件读取权限
   */
  async checkAndRequestPermissions() {
    try {
      if (Platform.OS === 'android') {
        // Android 13+ 需要 READ_MEDIA_AUDIO 权限
        if (Platform.Version >= 33) {
          const hasReadMediaPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
          );
          
          if (!hasReadMediaPermission) {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
              {
                title: '音乐文件读取权限',
                message: '应用需要访问您的音乐文件来创建闹钟',
                buttonNeutral: '稍后询问',
                buttonNegative: '取消',
                buttonPositive: '确定',
              },
            );
            
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              throw new Error('用户拒绝了音乐文件读取权限');
            }
          }
        } else {
          // Android 12及以下需要 READ_EXTERNAL_STORAGE 权限
          const hasReadExternalPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          );
          
          if (!hasReadExternalPermission) {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
              {
                title: '存储读取权限',
                message: '应用需要访问您的存储来扫描音乐文件',
                buttonNeutral: '稍后询问',
                buttonNegative: '取消',
                buttonPositive: '确定',
              },
            );
            
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              throw new Error('用户拒绝了存储读取权限');
            }
          }
        }
      }
      
      console.log('文件读取权限已获取');
      return true;
    } catch (error) {
      console.error('权限检查失败:', error);
      throw error;
    }
  }

  /**
   * 设置进度回调
   */
  setProgressCallback(callback) {
    this.onProgressCallback = callback;
  }

  /**
   * 设置完成回调
   */
  setCompleteCallback(callback) {
    this.onCompleteCallback = callback;
  }

  /**
   * 设置错误回调
   */
  setErrorCallback(callback) {
    this.onErrorCallback = callback;
  }

  /**
   * 开始扫描设备上的音乐文件
   */
  async startScan(options = {}) {
    if (this.isScanning) {
      console.log('扫描已在进行中');
      return;
    }

    try {
      this.isScanning = true;
      this.scannedMusic = [];
      this.scannedFilesCount = 0;
      this.currentScanProgress = 0;

      console.log('开始扫描音乐文件...');
      
      // 检查权限
      await this.checkAndRequestPermissions();

      // 获取要扫描的路径
      const scanPaths = options.scanPaths || this.getDefaultScanPaths();
      
      // 首先统计文件总数（用于进度计算）
      await this.countTotalMusicFiles(scanPaths);

      // 开始扫描每个路径
      for (const path of scanPaths) {
        if (!this.isScanning) break;
        await this.scanDirectory(path);
      }

      // 更新本地音乐列表
      await this.saveScannedMusic();

      // 调用完成回调
      if (this.onCompleteCallback) {
        this.onCompleteCallback(this.scannedMusic);
      }

      console.log(`扫描完成，找到 ${this.scannedMusic.length} 首音乐`);
      return this.scannedMusic;
    } catch (error) {
      console.error('扫描失败:', error);
      
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      
      throw error;
    } finally {
      this.isScanning = false;
      this.currentScanProgress = 100;
    }
  }

  /**
   * 统计总音乐文件数
   */
  async countTotalMusicFiles(paths) {
    this.totalFilesToScan = 0;
    
    for (const path of paths) {
      try {
        const files = await RNFS.readDir(path);
        
        for (const file of files) {
          if (file.isDirectory()) {
            // 递归统计子目录
            const subDirMusicCount = await this.countMusicFilesInDirectory(file.path);
            this.totalFilesToScan += subDirMusicCount;
          } else if (this.isMusicFile(file.name)) {
            this.totalFilesToScan++;
          }
        }
      } catch (error) {
        console.warn(`无法统计目录 ${path} 中的文件:`, error);
      }
    }
    
    console.log(`预计扫描 ${this.totalFilesToScan} 个音乐文件`);
  }

  /**
   * 统计目录中的音乐文件数
   */
  async countMusicFilesInDirectory(directoryPath) {
    let count = 0;
    
    try {
      const files = await RNFS.readDir(directoryPath);
      
      for (const file of files) {
        if (file.isDirectory()) {
          const subCount = await this.countMusicFilesInDirectory(file.path);
          count += subCount;
        } else if (this.isMusicFile(file.name)) {
          count++;
        }
      }
    } catch (error) {
      console.warn(`无法统计目录 ${directoryPath} 中的文件:`, error);
    }
    
    return count;
  }

  /**
   * 获取默认扫描路径
   */
  getDefaultScanPaths() {
    const osPaths = Platform.OS === 'android' 
      ? COMMON_MUSIC_PATHS.android 
      : COMMON_MUSIC_PATHS.ios;
    
    // 验证路径是否存在
    return osPaths.filter(path => {
      // 这里可以根据实际情况添加路径验证
      return true;
    });
  }

  /**
   * 扫描目录
   */
  async scanDirectory(directoryPath) {
    try {
      console.log(`扫描目录: ${directoryPath}`);
      
      const files = await RNFS.readDir(directoryPath);
      
      for (const file of files) {
        if (!this.isScanning) break;
        
        if (file.isDirectory()) {
          // 递归扫描子目录
          await this.scanDirectory(file.path);
        } else if (this.isMusicFile(file.name)) {
          // 处理音乐文件
          await this.processMusicFile(file);
        }
        
        this.updateProgress();
      }
    } catch (error) {
      console.warn(`无法扫描目录 ${directoryPath}:`, error);
    }
  }

  /**
   * 处理音乐文件
   */
  async processMusicFile(file) {
    try {
      console.log(`处理音乐文件: ${file.name}`);
      
      // 从文件名提取基本信息
      const musicInfo = this.extractMusicInfoFromFile(file);
      
      // 获取文件大小和修改时间
      const fileSize = file.size || 0;
      const modifiedTime = file.mtime ? new Date(file.mtime) : new Date();
      
      // 创建音乐对象
      const musicItem = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: musicInfo.title,
        artist: musicInfo.artist,
        album: musicInfo.album,
        duration: 0, // 后续可以分析音频时长
        path: file.path,
        uri: `file://${file.path}`,
        fileSize,
        modifiedTime,
        isLocalFile: true,
        fileType: this.getFileType(file.name),
        rating: 0,
        playCount: 0,
        lastPlayed: null,
        createdAt: new Date(),
      };
      
      this.scannedMusic.push(musicItem);
      this.scannedFilesCount++;
      
    } catch (error) {
      console.warn(`处理音乐文件失败 ${file.name}:`, error);
    }
  }

  /**
   * 从文件名提取音乐信息
   */
  extractMusicInfoFromFile(file) {
    const fileName = file.name;
    
    // 尝试从文件名解析歌手和歌曲名
    // 常见格式: "歌手 - 歌曲名.mp3"
    const match = fileName.match(/^(.+?)\s*-\s*(.+?)\s*\./);
    
    if (match && match.length >= 3) {
      return {
        artist: match[1].trim(),
        title: match[2].trim(),
        album: '未知专辑',
      };
    }
    
    // 如果格式不匹配，尝试其他常见格式
    const withoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    return {
      title: withoutExt,
      artist: '未知歌手',
      album: '未知专辑',
    };
  }

  /**
   * 判断是否为音乐文件
   */
  isMusicFile(filename) {
    const lowerCaseName = filename.toLowerCase();
    return MUSIC_EXTENSIONS.some(ext => lowerCaseName.endsWith(ext));
  }

  /**
   * 获取文件类型
   */
  getFileType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    return ext || 'unknown';
  }

  /**
   * 更新扫描进度
   */
  updateProgress() {
    if (this.totalFilesToScan > 0) {
      this.currentScanProgress = Math.round(
        (this.scannedFilesCount / this.totalFilesToScan) * 100
      );
    }
    
    console.log(`扫描进度: ${this.currentScanProgress}% (${this.scannedFilesCount}/${this.totalFilesToScan})`);
    
    if (this.onProgressCallback) {
      this.onProgressCallback({
        progress: this.currentScanProgress,
        scannedCount: this.scannedFilesCount,
        totalCount: this.totalFilesToScan,
        foundMusicCount: this.scannedMusic.length,
      });
    }
  }

  /**
   * 保存扫描到的音乐
   */
  async saveScannedMusic() {
    try {
      // 保存到本地存储
      const storageKey = 'local_scanned_music';
      await mmkvStorage.setItem(storageKey, JSON.stringify(this.scannedMusic));
      
      // 添加到音乐服务的本地音乐列表
      musicService.setLocalMusic(this.scannedMusic);
      
      console.log(`已保存 ${this.scannedMusic.length} 首本地音乐`);
      return true;
    } catch (error) {
      console.error('保存扫描音乐失败:', error);
      throw error;
    }
  }

  /**
   * 获取已扫描的本地音乐
   */
  async getLocalMusic() {
    try {
      const storageKey = 'local_scanned_music';
      const storedMusic = await mmkvStorage.getItem(storageKey);
      
      if (storedMusic) {
        const musicList = JSON.parse(storedMusic);
        this.scannedMusic = musicList;
        return musicList;
      }
      
      return [];
    } catch (error) {
      console.error('获取本地音乐失败:', error);
      return [];
    }
  }

  /**
   * 停止扫描
   */
  stopScan() {
    if (this.isScanning) {
      console.log('停止音乐扫描');
      this.isScanning = false;
      
      // 保存已扫描的部分音乐
      if (this.scannedMusic.length > 0) {
        this.saveScannedMusic().catch(console.error);
      }
    }
  }

  /**
   * 清除扫描的音乐缓存
   */
  async clearLocalMusicCache() {
    try {
      const storageKey = 'local_scanned_music';
      await mmkvStorage.removeItem(storageKey);
      
      this.scannedMusic = [];
      musicService.clearLocalMusic();
      
      console.log('本地音乐缓存已清除');
      return true;
    } catch (error) {
      console.error('清除缓存失败:', error);
      throw error;
    }
  }

  /**
   * 获取扫描状态
   */
  getScanStatus() {
    return {
      isScanning: this.isScanning,
      progress: this.currentScanProgress,
      scannedFiles: this.scannedFilesCount,
      totalFiles: this.totalFilesToScan,
      foundMusic: this.scannedMusic.length,
    };
  }

  /**
   * 检查特定路径下是否有音乐文件
   */
  async checkPathForMusic(path) {
    try {
      const files = await RNFS.readDir(path);
      let musicCount = 0;
      const musicFiles = [];
      
      for (const file of files) {
        if (file.isDirectory()) {
          const subCount = await this.checkPathForMusic(file.path);
          musicCount += subCount;
        } else if (this.isMusicFile(file.name)) {
          musicCount++;
          musicFiles.push({
            name: file.name,
            path: file.path,
            size: file.size,
          });
        }
      }
      
      return {
        path,
        musicCount,
        musicFiles,
      };
    } catch (error) {
      console.warn(`检查路径失败 ${path}:`, error);
      return {
        path,
        musicCount: 0,
        musicFiles: [],
        error: error.message,
      };
    }
  }

  /**
   * 从特定文件路径添加单首音乐
   */
  async addMusicFromPath(filePath) {
    try {
      // 检查文件是否存在
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        throw new Error('文件不存在');
      }
      
      // 检查是否为音乐文件
      const fileName = filePath.split('/').pop();
      if (!this.isMusicFile(fileName)) {
        throw new Error('不是有效的音乐文件');
      }
      
      // 获取文件信息
      const fileInfo = await RNFS.stat(filePath);
      
      // 处理文件
      await this.processMusicFile({
        name: fileName,
        path: filePath,
        size: fileInfo.size,
        mtime: fileInfo.mtime,
        isDirectory: () => false,
      });
      
      // 保存更新后的音乐列表
      await this.saveScannedMusic();
      
      console.log(`已添加音乐: ${fileName}`);
      return this.scannedMusic[this.scannedMusic.length - 1];
    } catch (error) {
      console.error('添加音乐失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const localMusicScanner = new LocalMusicScanner();

export default localMusicScanner;