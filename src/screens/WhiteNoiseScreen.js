import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { startWhiteNoise, stopWhiteNoise, getWhiteNoiseList } from '../services/whiteNoiseService';

const WhiteNoiseScreen = () => {
  const dispatch = useDispatch();
  
  // 从Redux获取白噪音设置
  const whiteNoiseSettings = useSelector(state => state.whiteNoise?.settings || {});
  const whiteNoiseEnabled = whiteNoiseSettings.enabled || false;
  const selectedNoise = whiteNoiseSettings.selectedNoise || 'rain';
  const volume = whiteNoiseSettings.volume || 0.5;
  
  // 本地状态
  const [whiteNoises, setWhiteNoises] = useState([]);
  const [playingNoise, setPlayingNoise] = useState(whiteNoiseEnabled ? selectedNoise : null);
  const [selected, setSelected] = useState(selectedNoise);

  // 加载白噪音列表
  useEffect(() => {
    loadWhiteNoises();
  }, []);

  const loadWhiteNoises = async () => {
    try {
      const noises = await getWhiteNoiseList();
      setWhiteNoises(noises);
    } catch (error) {
      console.error('加载白噪音列表失败:', error);
    }
  };

  // 选择白噪音
  const handleSelectNoise = async (noiseId) => {
    try {
      setSelected(noiseId);
      
      // 如果当前有白噪音在播放，先停止
      if (playingNoise) {
        await stopWhiteNoise();
        setPlayingNoise(null);
      }
      
      // 播放选中的白噪音
      await startWhiteNoise(noiseId, volume);
      setPlayingNoise(noiseId);
      
      Alert.alert('已选择', `正在播放${whiteNoises.find(n => n.id === noiseId)?.name || '白噪音'}`);
    } catch (error) {
      Alert.alert('错误', '播放白噪音失败: ' + error.message);
    }
  };

  // 停止播放
  const handleStopPlaying = async () => {
    try {
      await stopWhiteNoise();
      setPlayingNoise(null);
    } catch (error) {
      Alert.alert('错误', '停止白噪音失败: ' + error.message);
    }
  };

  // 白噪音图标映射
  const getNoiseIcon = (noiseId) => {
    const iconMap = {
      'rain': 'water-drop',
      'thunder': 'flash-on',
      'wind': 'air',
      'waves': 'waves',
      'forest': 'park',
      'birds': 'emoji-nature',
      'fireplace': 'whatshot',
      'fan': 'toys',
      'white': 'filter-drama',
      'pink': 'color-lens',
    };
    return iconMap[noiseId] || 'music-note';
  };

  // 白噪音颜色映射
  const getNoiseColor = (noiseId) => {
    const colorMap = {
      'rain': '#2196F3', // 蓝色
      'thunder': '#9C27B0', // 紫色
      'wind': '#4CAF50', // 绿色
      'waves': '#03A9F4', // 浅蓝色
      'forest': '#8BC34A', // 浅绿色
      'birds': '#FF9800', // 橙色
      'fireplace': '#F44336', // 红色
      'fan': '#607D8B', // 蓝灰色
      'white': '#E0E0E0', // 浅灰色
      'pink': '#E91E63', // 粉色
    };
    return colorMap[noiseId] || '#9E9E9E';
  };

  // 白噪音描述
  const getNoiseDescription = (noiseId) => {
    const descriptionMap = {
      'rain': '轻柔的雨声，适合放松和专注',
      'thunder': '带有雷声的雨声，适合深度放松',
      'wind': '风声，帮助掩盖环境噪音',
      'waves': '海浪声，带来度假般的放松感',
      'forest': '森林环境音，鸟鸣和树叶声',
      'birds': '清晨鸟鸣，带来自然活力',
      'fireplace': '壁炉噼啪声，创造温暖氛围',
      'fan': '风扇声，经典的白噪音选择',
      'white': '标准白噪音，均匀频率分布',
      'pink': '粉红噪音，更柔和自然的声波',
    };
    return descriptionMap[noiseId] || '帮助放松和专注的白噪音';
  };

  return (
    <ScrollView style={styles.container}>
      {/* 头部信息 */}
      <View style={styles.header}>
        <Text style={styles.title}>白噪音选择</Text>
        <Text style={styles.subtitle}>
          选择一种白噪音帮助您放松、专注或入睡
        </Text>
      </View>

      {/* 播放控制 */}
      {playingNoise && (
        <View style={styles.playingCard}>
          <View style={styles.playingHeader}>
            <Icon 
              name={getNoiseIcon(playingNoise)} 
              size={24} 
              color={getNoiseColor(playingNoise)} 
            />
            <Text style={styles.playingTitle}>
              正在播放: {whiteNoises.find(n => n.id === playingNoise)?.name || '白噪音'}
            </Text>
          </View>
          <Text style={styles.playingDescription}>
            {getNoiseDescription(playingNoise)}
          </Text>
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={handleStopPlaying}
          >
            <Icon name="stop-circle" size={24} color="#FF6B6B" />
            <Text style={styles.stopButtonText}>停止播放</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 白噪音列表 */}
      <View style={styles.noiseGrid}>
        {whiteNoises.map((noise) => (
          <TouchableOpacity
            key={noise.id}
            style={[
              styles.noiseCard,
              selected === noise.id && styles.noiseCardSelected,
              playingNoise === noise.id && styles.noiseCardPlaying,
            ]}
            onPress={() => handleSelectNoise(noise.id)}
          >
            <View style={[
              styles.noiseIconContainer,
              { backgroundColor: getNoiseColor(noise.id) + '20' }
            ]}>
              <Icon 
                name={getNoiseIcon(noise.id)} 
                size={32} 
                color={getNoiseColor(noise.id)} 
              />
            </View>
            
            <Text style={styles.noiseName}>{noise.name}</Text>
            <Text style={styles.noiseDuration}>{noise.duration}</Text>
            
            {playingNoise === noise.id && (
              <View style={styles.playingIndicator}>
                <Icon name="volume-up" size={12} color="#4CAF50" />
                <View style={styles.playingDot} />
              </View>
            )}
            
            {selected === noise.id && playingNoise !== noise.id && (
              <View style={styles.selectedIndicator}>
                <Icon name="check-circle" size={16} color="#4CAF50" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* 使用建议 */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>🎧 使用建议</Text>
        
        <View style={styles.tipItem}>
          <Icon name="bedtime" size={20} color="#5D3FD3" />
          <View style={styles.tipContent}>
            <Text style={tipItem.tipTitle}>助眠</Text>
            <Text style={tipItem.tipText}>
              推荐：雨声、海浪声、森林声、粉红噪音
            </Text>
          </View>
        </View>
        
        <View style={styles.tipItem}>
          <Icon name="school" size={20} color="#5D3FD3" />
          <View style={styles.tipContent}>
            <Text style={tipItem.tipTitle}>专注学习</Text>
            <Text style={tipItem.tipText}>
              推荐：白噪音、风扇声、咖啡馆环境音
            </Text>
          </View>
        </View>
        
        <View style={styles.tipItem}>
          <Icon name="self-improvement" size={20} color="#5D3FD3" />
          <View style={styles.tipContent}>
            <Text style={tipItem.tipTitle}>冥想放松</Text>
            <Text style={tipItem.tipText}>
              推荐：鸟鸣声、风声、轻柔雨声
            </Text>
          </View>
        </View>
        
        <View style={styles.tipItem}>
          <Icon name="volume-off" size={20} color="#5D3FD3" />
          <View style={styles.tipContent}>
            <Text style={tipItem.tipTitle}>噪音掩盖</Text>
            <Text style={tipItem.tipText}>
              推荐：白噪音、粉红噪音、风扇声
            </Text>
          </View>
        </View>
      </View>

      {/* 科学原理 */}
      <View style={styles.scienceSection}>
        <Text style={styles.scienceTitle}>🔬 白噪音的科学原理</Text>
        <Text style={styles.scienceText}>
          白噪音通过提供均匀的频率分布，可以帮助：
        </Text>
        <View style={styles.benefitList}>
          <View style={styles.benefitItem}>
            <Icon name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.benefitText}>掩盖环境噪音，减少干扰</Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.benefitText}>促进放松，降低压力水平</Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.benefitText}>改善睡眠质量，减少夜间觉醒</Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.benefitText}>提高专注力，增强工作效率</Text>
          </View>
        </View>
      </View>

      {/* 音量提示 */}
      <View style={styles.volumeTip}>
        <Icon name="info" size={16} color="#FF9800" />
        <Text style={styles.volumeTipText}>
          提示：建议将音量调整到舒适水平，不要过高以免损伤听力
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  playingCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  playingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  stopButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    justifyContent: 'space-between',
  },
  noiseCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  noiseCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F5FFF5',
  },
  noiseCardPlaying: {
    borderColor: '#2196F3',
    backgroundColor: '#F5F9FF',
  },
  noiseIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  noiseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  noiseDuration: {
    fontSize: 12,
    color: '#666',
  },
  playingIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  tipsSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  scienceSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  scienceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  scienceText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  benefitList: {
    marginTop: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  volumeTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  volumeTipText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
});

// 内联样式对象
const tipItem = StyleSheet.create({
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default WhiteNoiseScreen;