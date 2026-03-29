import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  TextInput,
  Button,
  Card,
  Switch,
  Chip,
  IconButton,
  Divider,
  Portal,
  Modal,
  RadioButton,
  List,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {addAlarm, updateAlarm} from '../store/slices/alarmSlice';
import {formatTime} from '../utils/timeUtils';
import SleepAnalysisSettings from '../components/SleepAnalysisSettings';

const AlarmDetailScreen = ({route, navigation}) => {
  const dispatch = useDispatch();
  const {alarmId} = route.params || {};
  const alarms = useSelector(state => state.alarms.alarms);
  const categories = useSelector(state => state.settings.alarmCategories);
  const musicList = useSelector(state => state.music.playlist);

  // 获取现有闹钟或创建新闹钟
  const existingAlarm = alarmId
    ? alarms.find(alarm => alarm.id === alarmId)
    : null;

  // 表单状态
  const [time, setTime] = useState(
    existingAlarm ? new Date(existingAlarm.time) : new Date(),
  );
  const [label, setLabel] = useState(existingAlarm?.label || '');
  const [category, setCategory] = useState(existingAlarm?.category || 'work');
  const [repeatDays, setRepeatDays] = useState(
    existingAlarm?.repeatDays || [1, 2, 3, 4, 5],
  ); // 默认工作日
  const [musicId, setMusicId] = useState(existingAlarm?.music?.id || null);
  const [vibration, setVibration] = useState(existingAlarm?.vibration ?? true);
  const [snooze, setSnooze] = useState(existingAlarm?.snooze ?? true);
  const [snoozeDuration, setSnoozeDuration] = useState(
    existingAlarm?.snoozeDuration || 5,
  );
  const [fadeIn, setFadeIn] = useState(existingAlarm?.fadeIn ?? true);
  const [fadeInDuration, setFadeInDuration] = useState(
    existingAlarm?.fadeInDuration || 10,
  );
  const [volume, setVolume] = useState(existingAlarm?.volume || 0.8);
  
  // 睡眠分析设置
  const [sleepSettings, setSleepSettings] = useState({
    sleepGoal: existingAlarm?.sleepSettings?.sleepGoal || 8,
    smartWakeupEnabled: existingAlarm?.sleepSettings?.smartWakeupEnabled || false,
    whiteNoiseEnabled: existingAlarm?.sleepSettings?.whiteNoiseEnabled || false,
    whiteNoiseVolume: existingAlarm?.sleepSettings?.whiteNoiseVolume || 0.5,
    selectedWhiteNoise: existingAlarm?.sleepSettings?.selectedWhiteNoise || 'rain',
  });

  // 模态框状态
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);

  // 星期几选项
  const weekdays = [
    {id: 0, name: '周日', short: '日'},
    {id: 1, name: '周一', short: '一'},
    {id: 2, name: '周二', short: '二'},
    {id: 3, name: '周三', short: '三'},
    {id: 4, name: '周四', short: '四'},
    {id: 5, name: '周五', short: '五'},
    {id: 6, name: '周六', short: '六'},
  ];

  // 预设重复模式
  const repeatPresets = [
    {id: 'once', name: '仅一次', days: []},
    {id: 'daily', name: '每天', days: [0, 1, 2, 3, 4, 5, 6]},
    {id: 'weekdays', name: '工作日', days: [1, 2, 3, 4, 5]},
    {id: 'weekends', name: '周末', days: [0, 6]},
    {id: 'custom', name: '自定义', days: repeatDays},
  ];

  // 获取选中的音乐
  const selectedMusic = musicId
    ? musicList.find(music => music.id === musicId)
    : null;

  // 获取选中的分类
  const selectedCategory = categories.find(cat => cat.id === category);

  // 处理时间选择
  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  // 处理重复天数选择
  const toggleRepeatDay = dayId => {
    if (repeatDays.includes(dayId)) {
      setRepeatDays(repeatDays.filter(day => day !== dayId));
    } else {
      setRepeatDays([...repeatDays, dayId]);
    }
  };

  // 应用预设重复模式
  const applyRepeatPreset = presetId => {
    const preset = repeatPresets.find(p => p.id === presetId);
    if (preset) {
      setRepeatDays(preset.days);
    }
  };

  // 处理睡眠设置变化
  const handleSleepSettingsChange = (settings) => {
    setSleepSettings(settings);
  };

  // 保存闹钟
  const handleSave = () => {
    const alarmData = {
      time: time.toISOString(),
      label,
      category,
      repeatDays,
      music: selectedMusic,
      vibration,
      snooze,
      snoozeDuration,
      fadeIn,
      fadeInDuration,
      volume,
      isActive: true,
      sleepSettings: sleepSettings, // 添加睡眠分析设置
    };

    if (alarmId) {
      // 更新现有闹钟
      dispatch(updateAlarm({id: alarmId, updates: alarmData}));
    } else {
      // 创建新闹钟
      dispatch(addAlarm(alarmData));
    }

    navigation.goBack();
  };

  // 删除闹钟
  const handleDelete = () => {
    // 这里需要实现删除逻辑
    navigation.goBack();
  };

  // 渲染重复天数选择器
  const renderRepeatDaysSelector = () => (
    <View style={styles.repeatDaysContainer}>
      {weekdays.map(day => {
        const isSelected = repeatDays.includes(day.id);
        return (
          <TouchableOpacity
            key={day.id}
            style={[
              styles.weekdayButton,
              isSelected && styles.weekdayButtonSelected,
            ]}
            onPress={() => toggleRepeatDay(day.id)}>
            <Text
              style={[
                styles.weekdayText,
                isSelected && styles.weekdayTextSelected,
              ]}>
              {day.short}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // 渲染预设按钮
  const renderPresetButtons = () => (
    <View style={styles.presetContainer}>
      {repeatPresets.map(preset => {
        const isActive =
          preset.id === 'custom'
            ? false
            : preset.days.length === repeatDays.length &&
              preset.days.every(day => repeatDays.includes(day));
        
        return (
          <TouchableOpacity
            key={preset.id}
            style={[
              styles.presetButton,
              isActive && styles.presetButtonActive,
            ]}
            onPress={() => applyRepeatPreset(preset.id)}>
            <Text
              style={[
                styles.presetText,
                isActive && styles.presetTextActive,
              ]}>
              {preset.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 头部信息 */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowTimePicker(true)}>
                <Text style={styles.timeDisplay}>
                  {formatTime(time, 'HH:mm')}
                </Text>
                <Icon name="clock-edit-outline" size={24} color="#2196F3" />
              </TouchableOpacity>
              <Text style={styles.headerSubtitle}>
                {existingAlarm ? '编辑闹钟' : '新建闹钟'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* 基本信息 */}
        <Card style={styles.sectionCard}>
          <Card.Title title="基本信息" left={props => <Icon {...props} name="information" />} />
          <Card.Content>
            <TextInput
              label="闹钟标签"
              value={label}
              onChangeText={setLabel}
              placeholder="例如：上班提醒、午休提醒"
              style={styles.input}
              mode="outlined"
            />
            
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategoryModal(true)}>
              <View style={styles.selectorLeft}>
                <Icon name={selectedCategory?.icon || 'tag'} size={20} color={selectedCategory?.color || '#757575'} />
                <Text style={styles.selectorText}>
                  {selectedCategory?.name || '选择分类'}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#BDBDBD" />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* 重复设置 */}
        <Card style={styles.sectionCard}>
          <Card.Title title="重复设置" left={props => <Icon {...props} name="repeat" />} />
          <Card.Content>
            {renderPresetButtons()}
            <Divider style={styles.divider} />
            {renderRepeatDaysSelector()}
          </Card.Content>
        </Card>

        {/* 音乐设置 */}
        <Card style={styles.sectionCard}>
          <Card.Title title="音乐设置" left={props => <Icon {...props} name="music" />} />
          <Card.Content>
            <TouchableOpacity
              style={styles.musicSelector}
              onPress={() => setShowMusicModal(true)}>
              <View style={styles.selectorLeft}>
                <Icon name="music-note" size={20} color="#2196F3" />
                <Text style={styles.selectorText}>
                  {selectedMusic ? selectedMusic.title : '选择音乐'}
                </Text>
                {selectedMusic && (
                  <Text style={styles.musicSubtitle}>
                    {selectedMusic.artist || '未知艺术家'}
                  </Text>
                )}
              </View>
              <Icon name="chevron-right" size={20} color="#BDBDBD" />
            </TouchableOpacity>
            
            <View style={styles.volumeContainer}>
              <Text style={styles.volumeLabel}>音量: {Math.round(volume * 100)}%</Text>
              <View style={styles.volumeSlider}>
                <Icon name="volume-low" size={20} color="#757575" />
                <View style={styles.sliderTrack}>
                  <View 
                    style={[styles.sliderFill, {width: `${volume * 100}%`}]} 
                  />
                  <TouchableOpacity
                    style={[styles.sliderThumb, {left: `${volume * 100}%`}]}
                    onPressIn={() => {/* 实现滑动逻辑 */}}
                  />
                </View>
                <Icon name="volume-high" size={20} color="#757575" />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 高级设置 */}
        <Card style={styles.sectionCard}>
          <Card.Title title="高级设置" left={props => <Icon {...props} name="cog" />} />
          <Card.Content>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>振动</Text>
                <Text style={styles.settingDescription}>闹钟响起时振动</Text>
              </View>
              <Switch value={vibration} onValueChange={setVibration} />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>贪睡功能</Text>
                <Text style={styles.settingDescription}>
                  延迟 {snoozeDuration} 分钟后再次提醒
                </Text>
              </View>
              <Switch value={snooze} onValueChange={setSnooze} />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>渐强音量</Text>
                <Text style={styles.settingDescription}>
                  {fadeInDuration} 秒内音量逐渐增大
                </Text>
              </View>
              <Switch value={fadeIn} onValueChange={setFadeIn} />
            </View>
          </Card.Content>
        </Card>

        {/* 睡眠分析设置 */}
        <Card style={styles.sectionCard}>
          <Card.Title title="睡眠分析" left={props => <Icon {...props} name="bed" />} />
          <Card.Content>
            <SleepAnalysisSettings
              alarmData={existingAlarm}
              onSleepSettingsChange={handleSleepSettingsChange}
            />
          </Card.Content>
        </Card>

        {/* 操作按钮 */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            icon="check">
            {existingAlarm ? '更新闹钟' : '创建闹钟'}
          </Button>
          
          {existingAlarm && (
            <Button
              mode="outlined"
              onPress={handleDelete}
              style={styles.deleteButton}
              textColor="#F44336"
              icon="delete">
              删除闹钟
            </Button>
          )}
        </View>
      </ScrollView>

      {/* 时间选择器模态框 */}
      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {/* 分类选择模态框 */}
      <Portal>
        <Modal
          visible={showCategoryModal}
          onDismiss={() => setShowCategoryModal(false)}
          contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>选择分类</Text>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.modalItem,
                category === cat.id && styles.modalItemSelected,
              ]}
              onPress={() => {
                setCategory(cat.id);
                setShowCategoryModal(false);
              }}>
              <Icon name={cat.icon} size={24} color={cat.color} />
              <Text style={styles.modalItemText}>{cat.name}</Text>
              {category === cat.id && (
                <Icon name="check" size={20} color={cat.color} />
              )}
            </TouchableOpacity>
          ))}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    marginBottom: 16,
    backgroundColor: '#2196F3',
  },
  headerContent: {
    alignItems: 'center',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  timeDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    marginTop: 4,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  musicSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  selectorLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectorText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  musicSubtitle: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 8,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  presetButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  presetText: {
    fontSize: 12,
    color: '#757575',
  },
  presetTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  repeatDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekdayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  weekdayButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  weekdayText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: 'bold',
  },
  weekdayTextSelected: {
    color: '#FFFFFF',
  },
  volumeContainer: {
    marginTop: 8,
  },
  volumeLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  volumeSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2196F3',
    top: -8,
    marginLeft: -10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#757575',
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 8,
  },
  deleteButton: {
    borderColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 8,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    margin: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 12,
  },
  modalItemSelected: {
    backgroundColor: '#F5F5F5',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
});

export default AlarmDetailScreen;