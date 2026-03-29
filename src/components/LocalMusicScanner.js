/**
 * 本地音乐扫描界面组件
 * 提供音乐文件扫描的UI界面，包括权限请求、扫描进度、音乐列表等
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import localMusicScanner from '../services/localMusicScanner';

const LocalMusicScanner = ({ onScanComplete, theme }) => {
  const [scanStatus, setScanStatus] = useState({
    isScanning: false,
    progress: 0,
    scannedFiles: 0,
    totalFiles: 0,
    foundMusic: 0,
  });
  
  const [localMusic, setLocalMusic] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [scanPaths, setScanPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);

  // 初始化组件
  useEffect(() => {
    initializeComponent();
    
    // 清理函数
    return () => {
      if (localMusicScanner.isScanning) {
        localMusicScanner.stopScan();
      }
    };
  }, []);

  /**
   * 初始化组件
   */
  const initializeComponent = async () => {
    try {
      // 检查权限状态
      await checkPermissionStatus();
      
      // 加载已扫描的音乐
      const savedMusic = await localMusicScanner.getLocalMusic();
      setLocalMusic(savedMusic);
      
      // 获取默认扫描路径
      const defaultPaths = localMusicScanner.getDefaultScanPaths();
      setScanPaths(defaultPaths);
      
      // 设置回调函数
      localMusicScanner.setProgressCallback(handleProgressUpdate);
      localMusicScanner.setCompleteCallback(handleScanComplete);
      localMusicScanner.setErrorCallback(handleScanError);
      
    } catch (error) {
      console.error('初始化失败:', error);
      Alert.alert('初始化失败', error.message || '无法初始化音乐扫描器');
    }
  };

  /**
   * 检查权限状态
   */
  const checkPermissionStatus = async () => {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
          );
          setPermissionStatus(hasPermission ? 'granted' : 'denied');
        } else {
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          );
          setPermissionStatus(hasPermission ? 'granted' : 'denied');
        }
      } else {
        // iOS 默认认为有权限（实际上需要Info.plist配置）
        setPermissionStatus('granted');
      }
    } catch (error) {
      console.error('权限检查失败:', error);
      setPermissionStatus('error');
    }
  };

  /**
   * 请求权限
   */
  const requestPermission = async () => {
    try {
      let granted;
      
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
            {
              title: '音乐文件读取权限',
              message: '应用需要访问您的音乐文件来创建闹钟',
              buttonNeutral: '稍后询问',
              buttonNegative: '取消',
              buttonPositive: '确定',
            },
          );
        } else {
          granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: '存储读取权限',
              message: '应用需要访问您的存储来扫描音乐文件',
              buttonNeutral: '稍后询问',
              buttonNegative: '取消',
              buttonPositive: '确定',
            },
          );
        }
        
        const hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        setPermissionStatus(hasPermission ? 'granted' : 'denied');
        
        if (!hasPermission) {
          Alert.alert('权限被拒绝', '您需要授予文件读取权限才能扫描音乐文件。');
        }
        
        return hasPermission;
      }
      
      return true;
    } catch (error) {
      console.error('权限请求失败:', error);
      setPermissionStatus('error');
      Alert.alert('权限请求失败', error.message || '无法请求文件读取权限');
      return false;
    }
  };

  /**
   * 开始扫描
   */
  const startScan = async () => {
    if (scanStatus.isScanning) {
      Alert.alert('扫描正在进行中', '请等待当前扫描完成。');
      return;
    }
    
    // 检查权限
    if (permissionStatus !== 'granted') {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;
    }
    
    try {
      // 开始扫描
      await localMusicScanner.startScan();
      
    } catch (error) {
      console.error('扫描失败:', error);
      Alert.alert('扫描失败', error.message || '无法开始扫描音乐文件');
    }
  };

  /**
   * 停止扫描
   */
  const stopScan = () => {
    if (scanStatus.isScanning) {
      localMusicScanner.stopScan();
    }
  };

  /**
   * 处理进度更新
   */
  const handleProgressUpdate = (progressData) => {
    setScanStatus({
      isScanning: true,
      progress: progressData.progress,
      scannedFiles: progressData.scannedCount,
      totalFiles: progressData.totalCount,
      foundMusic: progressData.foundMusicCount,
    });
  };

  /**
   * 处理扫描完成
   */
  const handleScanComplete = (musicList) => {
    setScanStatus(prev => ({
      ...prev,
      isScanning: false,
      progress: 100,
    }));
    
    setLocalMusic(musicList);
    
    // 通知父组件
    if (onScanComplete) {
      onScanComplete(musicList);
    }
    
    Alert.alert('扫描完成', `成功找到 ${musicList.length} 首音乐文件`);
  };

  /**
   * 处理扫描错误
   */
  const handleScanError = (error) => {
    setScanStatus(prev => ({
      ...prev,
      isScanning: false,
    }));
    
    Alert.alert('扫描错误', error.message || '扫描过程中发生错误');
  };

  /**
   * 清除本地音乐缓存
   */
  const clearLocalMusicCache = () => {
    Alert.alert(
      '确认清除',
      '确定要清除所有扫描到的本地音乐吗？此操作不可撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await localMusicScanner.clearLocalMusicCache();
              setLocalMusic([]);
              Alert.alert('成功', '本地音乐缓存已清除');
            } catch (error) {
              Alert.alert('清除失败', error.message || '无法清除本地音乐缓存');
            }
          },
        },
      ],
    );
  };

  /**
   * 扫描特定路径
   */
  const scanSpecificPath = async (path) => {
    setSelectedPath(path);
    
    try {
      const result = await localMusicScanner.checkPathForMusic(path);
      
      if (result.musicCount > 0) {
        Alert.alert(
          '发现音乐文件',
          `在路径 ${path} 中发现 ${result.musicCount} 首音乐文件。\n\n是否开始扫描？`,
          [
            { text: '取消', style: 'cancel' },
            {
              text: '开始扫描',
              onPress: async () => {
                // 使用该路径进行扫描
                await localMusicScanner.startScan({ scanPaths: [path] });
              },
            },
          ],
        );
      } else {
        Alert.alert('未发现音乐文件', '该路径中没有找到音乐文件。');
      }
    } catch (error) {
      Alert.alert('路径检查失败', error.message || '无法检查该路径');
    }
  };

  /**
   * 渲染权限状态
   */
  const renderPermissionStatus = () => {
    const statusMap = {
      granted: { icon: 'check-circle', color: '#4CAF50', text: '已授权' },
      denied: { icon: 'close-circle', color: '#F44336', text: '未授权' },
      unknown: { icon: 'help-circle', color: '#FF9800', text: '未知' },
      error: { icon: 'alert-circle', color: '#FF5722', text: '错误' },
    };
    
    const status = statusMap[permissionStatus] || statusMap.unknown;
    
    return (
      <View style={styles.permissionContainer}>
        <Icon name={status.icon} size={20} color={status.color} />
        <Text style={[styles.permissionText, { color: status.color }]}>
          文件读取权限: {status.text}
        </Text>
      </View>
    );
  };

  /**
   * 渲染扫描状态
   */
  const renderScanStatus = () => {
    return (
      <View style={styles.scanStatusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>扫描状态:</Text>
          <Text style={[
            styles.statusValue,
            { color: scanStatus.isScanning ? '#4CAF50' : '#757575' }
          ]}>
            {scanStatus.isScanning ? '扫描中' : '空闲'}
          </Text>
        </View>
        
        {scanStatus.isScanning && (
          <>
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${scanStatus.progress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{scanStatus.progress}%</Text>
            </View>
            
            <View style={styles.statsRow}>
              <Text style={styles.statText}>
                已扫描: {scanStatus.scannedFiles}/{scanStatus.totalFiles}
              </Text>
              <Text style={styles.statText}>
                发现音乐: {scanStatus.foundMusic}
              </Text>
            </View>
          </>
        )}
      </View>
    );
  };

  /**
   * 渲染音乐列表项
   */
  const renderMusicItem = ({ item }) => (
    <View style={styles.musicItem}>
      <Icon name="music-note" size={24} color={theme.colors.primary} />
      <View style={styles.musicInfo}>
        <Text style={styles.musicTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.musicArtist} numberOfLines={1}>
          {item.artist} - {item.album}
        </Text>
        <Text style={styles.musicDetails}>
          {item.fileType.toUpperCase()} • {formatFileSize(item.fileSize)}
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color="#757575" />
    </View>
  );

  /**
   * 渲染路径列表
   */
  const renderPathItem = ({ item }) => (
    <TouchableOpacity
      style={styles.pathItem}
      onPress={() => scanSpecificPath(item)}
    >
      <Icon name="folder" size={20} color={theme.colors.secondary} />
      <Text style={styles.pathText} numberOfLines={1}>
        {item}
      </Text>
      <Icon name="magnify" size={18} color="#757575" />
    </TouchableOpacity>
  );

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ScrollView style={styles.container}>
      {/* 权限状态 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>权限状态</Text>
        {renderPermissionStatus()}
        
        {permissionStatus !== 'granted' && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>请求权限</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 扫描控制 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>扫描控制</Text>
        {renderScanStatus()}
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.scanButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={startScan}
            disabled={scanStatus.isScanning}
          >
            <Icon 
              name={scanStatus.isScanning ? 'sync' : 'magnify'} 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.scanButtonText}>
              {scanStatus.isScanning ? '正在扫描...' : '开始扫描'}
            </Text>
          </TouchableOpacity>
          
          {scanStatus.isScanning && (
            <TouchableOpacity
              style={[
                styles.scanButton,
                { backgroundColor: '#F44336' },
              ]}
              onPress={stopScan}
            >
              <Icon name="stop" size={20} color="#FFFFFF" />
              <Text style={styles.scanButtonText}>停止</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 扫描路径 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>扫描路径</Text>
        <Text style={styles.sectionDescription}>
          默认扫描以下路径中的音乐文件，点击路径可单独扫描:
        </Text>
        
        <FlatList
          data={scanPaths}
          renderItem={renderPathItem}
          keyExtractor={(item, index) => `path-${index}`}
          scrollEnabled={false}
        />
      </View>

      {/* 本地音乐列表 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>本地音乐</Text>
          <Text style={styles.musicCount}>{localMusic.length} 首</Text>
        </View>
        
        {localMusic.length > 0 ? (
          <>
            <FlatList
              data={localMusic.slice(0, 10)} // 只显示前10首
              renderItem={renderMusicItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
            
            {localMusic.length > 10 && (
              <Text style={styles.moreText}>
                还有 {localMusic.length - 10} 首音乐...
              </Text>
            )}
            
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearLocalMusicCache}
            >
              <Text style={styles.clearButtonText}>清除本地音乐缓存</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="music-off" size={48} color="#BDBDBD" />
            <Text style={styles.emptyText}>
              暂无本地音乐，请点击"开始扫描"按钮扫描设备上的音乐文件。
            </Text>
          </View>
        )}
      </View>

      {/* 帮助信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>帮助信息</Text>
        <View style={styles.helpItem}>
          <Icon name="information" size={16} color={theme.colors.primary} />
          <Text style={styles.helpText}>
            支持的音乐格式: MP3, WAV, FLAC, AAC, M4A, OGG, WMA, APE, OPUS, ALAC
          </Text>
        </View>
        <View style={styles.helpItem}>
          <Icon name="information" size={16} color={theme.colors.primary} />
          <Text style={styles.helpText}>
            扫描可能需要几分钟时间，请保持应用在前台运行。
          </Text>
        </View>
        <View style={styles.helpItem}>
          <Icon name="information" size={16} color={theme.colors.primary} />
          <Text style={styles.helpText}>
            音乐扫描需要文件读取权限，请确保已授予相应权限。
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
    lineHeight: 20,
  },
  permissionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    marginLeft: 8,
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  scanStatusContainer: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: '#212121',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 14,
    color: '#757575',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 140,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  pathItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  pathText: {
    flex: 1,
    fontSize: 14,
    color: '#212121',
    marginLeft: 12,
    marginRight: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  musicCount: {
    fontSize: 16,
    color: '#757575',
    fontWeight: '500',
  },
  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  musicInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  musicTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 4,
  },
  musicArtist: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  musicDetails: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  moreText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  clearButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '500',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default LocalMusicScanner;