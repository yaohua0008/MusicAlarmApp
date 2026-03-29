import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CategoryFilter = ({categories, selectedCategory, onSelect, style}) => {
  const getCategoryIcon = categoryId => {
    const icons = {
      all: 'view-grid',
      work: 'briefcase',
      break: 'coffee',
      focus: 'brain',
      custom: 'star',
      active: 'check-circle',
      inactive: 'circle-outline',
    };
    return icons[categoryId] || 'tag';
  };

  const getCategoryColor = categoryId => {
    const colors = {
      all: '#757575',
      work: '#2196F3',
      break: '#4CAF50',
      focus: '#FF9800',
      custom: '#9C27B0',
      active: '#4CAF50',
      inactive: '#F44336',
    };
    return colors[categoryId] || '#9E9E9E';
  };

  const getCategoryName = categoryId => {
    const names = {
      all: '全部',
      work: '上班途中',
      break: '休息提醒',
      focus: '专注模式',
      custom: '自定义',
      active: '已启用',
      inactive: '未启用',
    };
    return names[categoryId] || categoryId;
  };

  // 默认分类
  const defaultCategories = [
    {id: 'all', name: '全部', count: 0},
    {id: 'work', name: '上班途中', count: 0},
    {id: 'break', name: '休息提醒', count: 0},
    {id: 'focus', name: '专注模式', count: 0},
    {id: 'custom', name: '自定义', count: 0},
    {id: 'active', name: '已启用', count: 0},
    {id: 'inactive', name: '未启用', count: 0},
  ];

  const displayCategories = categories || defaultCategories;

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {displayCategories.map(category => {
          const isSelected = selectedCategory === category.id;
          const iconName = getCategoryIcon(category.id);
          const color = getCategoryColor(category.id);
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                isSelected && styles.categoryItemSelected,
                isSelected && {borderColor: color},
              ]}
              onPress={() => onSelect(category.id)}>
              <View style={styles.categoryIconContainer}>
                <Icon
                  name={iconName}
                  size={20}
                  color={isSelected ? '#FFFFFF' : color}
                />
                {category.count > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{category.count}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.categoryText,
                  isSelected && styles.categoryTextSelected,
                ]}
                numberOfLines={1}>
                {category.name || getCategoryName(category.id)}
              </Text>
              {isSelected && (
                <View style={[styles.selectionIndicator, {backgroundColor: color}]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 100,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 76,
    marginHorizontal: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingVertical: 8,
    position: 'relative',
  },
  categoryItemSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryIconContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  countBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF4081',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryText: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#333333',
    fontWeight: 'bold',
  },
  selectionIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 24,
    height: 3,
    borderRadius: 1.5,
  },
});

export default CategoryFilter;