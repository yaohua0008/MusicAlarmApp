import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  Card,
  Switch,
  Button,
  TextInput,
  RadioButton,
  Divider,
  List,
  IconButton,
  Chip,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';

import {
  setTheme,
  setLanguage,
  setVolume,
  toggleVibration,
  setSnoozeDuration,
  setFadeInDuration,
  toggleNotificationSound,
  toggleShowWeekdays,
  setTimeFormat,
  setFirstDayOfWeek,
  toggleBackupEnabled,
  setBackupFrequency,
  addCategory,
  updateCategory,
  deleteCategory,
  resetSettings,
} from '../store/slices/settingsSlice';
import {storeAlarms, storeSettings, storePlaylist, exportAllData, importData} from '../services/alarmService';

const SettingsScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const settings = useSelector(state => state.settings);
  const alarms = useSelector(state => state.alarms.alarms);
  const musicList = useSelector(state => state.music.playlist);

  // 表单状态
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#2196F3');
  const [newCategoryIcon, setNewCategoryIcon] = useState('star');
  const [importDataText, setImportDataText] = useState('');

  // 颜色预设
  const colorPresets = [
    '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', 
    '#00BCD4', '#8BC34A', '#FF5722', '#673AB7', '#795548'
  ];

  // 图标预设
  const iconPresets = [
    'briefcase', 'coffee', 'brain', 'star', 'heart',
    'bell', 'music', 'clock', 'weather-sunny', 'weather-night'
  ];

  // 备份频率选项
  const backupFrequencyOptions = [
    {label: '每天', value: 'daily'},
    {label: '每周', value: 'weekly'},
    {label: '每月', value: 'monthly'},
    {label: '从不', value: 'never'},
  ];

  // 主题选项
  const themeOptions = [
    {label: '浅色', value: 'light'},
    {label: '深色', value: 'dark'},
    {label: '跟随系统', value: 'auto'},
  ];

  // 语言选项
  const languageOptions = [
    {label: '简体中文', value: 'zh-CN'},
    {label: 'English', value: 'en-US'},
  ];

  // 时间格式选项
  const timeFormatOptions = [
    {label: '24小时制', value: '24h'},
    {label: '12小时制', value: '12h'},
  ];

  // 星期开始选项
  const weekStartOptions = [
    {label: '周日', value: 0},
    {label: '周一', value: 1},
  ];

  // 处理主题切换
  const handleThemeChange = value => {
    dispatch(setTheme(value));
  };

  // 处理语言切换
  const handleLanguageChange = value => {
    dispatch(setLanguage(value));
    // 这里可以添加语言包加载逻辑
  };

  // 处理音量变化
  const handleVolumeChange = value => {
    dispatch(setVolume(value));
  };

  // 处理时间格式切换
  const handleTimeFormatChange = value => {
    dispatch(setTimeFormat(value));
  };

  // 处理星期开始切换
  const handleWeekStartChange = value => {
    dispatch(setFirstDayOfWeek(value));
  };

  // 处理备份频率切换
  const handleBackupFrequencyChange = value => {
    dispatch(setBackupFrequency(value));
  };

  // 添加新分类
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('提示', '请输入分类名称');
      return;
    }

    const newCategory = {
      id: `custom_${Date.now()}`,
      name: newCategoryName.trim(),
      color: newCategoryColor,
      icon: newCategoryIcon,
    };

    dispatch(addCategory(newCategory));
    
    // 清空表单
    setNewCategoryName('');
    setNewCategoryColor('#2196F3');
    setNewCategoryIcon('star');

    Alert.alert('成功', '分类添加成功');
  };

  // 删除分类
  const handleDeleteCategory = categoryId => {
    if (categoryId === 'work' || categoryId === 'break' || categoryId === 'focus') {
      Alert.alert('提示', '系统默认分类不能删除');
      return;
    }

    Alert.alert(
      '确认删除',
      '确定要删除这个分类吗？此操作不可撤销。',
      [
        {text: '取消', style: 'cancel'},
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteCategory(categoryId));
            Alert.alert('成功', '分类删除成功');
          },
        },
      ],
    );
  };

  // 导出数据
  const handleExportData = async () => {
    const exportData = exportAllData();
    
    // 将数据转换为JSON字符串
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // 这里可以添加分享功能或保存到文件
    Alert.alert(
      '导出数据',
      `数据导出成功，共包含${Object.keys(exportData.data).length}个键值。\n\n你可以复制下面的JSON数据：`,
      [
        {text: '取消', style: 'cancel'},
        {text: '复制', onPress: () => {/* 实现复制逻辑 */}},
      ],
    );

    console.log('导出数据:', jsonData);
  };

  // 导入数据
  const handleImportData = async () => {
    if (!importDataText.trim()) {
      Alert.alert('提示', '请输入要导入的JSON数据');
      return;
    }

    try {
      const importData = JSON.parse(importDataText.trim());
      const result = await importData(importData);

      if (result.success) {
        Alert.alert('成功', `数据导入成功，共导入${result.importedCount}个键值。`);
        setImportDataText('');
      } else {
        Alert.alert('失败', `导入失败: ${result.error}`);
      }
    } catch (error) {
      Alert.alert('错误', 'JSON格式不正确，请检查输入的数据');
      console.error('导入数据失败:', error);
    }
  };

  // 重置设置
  const handleResetSettings = () => {
    Alert.alert(
      '确认重置',
      '确定要恢复默认设置吗？此操作将清空所有自定义设置。',
      [
        {text: '取消', style: 'cancel'},
        {
          text: '重置',
          style: 'destructive',
          onPress: () => {
            dispatch(resetSettings());
            Alert.alert('成功', '设置已恢复为默认值');
          },
        },
      ],
    );
  };

  // 手动备份数据
  const handleManualBackup = async () => {
    try {
      // 备份闹钟数据
      const alarmsSaved = storeAlarms(alarms);
      
      // 备份设置
      const settingsSaved = storeSettings(settings);
      
      // 备份音乐列表
      const playlistSaved = storePlaylist(musicList);

      if (alarmsSaved && settingsSaved && playlistSaved) {
        Alert.alert('成功', '手动备份完成');
      } else {
        Alert.alert('警告', '部分数据备份失败，请检查存储空间');
      }
    } catch (error) {
      console.error('手动备份失败:', error);
      Alert.alert('错误', '备份失败，请稍后重试');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 应用设置 */}
      <Card style={styles.sectionCard}>
        <Card.Title
          title="应用设置"
          left={props => <Icon {...props} name="application" />}
        />
        <Card.Content>
          {/* 主题设置 */}
          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>主题</Text>
            <View style={styles.optionGroup}>
              {themeOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    settings.theme === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleThemeChange(option.value)}>
                  <Text
                    style={[
                      styles.optionText,
                      settings.theme === option.value && styles.optionTextSelected,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 语言设置 */}
          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>语言</Text>
            <View style={styles.optionGroup}>
              {languageOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    settings.language === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleLanguageChange(option.value)}>
                  <Text
                    style={[
                      styles.optionText,
                      settings.language === option.value && styles.optionTextSelected,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 时间格式 */}
          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>时间格式</Text>
            <View style={styles.optionGroup}>
              {timeFormatOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    settings.timeFormat === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleTimeFormatChange(option.value)}>
                  <Text
                    style={[
                      styles.optionText,
                      settings.timeFormat === option.value && styles.optionTextSelected,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 星期开始 */}
          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>星期开始于</Text>
            <View style={styles.optionGroup}>
              {weekStartOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    settings.firstDayOfWeek === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleWeekStartChange(option.value)}>
                  <Text
                    style={[
                      styles.optionText,
                      settings.firstDayOfWeek === option.value && styles.optionTextSelected,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 闹钟设置 */}
      <Card style={styles.sectionCard}>
        <Card.Title
          title="闹钟设置"
          left={props => <Icon {...props} name="alarm" />}
        />
        <Card.Content>
          {/* 默认音量 */}
          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>
              默认音量: {Math.round(settings.volume * 100)}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={settings.volume}
              onValueChange={handleVolumeChange}
              minimumTrackTintColor="#2196F3"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#2196F3"
            />
          </View>

          {/* 振动 */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>振动</Text>
              <Text style={styles.settingDescription}>闹钟响起时振动</Text>
            </View>
            <Switch
              value={settings.vibration}
              onValueChange={() => dispatch(toggleVibration())}
            />
          </View>

          {/* 贪睡时长 */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>贪睡时长</Text>
              <Text style={styles.settingDescription}>
                {settings.snoozeDuration} 分钟
              </Text>
            </View>
            <View style={styles.durationControls}>
              <IconButton
                icon="minus"
                size={16}
                onPress={() =>
                  settings.snoozeDuration > 1 &&
                  dispatch(setSnoozeDuration(settings.snoozeDuration - 1))
                }
              />
              <Text style={styles.durationText}>{settings.snoozeDuration}</Text>
              <IconButton
                icon="plus"
                size={16}
                onPress={() =>
                  settings.snoozeDuration < 60 &&
                  dispatch(setSnoozeDuration(settings.snoozeDuration + 1))
                }
              />
            </View>
          </View>

          {/* 渐强时长 */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>渐强时长</Text>
              <Text style={styles.settingDescription}>
                {settings.fadeInDuration} 秒
              </Text>
            </View>
            <View style={styles.durationControls}>
              <IconButton
                icon="minus"
                size={16}
                onPress={() =>
                  settings.fadeInDuration > 1 &&
                  dispatch(setFadeInDuration(settings.fadeInDuration - 1))
                }
              />
              <Text style={styles.durationText}>{settings.fadeInDuration}</Text>
              <IconButton
                icon="plus"
                size={16}
                onPress={() =>
                  settings.fadeInDuration < 30 &&
                  dispatch(setFadeInDuration(settings.fadeInDuration + 1))
                }
              />
            </View>
          </View>

          {/* 显示星期 */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>显示星期几</Text>
              <Text style={styles.settingDescription}>在闹钟列表中显示星期几</Text>
            </View>
            <Switch
              value={settings.showWeekdays}
              onValueChange={() => dispatch(toggleShowWeekdays())}
            />
          </View>
        </Card.Content>
      </Card>

      {/* 分类管理 */}
      <Card style={styles.sectionCard}>
        <Card.Title
          title="分类管理"
          left={props => <Icon {...props} name="tag-multiple" />}
        />
        <Card.Content>
          {/* 现有分类 */}
          <View style={styles.categoryList}>
            {settings.alarmCategories.map(category => (
              <View key={category.id} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Icon
                    name={category.icon}
                    size={20}
                    color={category.color}
                  />
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
                {category.id !== 'work' && 
                 category.id !== 'break' && 
                 category.id !== 'focus' && (
                  <IconButton
                    icon="delete"
                    size={16}
                    onPress={() => handleDeleteCategory(category.id)}
                    iconColor="#F44336"
                  />
                )}
              </View>
            ))}
          </View>

          <Divider style={styles.divider} />

          {/* 添加新分类 */}
          <Text style={styles.subtitle}>添加新分类</Text>
          
          <TextInput
            label="分类名称"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            style={styles.input}
            mode="outlined"
          />

          <Text style={styles.colorLabel}>选择颜色</Text>
          <View style={styles.colorPalette}>
            {colorPresets.map(color => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  {backgroundColor: color},
                  newCategoryColor === color && styles.colorButtonSelected,
                ]}
                onPress={() => setNewCategoryColor(color)}
              />
            ))}
          </View>

          <Text style={styles.colorLabel}>选择图标</Text>
          <View style={styles.iconPalette}>
            {iconPresets.map(icon => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconButton,
                  newCategoryIcon === icon && styles.iconButtonSelected,
                ]}
                onPress={() => setNewCategoryIcon(icon)}>
                <Icon
                  name={icon}
                  size={24}
                  color={newCategoryIcon === icon ? '#FFFFFF' : '#757575'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Button
            mode="contained"
            onPress={handleAddCategory}
            style={styles.addCategoryButton}
            icon="plus">
            添加分类
          </Button>
        </Card.Content>
      </Card>

      {/* 数据管理 */}
      <Card style={styles.sectionCard}>
        <Card.Title
          title="数据管理"
          left={props => <Icon {...props} name="database" />}
        />
        <Card.Content>
          {/* 自动备份 */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>自动备份</Text>
              <Text style={styles.settingDescription}>
                定期备份应用数据
              </Text>
            </View>
            <Switch
              value={settings.backupEnabled}
              onValueChange={() => dispatch(toggleBackupEnabled())}
            />
          </View>

          {/* 备份频率 */}
          {settings.backupEnabled && (
            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>备份频率</Text>
              <View style={styles.optionGroup}>
                {backupFrequencyOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      settings.backupFrequency === option.value && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleBackupFrequencyChange(option.value)}>
                    <Text
                      style={[
                        styles.optionText,
                        settings.backupFrequency === option.value && styles.optionTextSelected,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 手动备份按钮 */}
          <Button
            mode="outlined"
            onPress={handleManualBackup}
            style={styles.backupButton}
            icon="backup-restore">
            立即备份
          </Button>

          {/* 导出数据 */}
          <Button
            mode="outlined"
            onPress={handleExportData}
            style={styles.exportButton}
            icon="export">
            导出数据
          </Button>

          {/* 导入数据 */}
          <View style={styles.importContainer}>
            <Text style={styles.importLabel}>导入数据 (JSON格式)</Text>
            <TextInput
              value={importDataText}
              onChangeText={setImportDataText}
              placeholder="粘贴JSON数据..."
              multiline
              numberOfLines={4}
              style={styles.importInput}
              mode="outlined"
            />
            <Button
              mode="contained"
              onPress={handleImportData}
              style={styles.importButton}
              icon="import">
              导入数据
            </Button>
          </View>

          {/* 重置设置 */}
          <Button
            mode="outlined"
            onPress={handleResetSettings}
            style={styles.resetButton}
            icon="restore"
            textColor="#F44336">
            恢复默认设置
          </Button>
        </Card.Content>
      </Card>

      {/* 关于应用 */}
      <Card style={styles.sectionCard}>
        <Card.Title
          title="关于应用"
          left={props => <Icon {...props} name="information" />}
        />
        <Card.Content>
          <View style={styles.aboutContainer}>
            <Icon name="alarm" size={48} color="#2196F3" />
            <Text style={styles.appName}>音乐闹钟</Text>
            <Text style={styles.appVersion}>版本 1.0.0</Text>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>闹钟总数</Text>
              <Text style={styles.statValue}>{alarms.length}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>音乐数量</Text>
              <Text style={styles.statValue}>{musicList.length}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>分类数量</Text>
              <Text style={styles.statValue}>{settings.alarmCategories.length}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
  },
  settingGroup: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 12,
    color: '#757575',
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 12,
    color: '#757575',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  slider: {
    width: '100%',
    height: 40,
  },
  durationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    minWidth: 24,
    textAlign: 'center',
  },
  categoryList: {
    gap: 8,
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryName: {
    fontSize: 14,
    color: '#333333',
  },
  divider: {
    marginVertical: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  input: {
    marginBottom: 16,
  },
  colorLabel: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
    fontWeight: '500',
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  colorButtonSelected: {
    borderColor: '#333333',
    transform: [{scale: 1.1}],
  },
  iconPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iconButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  addCategoryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
  },
  backupButton: {
    marginTop: 8,
    borderColor: '#2196F3',
  },
  exportButton: {
    marginTop: 8,
    borderColor: '#FF9800',
  },
  importContainer: {
    marginTop: 16,
  },
  importLabel: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
    fontWeight: '500',
  },
  importInput: {
    marginBottom: 12,
  },
  importButton: {
    backgroundColor: '#9C27B0',
    borderRadius: 12,
  },
  resetButton: {
    marginTop: 16,
    borderColor: '#F44336',
  },
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 12,
  },
  appVersion: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
  },
  statValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: 'bold',
  },
});

export default SettingsScreen;