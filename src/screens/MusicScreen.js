/**
 * 音乐管理页面
 * 浏览本地音乐库、创建播放列表、搜索音乐、扫描本地音乐
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme, Surface, Card, Avatar, Button, IconButton, FAB, Divider, Chip, Searchbar, Portal } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

// 导入音乐服务和扫描器
import musicService from '../services/musicService';
import localMusicScanner from '../services/localMusicScanner';
import MusicPlayer from '../components/MusicPlayer';
import LocalMusicScanner from '../components/LocalMusicScanner';
import OnlineMusicSearch from '../components/OnlineMusicSearch';

const MusicScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // 从Redux获取状态
  const { musicList, currentPlaylist, playingMusic, isPlaying, playbackState } = useSelector(state => state.music);
  const { musicLibraryPath, defaultPlaylists } = useSelector(state => state.settings);
  
  // 本地状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [filteredMusic, setFilteredMusic] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  
  // 本地音乐扫描状态
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedMusicCount, setScannedMusicCount] = useState(0);
  const [musicSource, setMusicSource] = useState('local'); // 'local' | 'online'
  
  // 在线音乐搜索状态
  const [showOnlineSearchModal, setShowOnlineSearchModal] = useState(false);
  const [onlineSearchResults, setOnlineSearchResults] = useState([]);
  const [selectedOnlineSong, setSelectedOnlineSong] = useState(null);
  const [favorites, setFavorites] = useState([]);
  
  // 分类选项
  const categories = [
    { id: 'all', name: '全部音乐', icon: 'music-note' },
    { id: 'recent', name: '最近添加', icon: 'clock' },
    { id: 'favorites', name: '我的收藏', icon: 'heart' },
    { id: 'playlists', name: '播放列表', icon: 'playlist-music' },
    { id: 'artists', name: '艺术家', icon: 'account-music' },
    { id: 'albums', name: '专辑', icon: 'album' },
    { id: 'local', name: '本地音乐', icon: 'folder-music' },
    { id: 'online', name: '在线音乐', icon: 'cloud-music' },
  ];
  
  // 默认播放列表
  const defaultPlaylistsData = [
    { id: 'morning', name: '晨间唤醒', count: 12, color: '#FF8A65' },
    { id: 'work', name: '工作专注', count: 8, color: '#4FC3F7' },
    { id: 'relax', name: '放松休息', count: 15, color: '#81C784' },
    { id: 'sleep', name: '睡眠助眠', count: 10, color: '#9575CD' },
  ];
  
  useEffect(() => {
    // 加载音乐库
    loadMusicLibrary();
  }, [musicLibraryPath]);
  
  useEffect(() => {
    // 过滤音乐
    filterMusic();
  }, [searchQuery, selectedCategory, selectedPlaylist, musicList]);
  
  const loadMusicLibrary = async () => {
    setIsLoading(true);
    try {
      // 根据当前选择的音乐源加载音乐
      if (musicSource === 'local') {
        // 加载本地扫描的音乐
        const localMusic = await localMusicScanner.getLocalMusic();
        
        if (localMusic.length === 0) {
          // 如果没有本地音乐，显示引导用户扫描的界面
          console.log('未找到本地音乐，建议用户扫描设备上的音乐文件');
        }
        
        // 更新Redux store中的音乐列表
        dispatch({
          type: 'music/updateMusicList',
          payload: localMusic,
        });
      } else {
        // 加载在线音乐
        await musicService.loadOnlineMusic();
        
        // 获取收藏列表
        const favList = await musicService.getFavorites();
        setFavorites(favList);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('加载音乐库失败:', error);
      setIsLoading(false);
    }
  };
  
  // 开始扫描本地音乐
  const startLocalMusicScan = async () => {
    try {
      setIsScanning(true);
      setScanProgress(0);
      
      // 打开扫描器模态框
      setShowScannerModal(true);
      
    } catch (error) {
      console.error('开始扫描失败:', error);
      Alert.alert('扫描失败', error.message || '无法开始扫描本地音乐');
      setIsScanning(false);
    }
  };
  
  // 处理扫描进度更新
  const handleScanProgress = (progressData) => {
    setScanProgress(progressData.progress);
  };
  
  // 处理扫描完成
  const handleScanComplete = (musicList) => {
    setIsScanning(false);
    setScannedMusicCount(musicList.length);
    
    // 更新音乐列表
    dispatch({
      type: 'music/updateMusicList',
      payload: musicList,
    });
    
    // 显示成功消息
    Alert.alert(
      '扫描完成',
      `成功扫描到 ${musicList.length} 首本地音乐`,
      [
        {
          text: '查看音乐',
          onPress: () => setSelectedCategory('local'),
        },
        { text: '确定', style: 'default' },
      ]
    );
    
    // 关闭模态框
    setShowScannerModal(false);
  };
  
  // 处理扫描错误
  const handleScanError = (error) => {
    setIsScanning(false);
    Alert.alert('扫描错误', error.message || '扫描过程中发生错误');
  };
  
  // 切换音乐源
  const toggleMusicSource = (source) => {
    setMusicSource(source);
    if (source === 'local') {
      setSelectedCategory('local');
    } else {
      setSelectedCategory('online');
    }
    
    // 重新加载音乐库
    loadMusicLibrary();
  };
  
  // 打开在线音乐搜索
  const openOnlineMusicSearch = () => {
    setShowOnlineSearchModal(true);
  };
  
  // 关闭在线音乐搜索
  const closeOnlineMusicSearch = () => {
    setShowOnlineSearchModal(false);
  };
  
  // 处理在线歌曲选择
  const handleOnlineSongSelect = async (song) => {
    try {
      setSelectedOnlineSong(song);
      
      // 播放选中的歌曲
      await musicService.playMusic(song);
      
      // 显示播放器
      setShowPlayer(true);
      
      // 关闭搜索模态框
      setShowOnlineSearchModal(false);
      
      // 添加到播放记录
      await musicService.addPlayRecord(song);
      
    } catch (error) {
      console.error('播放在线歌曲失败:', error);
      Alert.alert('播放失败', '无法播放选中的在线歌曲');
    }
  };
  
  // 搜索在线音乐
  const searchOnlineMusic = async (query) => {
    try {
      const results = await musicService.searchOnlineMusic(query);
      setOnlineSearchResults(results);
    } catch (error) {
      console.error('搜索在线音乐失败:', error);
      setOnlineSearchResults([]);
    }
  };
  
  const filterMusic = () => {
    let result = [...musicList];
    
    // 按音乐源过滤
    if (selectedCategory === 'local') {
      result = result.filter(music => music.isLocalFile === true);
    } else if (selectedCategory === 'online') {
      result = result.filter(music => music.isLocalFile === false);
    }
    
    // 按搜索关键词过滤
    if (searchQuery) {
      result = result.filter(music => 
        music.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        music.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 按其他分类过滤
    if (selectedCategory !== 'all' && selectedCategory !== 'local' && selectedCategory !== 'online') {
      switch (selectedCategory) {
        case 'recent':
          result = result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);
          break;
        case 'favorites':
          result = result.filter(music => music.rating >= 4); // 假设评分4+为收藏
          break;
        case 'artists':
          // 这里可以按艺术家分组显示
          break;
        case 'albums':
          // 这里可以按专辑分组显示
          break;
      }
    }
    
    // 按播放列表过滤
    if (selectedPlaylist) {
      result = result.filter(music => 
        music.playlists && music.playlists.includes(selectedPlaylist.id)
      );
    }
    
    setFilteredMusic(result);
  };
  
  const playMusic = async (music) => {
    try {
      await musicService.playMusic(music);
      setShowPlayer(true);
    } catch (error) {
      console.error('播放音乐失败:', error);
    }
  };
  
  const addToPlaylist = (music, playlistId) => {
    dispatch(addMusicToPlaylist({ musicId: music.id, playlistId }));
  };
  
  const toggleFavorite = (musicId) => {
    dispatch(toggleMusicFavorite(musicId));
  };
  
  const createNewPlaylist = () => {
    navigation.navigate('PlaylistCreate', {
      onCreate: (playlist) => {
        // 创建播放列表后的回调
        console.log('创建播放列表:', playlist);
      }
    });
  };
  
  const renderMusicItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => playMusic(item)}
      onLongPress={() => console.log('长按音乐:', item.title)}
      activeOpacity={0.7}
    >
      <Card style={styles.musicCard}>
        <Card.Content style={styles.musicCardContent}>
          <Avatar.Image
            size={50}
            source={item.cover ? { uri: item.cover } : require('../../assets/default-album.png')}
            style={styles.albumCover}
          />
          
          <View style={styles.musicInfo}>
            <Text style={[styles.musicTitle, { color: theme.colors.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.musicArtist, { color: theme.colors.secondary }]}>
              {item.artist}
            </Text>
            <View style={styles.musicMeta}>
              <Text style={[styles.musicDuration, { color: theme.colors.secondary }]}>
                {item.duration}
              </Text>
              {item.category && (
                <Chip
                  mode="outlined"
                  style={styles.categoryChip}
                  textStyle={{ fontSize: 10 }}
                >
                  {item.category}
                </Chip>
              )}
            </View>
          </View>
          
          <View style={styles.musicActions}>
            <IconButton
              icon={item.isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              iconColor={item.isFavorite ? theme.colors.error : theme.colors.secondary}
              onPress={() => toggleFavorite(item.id)}
            />
            <IconButton
              icon="playlist-plus"
              size={20}
              iconColor={theme.colors.secondary}
              onPress={() => console.log('添加到播放列表')}
            />
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
  
  const renderPlaylistItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => setSelectedPlaylist(item)}
      activeOpacity={0.7}
    >
      <Card style={[styles.playlistCard, { borderColor: item.color }]}>
        <Card.Content style={styles.playlistContent}>
          <View style={[styles.playlistIconContainer, { backgroundColor: item.color + '20' }]}>
            <MaterialCommunityIcons
              name="playlist-music"
              size={30}
              color={item.color}
            />
          </View>
          
          <View style={styles.playlistInfo}>
            <Text style={[styles.playlistName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.playlistCount, { color: theme.colors.secondary }]}>
              {item.count} 首歌曲
            </Text>
          </View>
          
          <IconButton
            icon="chevron-right"
            size={20}
            iconColor={theme.colors.secondary}
          />
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
  
  const renderEmptyState = () => {
    const isLocalCategory = selectedCategory === 'local';
    
    return (
      <View style={styles.emptyContainer}>
        {isLocalCategory ? (
          <MaterialCommunityIcons
            name="folder-music"
            size={80}
            color={theme.colors.secondary}
          />
        ) : (
          <MaterialCommunityIcons
            name="music-off"
            size={80}
            color={theme.colors.secondary}
          />
        )}
        
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          {isLocalCategory ? '本地音乐库是空的' : '音乐库是空的'}
        </Text>
        
        <Text style={[styles.emptyDescription, { color: theme.colors.secondary }]}>
          {isLocalCategory 
            ? '还没有扫描到本地音乐文件，你可以：'
            : '还没有找到任何音乐，你可以：'
          }
        </Text>
        
        <View style={styles.emptyActions}>
          {isLocalCategory ? (
            <>
              <Button
                mode="contained"
                icon="folder-search"
                onPress={startLocalMusicScan}
                style={styles.emptyButton}
                loading={isScanning}
                disabled={isScanning}
              >
                {isScanning ? '正在扫描...' : '扫描本地音乐'}
              </Button>
              
              <Button
                mode="outlined"
                icon="cloud-search"
                onPress={openOnlineMusicSearch}
                style={styles.emptyButton}
              >
                搜索在线音乐
              </Button>
            </>
          ) : (
            <>
              <Button
                mode="contained"
                icon="cloud-search"
                onPress={openOnlineMusicSearch}
                style={styles.emptyButton}
              >
                搜索在线音乐
              </Button>
              
              <Button
                mode="outlined"
                icon="folder-music"
                onPress={() => toggleMusicSource('local')}
                style={styles.emptyButton}
              >
                切换到本地音乐
              </Button>
            </>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="搜索音乐、艺术家、专辑"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={theme.colors.primary}
        />
      </View>
      
      {/* 分类标签 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            onPress={() => setSelectedCategory(category.id)}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive,
              { backgroundColor: selectedCategory === category.id ? theme.colors.primary + '20' : 'transparent' }
            ]}
          >
            <MaterialCommunityIcons
              name={category.icon}
              size={20}
              color={selectedCategory === category.id ? theme.colors.primary : theme.colors.secondary}
            />
            <Text
              style={[
                styles.categoryText,
                { color: selectedCategory === category.id ? theme.colors.primary : theme.colors.secondary }
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* 播放列表区域 */}
      {selectedCategory === 'playlists' && (
        <View style={styles.playlistsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              我的播放列表
            </Text>
            <Button
              mode="text"
              icon="plus"
              onPress={createNewPlaylist}
            >
              新建
            </Button>
          </View>
          
          <FlatList
            data={defaultPlaylistsData}
            renderItem={renderPlaylistItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.playlistsList}
          />
        </View>
      )}
      
      {/* 音乐列表 */}
      <View style={styles.musicListContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {selectedPlaylist ? selectedPlaylist.name : '音乐列表'}
            {filteredMusic.length > 0 && (
              <Text style={[styles.musicCount, { color: theme.colors.secondary }]}>
                ({filteredMusic.length})
              </Text>
            )}
          </Text>
          
          {selectedPlaylist && (
            <Button
              mode="text"
              icon="close"
              onPress={() => setSelectedPlaylist(null)}
            >
              返回
            </Button>
          )}
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={{ color: theme.colors.text }}>加载音乐中...</Text>
          </View>
        ) : filteredMusic.length > 0 ? (
          <FlatList
            data={filteredMusic}
            renderItem={renderMusicItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.musicList}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
      
      {/* 底部播放器 */}
      {showPlayer && playingMusic && (
        <MusicPlayer
          music={playingMusic}
          isPlaying={isPlaying}
          onClose={() => setShowPlayer(false)}
        />
      )}
      
      {/* 悬浮按钮 */}
      <FAB
        icon={isScanning ? "sync" : "refresh"}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={loadMusicLibrary}
        label={isScanning ? "正在扫描..." : "刷新音乐库"}
        disabled={isScanning}
      />
      
      {/* 本地音乐扫描器模态框 */}
      <Portal>
        <Modal
          visible={showScannerModal}
          onDismiss={() => setShowScannerModal(false)}
          animationType="slide"
          transparent={false}
        >
          <LocalMusicScanner
            onScanComplete={handleScanComplete}
            onProgress={handleScanProgress}
            onError={handleScanError}
            theme={theme}
          />
        </Modal>
      </Portal>
      
      {/* 在线音乐搜索模态框 */}
      <Portal>
        <Modal
          visible={showOnlineSearchModal}
          onDismiss={closeOnlineMusicSearch}
          animationType="slide"
          transparent={false}
        >
          <OnlineMusicSearch
            onSongSelect={handleOnlineSongSelect}
            onClose={closeOnlineMusicSearch}
            theme={theme}
          />
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    borderColor: 'currentColor',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  playlistsSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  musicCount: {
    fontSize: 14,
    fontWeight: '400',
    marginLeft: 4,
  },
  playlistsList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  playlistCard: {
    width: 160,
    marginRight: 12,
    borderWidth: 2,
  },
  playlistContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  playlistCount: {
    fontSize: 12,
  },
  musicListContainer: {
    flex: 1,
  },
  musicList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  musicCard: {
    marginBottom: 8,
  },
  musicCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumCover: {
    marginRight: 12,
  },
  musicInfo: {
    flex: 1,
  },
  musicTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  musicArtist: {
    fontSize: 14,
    marginBottom: 4,
  },
  musicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicDuration: {
    fontSize: 12,
    marginRight: 8,
  },
  categoryChip: {
    height: 20,
  },
  musicActions: {
    flexDirection: 'row',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyActions: {
    width: '100%',
  },
  emptyButton: {
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default MusicScreen;