import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Card, Button, IconButton} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {toggleAlarm} from '../store/slices/alarmSlice';
import {togglePlay} from '../store/slices/musicSlice';

const HomeScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const alarms = useSelector(state => state.alarms.alarms);
  const currentTrack = useSelector(state => state.music.currentTrack);
  const isPlaying = useSelector(state => state.music.isPlaying);

  const activeAlarms = alarms.filter(alarm => alarm.isActive);
  const nextAlarm = activeAlarms.length > 0 
    ? activeAlarms.sort((a, b) => new Date(a.time) - new Date(b.time))[0]
    : null;

  const handleToggleAlarm = alarmId => {
    dispatch(toggleAlarm(alarmId));
  };

  const handleTogglePlay = () => {
    dispatch(togglePlay());
  };

  const handleAddAlarm = () => {
    navigation.navigate('AlarmDetail', {alarmId: null});
  };

  const handlePlayMusic = () => {
    navigation.navigate('MusicPlayer');
  };

  return (
    <ScrollView style={styles.container}>
      {/* 欢迎区域 */}
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Text style={styles.welcomeTitle}>音乐闹钟</Text>
          <Text style={styles.welcomeSubtitle}>
            让音乐唤醒你的每一天
          </Text>
        </Card.Content>
      </Card>

      {/* 睡眠分析入口 */}
      <Card style={styles.sectionCard}>
        <Card.Title
          title="睡眠分析"
          left={props => <Icon {...props} name="bed" size={24} color="#5D3FD3" />}
        />
        <Card.Content>
          <View style={styles.sleepAnalysisContainer}>
            <View style={styles.sleepAnalysisInfo}>
              <Text style={styles.sleepAnalysisTitle}>智能睡眠跟踪</Text>
              <Text style={styles.sleepAnalysisDescription}>
                监测睡眠质量，智能唤醒，白噪音助眠
              </Text>
            </View>
            <View style={styles.sleepAnalysisActions}>
              <TouchableOpacity 
                style={styles.sleepAnalysisButton}
                onPress={() => navigation.navigate('SleepAnalysis')}
              >
                <Icon name="trending-up" size={20} color="#FFFFFF" />
                <Text style={styles.sleepAnalysisButtonText}>查看分析</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.sleepTips}>
            <Icon name="lightbulb" size={16} color="#FF9800" />
            <Text style={styles.sleepTipText}>
              建议每天睡 {8} 小时，保持规律作息
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* 下一个闹钟 */}
      <Card style={styles.sectionCard}>
        <Card.Title
          title="下一个闹钟"
          left={props => <Icon {...props} name="alarm" size={24} />}
        />
        <Card.Content>
          {nextAlarm ? (
            <View style={styles.alarmInfo}>
              <View style={styles.alarmTimeContainer}>
                <Text style={styles.alarmTime}>
                  {new Date(nextAlarm.time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <TouchableOpacity
                  onPress={() => handleToggleAlarm(nextAlarm.id)}>
                  <Icon
                    name={nextAlarm.isActive ? 'toggle-switch' : 'toggle-switch-off'}
                    size={32}
                    color={nextAlarm.isActive ? '#4CAF50' : '#757575'}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.alarmLabel}>
                标签：{nextAlarm.label || '闹钟'}
              </Text>
              {nextAlarm.music && (
                <Text style={styles.alarmMusic}>
                  音乐：{nextAlarm.music.name}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.noAlarmContainer}>
              <Icon name="alarm-off" size={48} color="#BDBDBD" />
              <Text style={styles.noAlarmText}>没有激活的闹钟</Text>
              <Button
                mode="contained"
                onPress={handleAddAlarm}
                style={styles.addButton}>
                添加闹钟
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 音乐播放控制 */}
      <Card style={styles.sectionCard}>
        <Card.Title
          title="当前音乐"
          left={props => <Icon {...props} name="music" size={24} />}
        />
        <Card.Content>
          {currentTrack ? (
            <View style={styles.musicControlContainer}>
              <View style={styles.musicInfo}>
                <Text style={styles.musicTitle} numberOfLines={1}>
                  {currentTrack.title}
                </Text>
                <Text style={styles.musicArtist} numberOfLines={1}>
                  {currentTrack.artist || '未知艺术家'}
                </Text>
              </View>
              <View style={styles.musicControls}>
                <IconButton
                  icon="skip-previous"
                  size={30}
                  onPress={() => dispatch(previousTrack())}
                />
                <IconButton
                  icon={isPlaying ? 'pause-circle' : 'play-circle'}
                  size={40}
                  onPress={handleTogglePlay}
                />
                <IconButton
                  icon="skip-next"
                  size={30}
                  onPress={() => dispatch(nextTrack())}
                />
              </View>
              <Button
                mode="outlined"
                onPress={handlePlayMusic}
                style={styles.viewPlayerButton}>
                查看播放器
              </Button>
            </View>
          ) : (
            <View style={styles.noMusicContainer}>
              <Icon name="music-note-off" size={48} color="#BDBDBD" />
              <Text style={styles.noMusicText}>没有正在播放的音乐</Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Music')}
                style={styles.browseButton}>
                浏览音乐
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 快速操作 */}
      <View style={styles.quickActionsContainer}>
        <Button
          mode="contained"
          icon="alarm-plus"
          onPress={handleAddAlarm}
          style={styles.quickActionButton}>
          添加闹钟
        </Button>
        <Button
          mode="contained"
          icon="music"
          onPress={() => navigation.navigate('Music')}
          style={styles.quickActionButton}>
          选择音乐
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  welcomeCard: {
    margin: 16,
    backgroundColor: '#2196F3',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  alarmInfo: {
    paddingVertical: 8,
  },
  alarmTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alarmTime: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333333',
  },
  alarmLabel: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 4,
  },
  alarmMusic: {
    fontSize: 14,
    color: '#2196F3',
  },
  noAlarmContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noAlarmText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 12,
    marginBottom: 16,
  },
  addButton: {
    marginTop: 8,
  },
  musicControlContainer: {
    paddingVertical: 8,
  },
  musicInfo: {
    marginBottom: 16,
  },
  musicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  musicArtist: {
    fontSize: 14,
    color: '#757575',
  },
  musicControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewPlayerButton: {
    marginTop: 8,
  },
  noMusicContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noMusicText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 12,
    marginBottom: 16,
  },
  browseButton: {
    marginTop: 8,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 16,
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  sleepAnalysisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sleepAnalysisInfo: {
    flex: 1,
  },
  sleepAnalysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  sleepAnalysisDescription: {
    fontSize: 12,
    color: '#757575',
  },
  sleepAnalysisActions: {
    marginLeft: 12,
  },
  sleepAnalysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  sleepAnalysisButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sleepTips: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    gap: 8,
  },
  sleepTipText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
});

export default HomeScreen;