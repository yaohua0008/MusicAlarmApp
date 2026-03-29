/**
 * 音乐播放器全屏页面
 * 提供完整的音乐播放控制体验
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  BackHandler,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme, Surface, Card, IconButton, Slider, Divider, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// 导入服务和组件
import musicService from '../services/musicService';
import { setPlayingMusic, togglePlayPause, setPlaybackPosition } from '../store/slices/musicSlice';

const { width, height } = Dimensions.get('window');

const MusicPlayerScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  
  // 从Redux获取状态
  const { playingMusic, isPlaying, playbackPosition, playbackState, currentPlaylist } = useSelector(state => state.music);
  
  // 本地状态
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [repeatMode, setRepeatMode] = useState('none'); // none, one, all
  const [shuffleMode, setShuffleMode] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [equalizerPreset, setEqualizerPreset] = useState('normal');
  
  // 动画引用
  const albumRotation = useRef(new Animated.Value(0)).current;
  const albumScale = useRef(new Animated.Value(1)).current;
  const lyricsOpacity = useRef(new Animated.Value(0)).current;
  
  // 监听播放状态变化
  useEffect(() => {
    if (playingMusic) {
      setDuration(playingMusic.duration || 180); // 默认3分钟
      
      // 启动专辑封面旋转动画
      if (isPlaying) {
        startAlbumRotation();
        Animated.spring(albumScale, {
          toValue: 1.05,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
      } else {
        stopAlbumRotation();
        Animated.spring(albumScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
      }
    }
    
    // 监听播放位置更新
    const interval = setInterval(() => {
      if (isPlaying && !isSeeking && playingMusic) {
        const newTime = Math.min(currentTime + 1, duration);
        setCurrentTime(newTime);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, playingMusic, isSeeking]);
  
  // 处理Android返回键
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // 返回时停止播放器旋转动画
      stopAlbumRotation();
      return false; // 允许默认返回行为
    });
    
    return () => backHandler.remove();
  }, []);
  
  // 启动专辑封面旋转动画
  const startAlbumRotation = () => {
    albumRotation.setValue(0);
    Animated.loop(
      Animated.timing(albumRotation, {
        toValue: 1,
        duration: 20000, // 20秒旋转一圈
        useNativeDriver: true,
      })
    ).start();
  };
  
  // 停止专辑封面旋转动画
  const stopAlbumRotation = () => {
    albumRotation.stopAnimation();
  };
  
  // 计算旋转角度
  const albumRotationInterpolate = albumRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // 格式化时间（秒转MM:SS）
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 处理播放/暂停
  const handlePlayPause = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (playingMusic) {
        if (isPlaying) {
          await musicService.pauseMusic();
        } else {
          await musicService.resumeMusic();
        }
        dispatch(togglePlayPause());
      } else {
        // 如果没有正在播放的音乐，播放当前播放列表的第一首
        if (currentPlaylist && currentPlaylist.length > 0) {
          await musicService.playMusic(currentPlaylist[0]);
          dispatch(setPlayingMusic(currentPlaylist[0]));
        }
      }
    } catch (error) {
      console.error('播放控制失败:', error);
    }
  };
  
  // 处理上一首/下一首
  const handlePrevious = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const previousMusic = await musicService.playPrevious();
      if (previousMusic) {
        dispatch(setPlayingMusic(previousMusic));
        setCurrentTime(0);
      }
    } catch (error) {
      console.error('播放上一首失败:', error);
    }
  };
  
  const handleNext = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const nextMusic = await musicService.playNext();
      if (nextMusic) {
        dispatch(setPlayingMusic(nextMusic));
        setCurrentTime(0);
      }
    } catch (error) {
      console.error('播放下一首失败:', error);
    }
  };
  
  // 处理进度条滑动
  const handleSeekStart = () => {
    setIsSeeking(true);
  };
  
  const handleSeekChange = (value) => {
    setCurrentTime(Math.round(value * duration));
  };
  
  const handleSeekComplete = async (value) => {
    const newTime = Math.round(value * duration);
    setCurrentTime(newTime);
    setIsSeeking(false);
    
    try {
      await musicService.seekTo(newTime);
      dispatch(setPlaybackPosition(newTime));
    } catch (error) {
      console.error('跳转播放位置失败:', error);
    }
  };
  
  // 切换重复模式
  const toggleRepeatMode = () => {
    const modes = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // 切换随机播放
  const toggleShuffleMode = () => {
    setShuffleMode(!shuffleMode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // 切换歌词显示
  const toggleLyrics = () => {
    Animated.timing(lyricsOpacity, {
      toValue: showLyrics ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setShowLyrics(!showLyrics);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // 调整播放速度
  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
    musicService.setPlaybackRate(rates[nextIndex]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // 示例歌词数据
  const lyrics = [
    { time: 0, text: "清晨的阳光洒在窗前" },
    { time: 15, text: "唤醒沉睡的梦想" },
    { time: 30, text: "新的一天开始了" },
    { time: 45, text: "带着希望和勇气出发" },
    { time: 60, text: "上班的路上有音乐陪伴" },
    { time: 75, text: "每个音符都是动力" },
    { time: 90, text: "让心情变得美好" },
    { time: 105, text: "让生活充满节奏" },
  ];
  
  // 获取当前歌词行
  const getCurrentLyric = () => {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        return lyrics[i].text;
      }
    }
    return lyrics[0].text;
  };
  
  if (!playingMusic) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.noMusicContainer}>
          <MaterialCommunityIcons
            name="music-off"
            size={80}
            color={theme.colors.secondary}
          />
          <Text style={[styles.noMusicText, { color: theme.colors.text }]}>
            没有正在播放的音乐
          </Text>
          <TouchableOpacity
            style={[styles.browseButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Music')}
          >
            <Text style={styles.browseButtonText}>浏览音乐库</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* 背景渐变 */}
      <View style={[styles.backgroundOverlay, { backgroundColor: theme.colors.primary + '20' }]} />
      
      {/* 头部控制栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons
            name="chevron-down"
            size={30}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.songTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {playingMusic.title}
          </Text>
          <Text style={[styles.artistName, { color: theme.colors.secondary }]} numberOfLines={1}>
            {playingMusic.artist}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>
      
      {/* 主要内容区域 */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* 专辑封面区域 */}
        <View style={styles.albumContainer}>
          <Animated.View
            style={[
              styles.albumWrapper,
              {
                transform: [
                  { rotate: albumRotationInterpolate },
                  { scale: albumScale },
                ],
              },
            ]}
          >
            <Image
              source={playingMusic.cover ? { uri: playingMusic.cover } : require('../../assets/default-album.png')}
              style={styles.albumArt}
            />
          </Animated.View>
          
          {/* 专辑封面阴影效果 */}
          <View style={styles.albumShadow} />
        </View>
        
        {/* 歌曲信息 */}
        <View style={styles.songInfoContainer}>
          <View style={styles.songTitleRow}>
            <Text style={[styles.fullSongTitle, { color: theme.colors.text }]}>
              {playingMusic.title}
            </Text>
            <TouchableOpacity onPress={() => console.log('添加到收藏')}>
              <MaterialCommunityIcons
                name={playingMusic.isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={playingMusic.isFavorite ? theme.colors.error : theme.colors.secondary}
              />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.fullArtistName, { color: theme.colors.secondary }]}>
            {playingMusic.artist} • {playingMusic.album || '未知专辑'}
          </Text>
          
          {/* 歌曲标签 */}
          <View style={styles.songTags}>
            {playingMusic.category && (
              <Chip
                mode="outlined"
                style={styles.songTag}
                textStyle={styles.songTagText}
              >
                {playingMusic.category}
              </Chip>
            )}
            {playingMusic.year && (
              <Chip
                mode="outlined"
                style={styles.songTag}
                textStyle={styles.songTagText}
              >
                {playingMusic.year}
              </Chip>
            )}
            {playingMusic.genre && (
              <Chip
                mode="outlined"
                style={styles.songTag}
                textStyle={styles.songTagText}
              >
                {playingMusic.genre}
              </Chip>
            )}
          </View>
        </View>
        
        {/* 进度条 */}
        <View style={styles.progressContainer}>
          <Text style={[styles.timeText, { color: theme.colors.secondary }]}>
            {formatTime(currentTime)}
          </Text>
          
          <Slider
            style={styles.progressSlider}
            value={currentTime / duration}
            onSlidingStart={handleSeekStart}
            onSlidingComplete={handleSeekComplete}
            onValueChange={handleSeekChange}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.surfaceVariant}
            thumbTintColor={theme.colors.primary}
          />
          
          <Text style={[styles.timeText, { color: theme.colors.secondary }]}>
            {formatTime(duration)}
          </Text>
        </View>
        
        {/* 歌词区域 */}
        <Animated.View
          style={[
            styles.lyricsContainer,
            {
              opacity: lyricsOpacity,
              transform: [
                { translateY: lyricsOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }) },
              ],
            },
          ]}
        >
          <Text style={[styles.currentLyric, { color: theme.colors.text }]}>
            {getCurrentLyric()}
          </Text>
          
          <Divider style={styles.lyricsDivider} />
          
          <ScrollView style={styles.lyricsScroll} showsVerticalScrollIndicator={false}>
            {lyrics.map((line, index) => (
              <Text
                key={index}
                style={[
                  styles.lyricLine,
                  { color: currentTime >= line.time ? theme.colors.primary : theme.colors.secondary },
                ]}
              >
                {line.text}
              </Text>
            ))}
          </ScrollView>
        </Animated.View>
      </ScrollView>
      
      {/* 播放控制栏 */}
      <View style={styles.controlsContainer}>
        {/* 二级控制按钮 */}
        <View style={styles.secondaryControls}>
          <TouchableOpacity onPress={toggleShuffleMode} style={styles.controlButton}>
            <MaterialCommunityIcons
              name={shuffleMode ? 'shuffle-variant' : 'shuffle'}
              size={24}
              color={shuffleMode ? theme.colors.primary : theme.colors.secondary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handlePrevious} style={styles.controlButton}>
            <MaterialCommunityIcons
              name="skip-previous"
              size={32}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          
          {/* 主要播放控制 */}
          <TouchableOpacity
            onPress={handlePlayPause}
            style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
          >
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={40}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleNext} style={styles.controlButton}>
            <MaterialCommunityIcons
              name="skip-next"
              size={32}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={toggleRepeatMode} style={styles.controlButton}>
            <MaterialCommunityIcons
              name={
                repeatMode === 'one' ? 'repeat-once' :
                repeatMode === 'all' ? 'repeat' : 'repeat-off'
              }
              size={24}
              color={repeatMode !== 'none' ? theme.colors.primary : theme.colors.secondary}
            />
          </TouchableOpacity>
        </View>
        
        {/* 三级控制按钮 */}
        <View style={styles.tertiaryControls}>
          <TouchableOpacity onPress={toggleLyrics} style={styles.smallControlButton}>
            <MaterialCommunityIcons
              name={showLyrics ? 'text-box' : 'text-box-outline'}
              size={20}
              color={showLyrics ? theme.colors.primary : theme.colors.secondary}
            />
            <Text style={[styles.smallControlText, { color: showLyrics ? theme.colors.primary : theme.colors.secondary }]}>
              歌词
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={changePlaybackRate} style={styles.smallControlButton}>
            <MaterialCommunityIcons
              name="speedometer"
              size={20}
              color={playbackRate !== 1.0 ? theme.colors.primary : theme.colors.secondary}
            />
            <Text style={[styles.smallControlText, { color: playbackRate !== 1.0 ? theme.colors.primary : theme.colors.secondary }]}>
              {playbackRate}x
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => console.log('音效设置')} style={styles.smallControlButton}>
            <MaterialCommunityIcons
              name="equalizer"
              size={20}
              color={equalizerPreset !== 'normal' ? theme.colors.primary : theme.colors.secondary}
            />
            <Text style={[styles.smallControlText, { color: equalizerPreset !== 'normal' ? theme.colors.primary : theme.colors.secondary }]}>
              音效
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => console.log('添加到播放列表')} style={styles.smallControlButton}>
            <MaterialCommunityIcons
              name="playlist-plus"
              size={20}
              color={theme.colors.secondary}
            />
            <Text style={[styles.smallControlText, { color: theme.colors.secondary }]}>
              添加
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* 音量控制 */}
        <View style={styles.volumeContainer}>
          <MaterialCommunityIcons
            name="volume-low"
            size={20}
            color={theme.colors.secondary}
          />
          <Slider
            style={styles.volumeSlider}
            value={volume}
            onValueChange={setVolume}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.surfaceVariant}
            thumbTintColor={theme.colors.primary}
          />
          <MaterialCommunityIcons
            name="volume-high"
            size={20}
            color={theme.colors.secondary}
          />
        </View>
      </View>
      
      {/* 底部安全区域 */}
      <View style={styles.bottomSafeArea} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  artistName: {
    fontSize: 14,
  },
  moreButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  albumContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  albumWrapper: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    overflow: 'hidden',
  },
  albumArt: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  albumShadow: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#000',
    opacity: 0.2,
    position: 'absolute',
    top: 10,
    zIndex: -1,
  },
  songInfoContainer: {
    marginBottom: 30,
  },
  songTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fullSongTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  fullArtistName: {
    fontSize: 16,
    marginBottom: 12,
  },
  songTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  songTag: {
    marginRight: 8,
    marginBottom: 8,
    height: 28,
  },
  songTagText: {
    fontSize: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  progressSlider: {
    flex: 1,
    marginHorizontal: 12,
  },
  timeText: {
    fontSize: 14,
    width: 50,
    textAlign: 'center',
  },
  lyricsContainer: {
    marginBottom: 30,
  },
  currentLyric: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 28,
  },
  lyricsDivider: {
    marginBottom: 16,
  },
  lyricsScroll: {
    maxHeight: 200,
  },
  lyricLine: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  controlsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  secondaryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  controlButton: {
    padding: 8,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tertiaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  smallControlButton: {
    alignItems: 'center',
  },
  smallControlText: {
    fontSize: 12,
    marginTop: 4,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 12,
  },
  bottomSafeArea: {
    height: 20,
  },
  noMusicContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noMusicText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MusicPlayerScreen;