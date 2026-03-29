import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screens/HomeScreen';
import AlarmScreen from '../screens/AlarmScreen';
import MusicScreen from '../screens/MusicScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AlarmDetailScreen from '../screens/AlarmDetailScreen';
import MusicPlayerScreen from '../screens/MusicPlayerScreen';
import SleepAnalysisScreen from '../screens/SleepAnalysisScreen';
import WhiteNoiseScreen from '../screens/WhiteNoiseScreen';
import SleepDetailAnalysis from '../screens/SleepDetailAnalysis';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AlarmDetail"
        component={AlarmDetailScreen}
        options={{title: '闹钟详情'}}
      />
      <Stack.Screen
        name="MusicPlayer"
        component={MusicPlayerScreen}
        options={{title: '音乐播放器'}}
      />
      <Stack.Screen
        name="SleepAnalysis"
        component={SleepAnalysisScreen}
        options={{title: '睡眠分析'}}
      />
      <Stack.Screen
        name="WhiteNoiseSelection"
        component={WhiteNoiseScreen}
        options={{title: '白噪音选择'}}
      />
      <Stack.Screen
        name="SleepDetailAnalysis"
        component={SleepDetailAnalysis}
        options={{title: '睡眠详细分析'}}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Alarms') {
            iconName = focused ? 'alarm' : 'alarm-outline';
          } else if (route.name === 'Music') {
            iconName = focused ? 'music' : 'music-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'cog' : 'cog-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        },
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{title: '首页'}}
      />
      <Tab.Screen
        name="Alarms"
        component={AlarmScreen}
        options={{title: '闹钟'}}
      />
      <Tab.Screen
        name="Music"
        component={MusicScreen}
        options={{title: '音乐'}}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{title: '设置'}}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;