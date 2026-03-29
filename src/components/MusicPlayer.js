/**
 * 音乐播放器组件
 * 显示当前播放的音乐信息和控制按钮
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Slider,
  Platform,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { setMusicPlayerState } from '../store/slices/musicSlice';
import { controlMusicPlayer, getPlayerState } from '../services/musicService';

const { width } = Dimensions.get('window');

const MusicPlayer = ({ onOpenPlayer }) => {
  const dispatch = useDispatch();
  const musicPlayer = useSelector(state => state.music.musicPlayer);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 更新播放器状态
  const updatePlayerState = async () => {
    try {
      const state = await getPlayerState();
      if (state) {
        setIsPlaying(state.isPlaying);
        setCurrentTime(state.position);
        setDuration(state.duration);
        
        dispatch(setMusicPlayerState({
          isPlaying: state.isPlaying,
          currentTime: state.position,
          duration: state.duration,
          currentTrack: state.trackObject,
        }));
      }
    } catch (error) {
      console.error('更新播放器状态失败:', error);
    }
  };

  // 定期更新播放进度
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        setCurrentTime(prev => prev + 1);
        updatePlayerState();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // 初始加载状态
  useEffect(() => {
    updatePlayerState();
  }, []);

  // 播放/暂停控制
  const handlePlayPause = async () => {
    try {
      setIsLoading(true);
      if (isPlaying) {
        await controlMusicPlayer.pause();
      } else {
        await controlMusicPlayer.play();
      }
      await updatePlayerState();
    } catch (error) {
      console.error('播放/暂停失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 下一首
  const handleNext = async () => {
    try {
      setIsLoading(true);
      await controlMusicPlayer.skipToNext();
      await updatePlayerState();
    } catch (error) {
      console.error('下一首失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 上一首
  const handlePrevious = async () => {
    try {
      setIsLoading(true);
      await controlMusicPlayer.skipToPrevious();
      await updatePlayerState();
    } catch (error) {
      console.error('上一首失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 跳转到指定时间
  const handleSeek = async (value) => {
    try {
      setCurrentTime(value);
      await controlMusicPlayer.seekTo(value);
    } catch (error) {
      console.error('跳转失败:', error);
    }
  };

  // 格式化时间显示
  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 如果没有当前播放的音乐，显示占位符
  if (!musicPlayer.currentTrack) {
    return (
      <TouchableOpacity
        style={[styles.container, styles.emptyContainer]}
        onPress={onOpenPlayer}
        activeOpacity={0.8}
      >
        <View style={styles.emptyContent}>
          <Icon name="music" size={24} color="#9B9B9B" />
          <Text style={styles.emptyText}>暂无播放的音乐</Text>
          <TouchableOpacity style={styles.browseButton}>
            <Text style={styles.browseButtonText}>浏览音乐</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  const { currentTrack } = musicPlayer;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onOpenPlayer}
      activeOpacity={0.9}
    >
      {/* 专辑封面 */}
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: currentTrack.artwork || 'https://via.placeholder.com/60' }}
          style={styles.coverImage}
          defaultSource={require('../assets/default-cover.png')}
        />
        <View style={styles.coverOverlay}>
          {isPlaying && (
            <View style={styles.playingIndicator}>
              <View style={[styles.soundWave, styles.wave1]} />
              <View style={[styles.soundWave, styles.wave2]} />
              <View style={[styles.soundWave, styles.wave3]} />
            </View>
          )}
        </View>
      </View>

      {/* 音乐信息 */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {currentTrack.title || '未知歌曲'}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {currentTrack.artist || '未知艺术家'}
        </Text>
        
        {/* 进度条 */}
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={currentTime}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor="#4A90E2"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#4A90E2"
            disabled={isLoading}
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* 控制按钮 */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, styles.smallButton]}
          onPress={handlePrevious}
          disabled={isLoading}
        >
          <Icon name="skip-previous" size={28} color="#4A90E2" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.playButton]}
          onPress={handlePlayPause}
          disabled={isLoading}
        >
          <Icon
            name={isPlaying ? 'pause' : 'play'}
            size={32}
            color="#FFFFFF"
          />
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <Icon name="loading" size={24} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.smallButton]}
          onPress={handleNext}
          disabled={isLoading}
        >
          <Icon name="skip-next" size={28} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* 播放状态指示器 */}
      <View style={styles.statusIndicator}>
        <View style={[styles.statusDot, isPlaying && styles.statusDotActive]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    minHeight: 120,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#9B9B9B',
    marginTop: 8,
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  coverContainer: {
    position: 'relative',
    marginRight: 16,
  },
  coverImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.3)',
    borderRadius: 12,
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundWave: {
    width: 3,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 1,
  },
  wave1: {
    height: 8,
    animation: 'wave1 1s infinite',
  },
  wave2: {
    height: 12,
    animation: 'wave2 1s infinite',
  },
  wave3: {
    height: 8,
    animation: 'wave3 1s infinite',
  },
  infoContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#999999',
    minWidth: 40,
  },
  slider: {
    flex: 1,
    height: 30,
    marginHorizontal: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallButton: {
    width: 40,
    height: 40,
  },
  playButton: {
    width: 56,
    height: 56,
    backgroundColor: '#4A90E2',
    borderRadius: 28,
    marginHorizontal: 8,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.8)',
    borderRadius: 28,
  },
  statusIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  statusDotActive: {
    backgroundColor: '#4A90E2',
  },
});

// 添加动画样式
const animationStyles = StyleSheet.create({
  '@keyframes wave1': {
    '0%, 100%': { height: 8 },
    '50%': { height: 16 },
  },
  '@keyframes wave2': {
    '0%, 100%': { height: 12 },
    '50%': { height: 20 },
  },
  '@keyframes wave3': {
    '0%, 100%': { height: 8 },
    '50%': { height: 16 },
  },
});

export default MusicPlayer;