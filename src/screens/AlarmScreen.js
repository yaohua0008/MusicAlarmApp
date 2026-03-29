import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {FAB, Searchbar, Chip, Button} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AlarmItem from '../components/AlarmItem';
import CategoryFilter from '../components/CategoryFilter';
import EmptyState from '../components/EmptyState';
import {toggleAlarm, deleteAlarm} from '../store/slices/alarmSlice';

const AlarmScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const alarms = useSelector(state => state.alarms.alarms);
  const categories = useSelector(state => state.settings.alarmCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('time'); // 'time', 'name', 'created'

  // 处理搜索
  const filteredBySearch = searchQuery
    ? alarms.filter(
        alarm =>
          alarm.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alarm.music?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : alarms;

  // 处理分类筛选
  const filteredByCategory =
    selectedCategory === 'all'
      ? filteredBySearch
      : filteredBySearch.filter(alarm => alarm.category === selectedCategory);

  // 处理状态筛选
  const filteredByStatus =
    selectedStatus === 'all'
      ? filteredByCategory
      : selectedStatus === 'active'
      ? filteredByCategory.filter(alarm => alarm.isActive)
      : filteredByCategory.filter(alarm => !alarm.isActive);

  // 排序
  const sortedAlarms = [...filteredByStatus].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.label || '').localeCompare(b.label || '');
      case 'created':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'time':
      default:
        return new Date(a.time) - new Date(b.time);
    }
  });

  // 计算分类统计
  const categoryStats = categories.map(category => ({
    ...category,
    count: alarms.filter(alarm => alarm.category === category.id).length,
  }));

  // 添加"全部"和状态筛选
  const allCategories = [
    {id: 'all', name: '全部', icon: 'view-grid', color: '#757575', count: alarms.length},
    ...categoryStats,
    {id: 'active', name: '已启用', icon: 'check-circle', color: '#4CAF50', count: alarms.filter(a => a.isActive).length},
    {id: 'inactive', name: '未启用', icon: 'circle-outline', color: '#F44336', count: alarms.filter(a => !a.isActive).length},
  ];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // 模拟数据刷新
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleAddAlarm = () => {
    navigation.navigate('AlarmDetail', {alarmId: null});
  };

  const handleEditAlarm = alarm => {
    navigation.navigate('AlarmDetail', {alarmId: alarm.id});
  };

  const handleDeleteAlarm = alarmId => {
    dispatch(deleteAlarm(alarmId));
  };

  const handleQuickAction = action => {
    switch (action) {
      case 'enableAll':
        alarms.forEach(alarm => {
          if (!alarm.isActive) dispatch(toggleAlarm(alarm.id));
        });
        break;
      case 'disableAll':
        alarms.forEach(alarm => {
          if (alarm.isActive) dispatch(toggleAlarm(alarm.id));
        });
        break;
      case 'sortTime':
        setSortBy('time');
        break;
      case 'sortName':
        setSortBy('name');
        break;
    }
  };

  const renderAlarmItem = ({item}) => (
    <AlarmItem
      alarm={item}
      onEdit={handleEditAlarm}
      onDelete={handleDeleteAlarm}
    />
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 搜索栏 */}
      <Searchbar
        placeholder="搜索闹钟或音乐..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#2196F3"
        inputStyle={styles.searchInput}
      />

      {/* 快速操作栏 */}
      <View style={styles.quickActionsContainer}>
        <Chip
          icon="sort"
          selected={sortBy === 'time'}
          onPress={() => handleQuickAction('sortTime')}
          style={styles.chip}
          selectedColor="#2196F3">
          按时间
        </Chip>
        <Chip
          icon="sort-alphabetical-ascending"
          selected={sortBy === 'name'}
          onPress={() => handleQuickAction('sortName')}
          style={styles.chip}
          selectedColor="#2196F3">
          按名称
        </Chip>
        <Chip
          icon="check-all"
          onPress={() => handleQuickAction('enableAll')}
          style={styles.chip}
          textStyle={styles.chipText}>
          全部启用
        </Chip>
        <Chip
          icon="close-box-multiple"
          onPress={() => handleQuickAction('disableAll')}
          style={styles.chip}
          textStyle={styles.chipText}>
          全部禁用
        </Chip>
      </View>

      {/* 分类筛选器 */}
      <CategoryFilter
        categories={allCategories}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />
    </View>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="alarm"
      title={searchQuery ? '未找到匹配的闹钟' : '暂无闹钟'}
      description={
        searchQuery
          ? '请尝试不同的搜索关键词'
          : '点击下方按钮添加第一个闹钟，开始享受智能提醒吧！'
      }
      actionText="添加闹钟"
      onAction={handleAddAlarm}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={sortedAlarms}
          renderItem={renderAlarmItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />

        {/* 添加按钮 */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleAddAlarm}
          color="#FFFFFF"
        />

        {/* 统计信息 */}
        {sortedAlarms.length > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              共 {sortedAlarms.length} 个闹钟
              {selectedCategory !== 'all' && ` · ${selectedStatus === 'active' ? '已启用' : selectedStatus === 'inactive' ? '未启用' : '全部'}`}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    elevation: 0,
  },
  searchInput: {
    fontSize: 14,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    height: 32,
  },
  chipText: {
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#2196F3',
    borderRadius: 28,
    shadowColor: '#2196F3',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statsContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statsText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
});

export default AlarmScreen;