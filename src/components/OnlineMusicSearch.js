/**
 * 在线音乐搜索组件
 * 提供跨平台在线音乐搜索、播放和收藏功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import {
  Searchbar,
  Card,
  Avatar,
  Button,
  IconButton,
  Chip,
  Divider,
  Surface,
  useTheme,
  Portal,
  Modal,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';

// 导入音乐服务
import musicService from '../services/musicService';

const OnlineMusicSearch = ({ onSongSelect, onClose, theme }) => {
  const dispatch = useDispatch();
  
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['netease', 'qqmusic']);
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'recommendations', 'playlists', 'favorites'
  const [hotKeywords, setHotKeywords] = useState([]);
  const [recommendedPlaylists, setRecommendedPlaylists] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  
  // 初始化
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // 加载初始数据
  const loadInitialData = async () => {
    try {
      // 获取支持的平台
      const platformList = await musicService.getOnlineMusicPlatforms();
      setPlatforms(platformList);
      
      // 获取热门搜索关键词
      const keywords = await musicService.getHotSearchKeywords();
      setHotKeywords(keywords.slice(0, 10));
      
      // 获取推荐歌单
      const playlists = await musicService.getRecommendedPlaylists();
      setRecommendedPlaylists(playlists.slice(0, 5));
      
      // 获取收藏列表
      const favList = await musicService.getFavorites();
      setFavorites(favList);
      
      // 加载搜索历史
      const history = await loadSearchHistory();
      setSearchHistory(history);
    } catch (error) {
      console.error('加载初始数据失败:', error);
    }
  };
  
  // 加载搜索历史
  const loadSearchHistory = async () => {
    try {
      // 这里可以从本地存储加载搜索历史
      // 暂时返回空数组
      return [];
    } catch (error) {
      return [];
    }
  };
  
  // 保存搜索历史
  const saveSearchHistory = async (query) => {
    try {
      if (!query.trim()) return;
      
      const updatedHistory = [
        query,
        ...searchHistory.filter(q => q !== query),
      ].slice(0, 10); // 最多保存10条
      
      setSearchHistory(updatedHistory);
      // 这里可以保存到本地存储
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  };
  
  // 执行搜索
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    try {
      // 保存搜索历史
      await saveSearchHistory(query);
      
      // 执行搜索
      const results = await musicService.searchOnlineMusic(query, selectedPlatforms);
      setSearchResults(results);
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlatforms]);
  
  // 处理搜索
  const handleSearch = useCallback(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);
  
  // 处理热门关键词点击
  const handleHotKeywordPress = (keyword) => {
    setSearchQuery(keyword);
    performSearch(keyword);
  };
  
  // 处理平台选择
  const handlePlatformToggle = (platformId) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };
  
  // 处理歌曲选择
  const handleSongSelect = async (song) => {
    try {
      // 获取歌曲详情和播放URL
      const songDetails = await musicService.getOnlineMusicDetails(song.id, song.platform);
      const songUrl = await musicService.getOnlineMusicUrl(song.id, song.platform);
      
      if (songUrl) {
        const enhancedSong = {
          ...song,
          ...songDetails,
          url: songUrl,
          isLocal: false,
        };
        
        if (onSongSelect) {
          onSongSelect(enhancedSong);
        }
      } else {
        console.error('无法获取歌曲播放URL');
        // 可以显示错误提示
      }
    } catch (error) {
      console.error('选择歌曲失败:', error);
    }
  };
  
  // 处理添加到收藏
  const handleAddToFavorites = async (song) => {
    try {
      const success = await musicService.addToFavorites(song);
      if (success) {
        // 更新收藏列表
        const updatedFavorites = [...favorites, song];
        setFavorites(updatedFavorites);
        
        // 可以显示成功提示
      }
    } catch (error) {
      console.error('添加到收藏失败:', error);
    }
  };
  
  // 处理从收藏中移除
  const handleRemoveFromFavorites = async (songId, platform) => {
    try {
      const success = await musicService.removeFromFavorites(songId, platform);
      if (success) {
        // 更新收藏列表
        const updatedFavorites = favorites.filter(fav => 
          !(fav.id === songId && fav.platform === platform)
        );
        setFavorites(updatedFavorites);
      }
    } catch (error) {
      console.error('从收藏中移除失败:', error);
    }
  };
  
  // 检查歌曲是否已收藏
  const isSongFavorited = (songId, platform) => {
    return favorites.some(fav => fav.id === songId && fav.platform === platform);
  };
  
  // 渲染平台选择器
  const renderPlatformSelector = () => (
    <View style={styles.platformSelector}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        选择搜索平台
      </Text>
      <View style={styles.platformChips}>
        {platforms.map(platform => (
          <Chip
            key={platform.id}
            selected={selectedPlatforms.includes(platform.id)}
            onPress={() => handlePlatformToggle(platform.id)}
            style={[
              styles.platformChip,
              selectedPlatforms.includes(platform.id) && {
                backgroundColor: platform.color + '20', // 20% 透明度
              },
            ]}
            textStyle={[
              styles.platformChipText,
              selectedPlatforms.includes(platform.id) && {
                color: platform.color,
              },
            ]}
            icon={() => (
              <MaterialCommunityIcons
                name={platform.icon}
                size={16}
                color={selectedPlatforms.includes(platform.id) ? platform.color : theme.colors.secondary}
              />
            )}
          >
            {platform.name}
          </Chip>
        ))}
      </View>
    </View>
  );
  
  // 渲染热门搜索关键词
  const renderHotKeywords = () => (
    <View style={styles.hotKeywordsSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        热门搜索
      </Text>
      <View style={styles.hotKeywords}>
        {hotKeywords.map((keyword, index) => (
          <Chip
            key={index}
            mode="outlined"
            onPress={() => handleHotKeywordPress(keyword.keyword)}
            style={styles.hotKeywordChip}
            textStyle={styles.hotKeywordText}
          >
            {keyword.keyword}
          </Chip>
        ))}
      </View>
    </View>
  );
  
  // 渲染搜索历史
  const renderSearchHistory = () => (
    <View style={styles.searchHistorySection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        搜索历史
      </Text>
      <View style={styles.searchHistory}>
        {searchHistory.map((query, index) => (
          <Chip
            key={index}
            mode="outlined"
            onPress={() => handleHotKeywordPress(query)}
            style={styles.historyChip}
            textStyle={styles.historyText}
            icon="history"
          >
            {query}
          </Chip>
        ))}
        {searchHistory.length === 0 && (
          <Text style={[styles.emptyText, { color: theme.colors.secondary }]}>
            暂无搜索历史
          </Text>
        )}
      </View>
    </View>
  );
  
  // 渲染推荐歌单
  const renderRecommendedPlaylists = () => (
    <View style={styles.recommendedSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        推荐歌单
      </Text>
      <FlatList
        data={recommendedPlaylists}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.playlistCard}
            onPress={() => {
              // 可以跳转到歌单详情页面
              console.log('打开歌单:', item.name);
            }}
          >
            <Image
              source={{ uri: item.cover }}
              style={styles.playlistCover}
              defaultSource={require('../assets/default-playlist-cover.png')}
            />
            <Text style={[styles.playlistName, { color: theme.colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.playlistInfo, { color: theme.colors.secondary }]} numberOfLines={1}>
              {item.creator} · {item.playCount}次播放
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
  
  // 渲染搜索结果
  const renderSearchResultItem = ({ item }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => handleSongSelect(item)}
    >
      <View style={styles.songInfo}>
        <Image
          source={{ uri: item.cover }}
          style={styles.songCover}
          defaultSource={require('../assets/default-song-cover.png')}
        />
        <View style={styles.songDetails}>
          <Text style={[styles.songTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.songArtist, { color: theme.colors.secondary }]} numberOfLines={1}>
            {item.artist} · {item.album}
          </Text>
          <View style={styles.songMeta}>
            <Chip
              mode="outlined"
              style={styles.platformTag}
              textStyle={[
                styles.platformTagText,
                { color: item.platformColor },
              ]}
              icon={() => (
                <MaterialCommunityIcons
                  name={item.platformIcon}
                  size={12}
                  color={item.platformColor}
                />
              )}
            >
              {item.platformName}
            </Chip>
            <Text style={[styles.songDuration, { color: theme.colors.secondary }]}>
              {formatDuration(item.duration)}
            </Text>
          </View>
        </View>
      </View>
      <IconButton
        icon={isSongFavorited(item.id, item.platform) ? 'heart' : 'heart-outline'}
        size={24}
        color={isSongFavorited(item.id, item.platform) ? theme.colors.error : theme.colors.secondary}
        onPress={() => {
          if (isSongFavorited(item.id, item.platform)) {
            handleRemoveFromFavorites(item.id, item.platform);
          } else {
            handleAddToFavorites(item);
          }
        }}
      />
    </TouchableOpacity>
  );
  
  // 渲染收藏列表
  const renderFavoriteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => handleSongSelect(item)}
    >
      <View style={styles.songInfo}>
        <Image
          source={{ uri: item.cover }}
          style={styles.songCover}
          defaultSource={require('../assets/default-song-cover.png')}
        />
        <View style={styles.songDetails}>
          <Text style={[styles.songTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.songArtist, { color: theme.colors.secondary }]} numberOfLines={1}>
            {item.artist} · {item.album}
          </Text>
          <View style={styles.songMeta}>
            <Chip
              mode="outlined"
              style={styles.platformTag}
              textStyle={[
                styles.platformTagText,
                { color: item.platformColor },
              ]}
              icon={() => (
                <MaterialCommunityIcons
                  name={item.platformIcon}
                  size={12}
                  color={item.platformColor}
                />
              )}
            >
              {item.platformName}
            </Chip>
            <Text style={[styles.songDuration, { color: theme.colors.secondary }]}>
              {formatDuration(item.duration)}
            </Text>
          </View>
        </View>
      </View>
      <IconButton
        icon="heart"
        size={24}
        color={theme.colors.error}
        onPress={() => handleRemoveFromFavorites(item.id, item.platform)}
      />
    </TouchableOpacity>
  );
  
  // 格式化时长
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="cloud-search"
        size={80}
        color={theme.colors.secondary}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {activeTab === 'search' ? '搜索在线音乐' : '暂无内容'}
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.secondary }]}>
        {activeTab === 'search' 
          ? '输入关键词搜索海量在线音乐' 
          : '这里还没有内容，快去搜索音乐吧'}
      </Text>
    </View>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 顶部搜索栏 */}
      <View style={styles.header}>
        <Searchbar
          placeholder="搜索在线音乐..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchBar}
          icon="arrow-left"
          onIconPress={onClose}
          loading={isLoading}
          theme={theme}
        />
      </View>
      
      {/* 平台选择器 */}
      {activeTab === 'search' && renderPlatformSelector()}
      
      {/* 标签页 */}
      <View style={styles.tabContainer}>
        <Button
          mode={activeTab === 'search' ? 'contained' : 'text'}
          onPress={() => setActiveTab('search')}
          style={styles.tabButton}
        >
          搜索
        </Button>
        <Button
          mode={activeTab === 'favorites' ? 'contained' : 'text'}
          onPress={() => setActiveTab('favorites')}
          style={styles.tabButton}
        >
          收藏
        </Button>
        <Button
          mode={activeTab === 'recommendations' ? 'contained' : 'text'}
          onPress={() => setActiveTab('recommendations')}
          style={styles.tabButton}
        >
          推荐
        </Button>
      </View>
      
      {/* 内容区域 */}
      <View style={styles.content}>
        {activeTab === 'search' && searchResults.length === 0 && (
          <>
            {renderHotKeywords()}
            {renderSearchHistory()}
            {renderRecommendedPlaylists()}
          </>
        )}
        
        {activeTab === 'search' && searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item, index) => `${item.id}_${item.platform}_${index}`}
            renderItem={renderSearchResultItem}
            ItemSeparatorComponent={() => <Divider />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleSearch}
                colors={[theme.colors.primary]}
              />
            }
          />
        )}
        
        {activeTab === 'favorites' && (
          <FlatList
            data={favorites}
            keyExtractor={(item, index) => `${item.id}_${item.platform}_${index}`}
            renderItem={renderFavoriteItem}
            ItemSeparatorComponent={() => <Divider />}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={loadInitialData}
                colors={[theme.colors.primary]}
              />
            }
          />
        )}
        
        {activeTab === 'recommendations' && (
          <View style={styles.recommendationsContainer}>
            {renderRecommendedPlaylists()}
            <View style={styles.dailyRecommendations}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                每日推荐
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.secondary }]}>
                功能开发中...
              </Text>
            </View>
          </View>
        )}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  searchBar: {
    elevation: 2,
  },
  platformSelector: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  platformChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  platformChipText: {
    fontSize: 12,
  },
  hotKeywordsSection: {
    padding: 16,
  },
  hotKeywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hotKeywordChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  hotKeywordText: {
    fontSize: 12,
  },
  searchHistorySection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchHistory: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  historyText: {
    fontSize: 12,
  },
  recommendedSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  playlistCard: {
    width: 120,
    marginRight: 12,
  },
  playlistCover: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  playlistName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  playlistInfo: {
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  songCover: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    marginBottom: 4,
  },
  songMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformTag: {
    height: 20,
    marginRight: 8,
  },
  platformTagText: {
    fontSize: 10,
  },
  songDuration: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  recommendationsContainer: {
    flex: 1,
  },
  dailyRecommendations: {
    padding: 16,
  },
});

export default OnlineMusicSearch;