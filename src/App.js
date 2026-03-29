import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as StoreProvider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, ActivityIndicator } from 'react-native';
import TrackPlayer from 'react-native-track-player';

import store from './store/store';
import AppNavigator from './navigation/AppNavigator';
import theme from './theme/theme';
import initializeApp from './services/initializeApp';
import musicService from './services/musicService';
import notificationService from './services/notificationService';

// 应用初始化组件
const AppInitializer = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('开始应用初始化...');
        
        // 1. 检查是否是首次运行
        const isFirstRun = await initializeApp.checkFirstRun();
        if (isFirstRun) {
          console.log('首次运行应用，生成初始数据');
        }
        
        // 2. 初始化音乐播放器
        await musicService.initializePlayer();
        console.log('音乐播放器初始化完成');
        
        // 3. 初始化推送通知服务
        await notificationService.initializeNotificationService();
        console.log('推送通知服务初始化完成');
        
        // 4. 加载应用数据到Redux store
        const appData = await initializeApp.loadAppData();
        
        // 这里可以添加将数据分发到Redux store的逻辑
        // 暂时用console.log展示
        console.log('应用数据加载完成:', {
          alarmsCount: appData.alarms.length,
          musicCount: appData.music.length,
          settings: appData.settings.theme,
        });
        
        // 5. 调度所有启用的闹钟
        const scheduledCount = await notificationService.scheduleAllAlarms();
        console.log(`已调度 ${scheduledCount} 个闹钟通知`);
        
        // 6. 记录应用启动
        await initializeApp.logAppUsage('app_opened');
        
        setIsInitializing(false);
        console.log('应用初始化完成');
      } catch (err) {
        console.error('应用初始化失败:', err);
        setError(err.message || '应用初始化失败');
        setIsInitializing(false);
      }
    };

    initialize();

    // 清理函数
    return () => {
      // 应用退出时清理资源
      musicService.cleanupPlayer().catch(console.error);
    };
  }, []);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.text, fontSize: 16 }}>
          正在初始化音乐闹钟...
        </Text>
        <Text style={{ marginTop: 8, color: theme.colors.secondary, fontSize: 14 }}>
          加载音乐库和闹钟数据
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.error, fontSize: 18, marginBottom: 16 }}>
          初始化失败
        </Text>
        <Text style={{ color: theme.colors.text, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 }}>
          {error}
        </Text>
        <Text 
          style={{ color: theme.colors.primary, fontSize: 16, marginTop: 24, padding: 12 }}
          onPress={() => {
            // 重试初始化
            setError(null);
            setIsInitializing(true);
          }}
        >
          重试
        </Text>
      </View>
    );
  }

  return children;
};

// 音乐播放器服务注册
TrackPlayer.registerPlaybackService(() => require('./services/musicService'));

const App = () => {
  return (
    <StoreProvider store={store}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <AppInitializer>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </AppInitializer>
        </SafeAreaProvider>
      </PaperProvider>
    </StoreProvider>
  );
};

export default App;