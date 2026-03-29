/**
 * 推送通知设置组件
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Card, Button, Switch, List, IconButton, Divider, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector, useDispatch } from 'react-redux';

import notificationService from '../services/notificationService';
import { updateSettings } from '../store/slices/settingsSlice';

const NotificationSettings = () => {
  const dispatch = useDispatch();
  const settings = useSelector(state => state.settings);
  const alarms = useSelector(state => state.alarm.alarms);
  
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  useEffect(() => {
    // 检查通知权限状态
    checkNotificationPermission();
    // 加载已调度的通知
    loadScheduledNotifications();
  }, []);

  const checkNotificationPermission = async () => {
    try {
      setIsCheckingPermission(true);
      const hasPermission = await notificationService.checkNotificationPermission();
      setNotificationPermission(hasPermission);
    } catch (error) {
      console.error('检查通知权限失败:', error);
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const loadScheduledNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const notifications = await notificationService.getScheduledNotifications();
      setScheduledNotifications(notifications);
    } catch (error) {
      console.error('加载计划通知失败:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const hasPermission = await notificationService.requestNotificationPermission();
      setNotificationPermission(hasPermission);
      
      if (hasPermission) {
        Alert.alert('权限已授权', '通知权限已成功获取，现在可以接收闹钟提醒了。');
      } else {
        Alert.alert('权限被拒绝', '通知权限被拒绝，您将无法接收闹钟提醒。请前往系统设置中开启通知权限。');
      }
    } catch (error) {
      console.error('请求通知权限失败:', error);
      Alert.alert('错误', '请求通知权限失败，请稍后重试。');
    }
  };

  const sendTestNotification = async () => {
    try {
      const success = await notificationService.sendTestNotification();
      if (success) {
        Alert.alert('测试通知', '测试通知已发送，请检查是否收到通知。');
      } else {
        Alert.alert('失败', '发送测试通知失败，请检查通知权限。');
      }
    } catch (error) {
      console.error('发送测试通知失败:', error);
      Alert.alert('错误', '发送测试通知失败，请检查权限设置。');
    }
  };

  const scheduleAllAlarms = async () => {
    try {
      const enabledAlarms = alarms.filter(alarm => alarm.isEnabled);
      
      if (enabledAlarms.length === 0) {
        Alert.alert('提示', '没有启用的闹钟可以调度。');
        return;
      }

      const scheduledCount = await notificationService.scheduleAllAlarms();
      await loadScheduledNotifications(); // 刷新列表
      
      Alert.alert('调度完成', `已成功调度 ${scheduledCount} 个闹钟通知。`);
    } catch (error) {
      console.error('调度所有闹钟失败:', error);
      Alert.alert('错误', '调度闹钟失败，请稍后重试。');
    }
  };

  const cancelAllScheduledNotifications = async () => {
    try {
      if (scheduledNotifications.length === 0) {
        Alert.alert('提示', '没有已调度的通知可以取消。');
        return;
      }

      Alert.alert(
        '确认取消',
        `确定要取消所有 ${scheduledNotifications.length} 个已调度的通知吗？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确定',
            style: 'destructive',
            onPress: async () => {
              const success = await notificationService.cancelAllScheduledNotifications();
              if (success) {
                await loadScheduledNotifications();
                Alert.alert('成功', '所有通知已取消。');
              } else {
                Alert.alert('失败', '取消通知失败，请稍后重试。');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('取消所有通知失败:', error);
      Alert.alert('错误', '取消通知失败，请稍后重试。');
    }
  };

  const checkAndFixNotificationSchedule = async () => {
    try {
      const fixedCount = await notificationService.checkAndFixNotificationSchedule();
      await loadScheduledNotifications();
      
      if (fixedCount > 0) {
        Alert.alert('修复完成', `已修复 ${fixedCount} 个闹钟的通知调度。`);
      } else {
        Alert.alert('检查完成', '所有闹钟的通知调度正常，无需修复。');
      }
    } catch (error) {
      console.error('检查修复通知调度失败:', error);
      Alert.alert('错误', '检查修复通知调度失败。');
    }
  };

  const handleNotificationEnabledChange = (value) => {
    dispatch(updateSettings({ notificationEnabled: value }));
  };

  const handleNotificationSoundChange = (value) => {
    dispatch(updateSettings({ notificationSound: value }));
  };

  const handleHapticFeedbackChange = (value) => {
    dispatch(updateSettings({ hapticFeedback: value }));
  };

  const getNotificationStatusText = () => {
    if (isCheckingPermission) return '检查中...';
    return notificationPermission ? '已授权' : '未授权';
  };

  const getNotificationStatusColor = () => {
    if (isCheckingPermission) return '#FF9800'; // 橙色
    return notificationPermission ? '#4CAF50' : '#F44336'; // 绿色或红色
  };

  const getScheduledNotificationsSummary = () => {
    if (isLoadingNotifications) return '加载中...';
    
    const alarmCount = scheduledNotifications.filter(
      n => n.userInfo?.type === 'alarm'
    ).length;
    
    const snoozeCount = scheduledNotifications.filter(
      n => n.userInfo?.type === 'snooze'
    ).length;
    
    const reminderCount = scheduledNotifications.filter(
      n => n.userInfo?.type === 'reminder'
    ).length;
    
    return `闹钟: ${alarmCount} | 贪睡: ${snoozeCount} | 提醒: ${reminderCount}`;
  };

  return (
    <Card style={styles.container}>
      <Card.Title
        title="推送通知设置"
        left={props => <Icon {...props} name="bell" />}
      />
      <Card.Content>
        {/* 权限状态 */}
        <View style={styles.permissionSection}>
          <View style={styles.permissionInfo}>
            <Text style={styles.sectionTitle}>通知权限状态</Text>
            <View style={styles.permissionStatus}>
              <View style={[styles.permissionDot, { backgroundColor: getNotificationStatusColor() }]} />
              <Text style={[styles.permissionText, { color: getNotificationStatusColor() }]}>
                {getNotificationStatusText()}
              </Text>
            </View>
          </View>
          
          {!notificationPermission && (
            <Button
              mode="contained"
              onPress={requestNotificationPermission}
              style={styles.permissionButton}
              icon="shield-check"
            >
              请求权限
            </Button>
          )}
        </View>

        {/* 通知设置 */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>通知设置</Text>
          
          <List.Item
            title="启用通知"
            description="允许应用发送通知"
            left={props => <List.Icon {...props} icon="bell-outline" />}
            right={props => (
              <Switch
                value={settings.notificationEnabled}
                onValueChange={handleNotificationEnabledChange}
                disabled={!notificationPermission}
              />
            )}
          />
          
          <List.Item
            title="通知声音"
            description="通知响起时的提示音"
            left={props => <List.Icon {...props} icon="volume-high" />}
            right={props => (
              <Chip mode="outlined">
                {settings.notificationSound === 'default' ? '默认' : '自定义'}
              </Chip>
            )}
          />
          
          <List.Item
            title="触觉反馈"
            description="通知到达时震动"
            left={props => <List.Icon {...props} icon="vibrate" />}
            right={props => (
              <Switch
                value={settings.hapticFeedback}
                onValueChange={handleHapticFeedbackChange}
              />
            )}
          />
        </View>

        <Divider style={styles.divider} />

        {/* 通知管理 */}
        <View style={styles.managementSection}>
          <Text style={styles.sectionTitle}>通知管理</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>启用的闹钟</Text>
              <Text style={styles.statValue}>
                {alarms.filter(a => a.isEnabled).length} 个
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>已调度的通知</Text>
              <Text style={styles.statValue}>
                {scheduledNotifications.length} 个
              </Text>
            </View>
          </View>
          
          <Text style={styles.scheduleSummary}>
            {getScheduledNotificationsSummary()}
          </Text>

          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={sendTestNotification}
              style={styles.actionButton}
              icon="bell-ring"
              disabled={!notificationPermission || !settings.notificationEnabled}
            >
              测试通知
            </Button>
            
            <Button
              mode="outlined"
              onPress={scheduleAllAlarms}
              style={styles.actionButton}
              icon="calendar-clock"
              disabled={!notificationPermission}
            >
              调度所有闹钟
            </Button>
          </View>

          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={checkAndFixNotificationSchedule}
              style={styles.actionButton}
              icon="wrench"
              disabled={!notificationPermission}
            >
              检查修复
            </Button>
            
            <Button
              mode="outlined"
              onPress={cancelAllScheduledNotifications}
              style={[styles.actionButton, styles.dangerButton]}
              icon="cancel"
              textColor="#F44336"
              disabled={scheduledNotifications.length === 0}
            >
              取消所有
            </Button>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* 帮助信息 */}
        <View style={styles.helpSection}>
          <Text style={styles.sectionTitle}>帮助信息</Text>
          
          <View style={styles.tipItem}>
            <Icon name="information" size={16} color="#2196F3" />
            <Text style={styles.tipText}>
              确保应用在后台运行时也能收到通知
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Icon name="information" size={16} color="#2196F3" />
            <Text style={styles.tipText}>
              重启应用后，所有闹钟会自动重新调度
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Icon name="information" size={16} color="#2196F3" />
            <Text style={styles.tipText}>
              如果收不到通知，请检查系统通知设置
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
  },
  permissionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  permissionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  permissionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  settingsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  managementSection: {
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  scheduleSummary: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderColor: '#2196F3',
  },
  dangerButton: {
    borderColor: '#F44336',
  },
  helpSection: {
    marginTop: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default NotificationSettings;