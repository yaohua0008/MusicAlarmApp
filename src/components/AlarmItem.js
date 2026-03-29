import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useDispatch} from 'react-redux';
import {Card, Switch, IconButton} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {toggleAlarm, deleteAlarm} from '../store/slices/alarmSlice';
import {formatTime, parseRepeatRule} from '../utils/timeUtils';

const AlarmItem = ({alarm, onEdit, onDelete, style}) => {
  const dispatch = useDispatch();

  const handleToggle = () => {
    dispatch(toggleAlarm(alarm.id));
  };

  const handleDelete = () => {
    dispatch(deleteAlarm(alarm.id));
    if (onDelete) onDelete(alarm.id);
  };

  const getCategoryIcon = categoryId => {
    const icons = {
      work: 'briefcase',
      break: 'coffee',
      focus: 'brain',
      custom: 'star',
    };
    return icons[categoryId] || 'alarm';
  };

  const getCategoryColor = categoryId => {
    const colors = {
      work: '#2196F3',
      break: '#4CAF50',
      focus: '#FF9800',
      custom: '#9C27B0',
    };
    return colors[categoryId] || '#757575';
  };

  return (
    <Card style={[styles.container, style]}>
      <Card.Content style={styles.content}>
        {/* 左侧：时间和基本信息 */}
        <View style={styles.leftSection}>
          <View style={styles.timeContainer}>
            <Text style={styles.time}>
              {formatTime(alarm.time, 'HH:mm')}
            </Text>
            {alarm.label && (
              <Text style={styles.label} numberOfLines={1}>
                {alarm.label}
              </Text>
            )}
          </View>
          
          <View style={styles.detailsContainer}>
            {/* 重复规则 */}
            <View style={styles.detailRow}>
              <Icon name="repeat" size={14} color="#757575" />
              <Text style={styles.detailText}>
                {parseRepeatRule(alarm.repeatDays)}
              </Text>
            </View>
            
            {/* 分类标签 */}
            {alarm.category && (
              <View style={styles.detailRow}>
                <Icon 
                  name={getCategoryIcon(alarm.category)} 
                  size={14} 
                  color={getCategoryColor(alarm.category)} 
                />
                <Text style={[styles.detailText, {color: getCategoryColor(alarm.category)}]}>
                  {alarm.category === 'work' ? '上班途中' : 
                   alarm.category === 'break' ? '休息提醒' :
                   alarm.category === 'focus' ? '专注模式' : '自定义'}
                </Text>
              </View>
            )}
            
            {/* 音乐信息 */}
            {alarm.music && (
              <View style={styles.detailRow}>
                <Icon name="music" size={14} color="#2196F3" />
                <Text style={[styles.detailText, {color: '#2196F3'}]} numberOfLines={1}>
                  {alarm.music.name || '未命名音乐'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 右侧：控制按钮 */}
        <View style={styles.rightSection}>
          {/* 开关 */}
          <Switch
            value={alarm.isActive}
            onValueChange={handleToggle}
            color="#4CAF50"
            style={styles.switch}
          />
          
          {/* 操作按钮 */}
          <View style={styles.actionButtons}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => onEdit && onEdit(alarm)}
              style={styles.editButton}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={handleDelete}
              style={styles.deleteButton}
            />
          </View>
        </View>
      </Card.Content>

      {/* 时尚装饰元素 */}
      <View style={styles.decorationContainer}>
        <View style={[styles.decorationLine, {backgroundColor: getCategoryColor(alarm.category)}]} />
        <View style={styles.decorationDots}>
          {[1, 2, 3].map(i => (
            <View 
              key={i} 
              style={[
                styles.decorationDot, 
                {backgroundColor: getCategoryColor(alarm.category), opacity: 0.3 + (i * 0.2)}
              ]} 
            />
          ))}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  leftSection: {
    flex: 1,
    marginRight: 16,
  },
  timeContainer: {
    marginBottom: 12,
  },
  time: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    color: '#757575',
    fontStyle: 'italic',
  },
  detailsContainer: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#757575',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  switch: {
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  editButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  decorationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  decorationLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  decorationDots: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  decorationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default AlarmItem;