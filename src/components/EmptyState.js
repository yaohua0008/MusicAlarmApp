import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Button} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const EmptyState = ({icon, title, description, actionText, onAction, style}) => {
  const getIcon = () => {
    const icons = {
      alarm: 'alarm-off',
      music: 'music-note-off',
      search: 'magnify',
      settings: 'cog',
      add: 'plus-circle',
      default: 'emoticon-sad',
    };
    return icon || 'default';
  };

  const getIconColor = () => {
    const colors = {
      alarm: '#FF9800',
      music: '#2196F3',
      search: '#9C27B0',
      settings: '#757575',
      add: '#4CAF50',
      default: '#BDBDBD',
    };
    return colors[icon] || colors.default;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, {backgroundColor: `${getIconColor()}15`}]}>
          <Icon name={getIcon()} size={64} color={getIconColor()} />
        </View>
        {/* 装饰元素 */}
        <View style={styles.decoration1} />
        <View style={styles.decoration2} />
        <View style={styles.decoration3} />
      </View>
      
      <Text style={styles.title}>{title || '暂无内容'}</Text>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      
      {actionText && onAction && (
        <Button
          mode="contained"
          onPress={onAction}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          icon={({size, color}) => (
            <Icon name="plus" size={size} color={color} />
          )}>
          {actionText}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  decoration1: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E3F2FD',
    opacity: 0.3,
    zIndex: 1,
  },
  decoration2: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F3E5F5',
    opacity: 0.2,
    zIndex: 0,
  },
  decoration3: {
    position: 'absolute',
    top: 40,
    right: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3E0',
    opacity: 0.4,
    transform: [{rotate: '45deg'}],
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  actionButton: {
    borderRadius: 25,
    backgroundColor: '#2196F3',
    shadowColor: '#2196F3',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
});

export default EmptyState;