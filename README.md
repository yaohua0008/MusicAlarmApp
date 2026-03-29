# Music Alarm App 🎵⏰

一个基于 React Native 开发的智能音乐闹钟应用，专注于上班途中和休息时的定时提醒功能。

## ✨ 功能特性

### 🚀 核心功能
- **智能闹钟**：自定义时间、重复规则、贪睡功能
- **音乐播放**：本地音乐库、播放列表管理
- **场景模式**：上班途中、休息提醒、专注模式
- **智能提醒**：基于地理位置和时间的智能触发

### 🎨 用户体验
- **响应式设计**：适配 iOS 和 Android
- **主题系统**：支持深色/浅色模式
- **直观界面**：简洁易用的用户界面
- **离线功能**：无需网络即可使用

### 🔧 技术特点
- **跨平台**：使用 React Native 开发
- **状态管理**：Redux Toolkit 管理应用状态
- **导航系统**：React Navigation 实现流畅导航
- **本地存储**：MMKV 提供高性能本地存储

## 📱 应用截图

*（截图将在应用开发完成后添加）*

## 🛠️ 技术栈

### 前端
- **React Native 0.78.0** - 跨平台移动应用框架
- **React 19.0.0** - UI 库
- **Redux Toolkit** - 状态管理
- **React Navigation** - 导航系统

### UI 组件
- **React Native Paper** - Material Design 组件库
- **React Native Vector Icons** - 图标库

### 功能模块
- **React Native Track Player** - 音乐播放器
- **React Native Push Notification** - 推送通知
- **React Native MMKV** - 高性能本地存储
- **React Native Permissions** - 权限管理

### 开发工具
- **TypeScript** - 类型安全
- **ESLint & Prettier** - 代码规范
- **Jest** - 测试框架
- **Metro** - 打包工具

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- npm 或 yarn
- React Native 开发环境
  - iOS: Xcode & CocoaPods
  - Android: Android Studio & JDK

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/yourusername/music-alarm-app.git
cd music-alarm-app
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **iOS 配置**
```bash
cd ios
pod install
cd ..
```

4. **启动应用**
```bash
# iOS
npm run ios

# Android
npm run android

# 开发服务器
npm start
```

## 📁 项目结构

```
music-alarm-app/
├── src/
│   ├── components/          # 可复用组件
│   ├── screens/            # 页面组件
│   ├── navigation/         # 导航配置
│   ├── store/              # Redux 状态管理
│   │   ├── slices/         # Redux slices
│   │   └── store.js        # Redux store
│   ├── services/           # 业务逻辑服务
│   ├── utils/              # 工具函数
│   ├── theme/              # 主题配置
│   └── App.js              # 应用入口
├── android/                # Android 原生代码
├── ios/                    # iOS 原生代码
├── assets/                 # 静态资源
└── package.json
```

## 📋 开发计划

### 阶段 1: MVP (已完成)
- [x] 项目基础架构搭建
- [x] 导航系统配置
- [x] 状态管理系统
- [x] 基础UI组件

### 阶段 2: 核心功能 (进行中)
- [ ] 闹钟管理界面
- [ ] 音乐播放器实现
- [ ] 通知系统集成
- [ ] 本地存储配置

### 阶段 3: 高级功能 (规划中)
- [ ] 场景模式实现
- [ ] 地理位置触发
- [ ] 数据分析功能
- [ ] 主题系统

### 阶段 4: 优化发布
- [ ] 性能优化
- [ ] 测试覆盖
- [ ] 应用商店发布
- [ ] 开源文档完善

## 🤝 贡献指南

我们欢迎所有形式的贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

### 开发流程
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 代码规范
- 使用 ESLint 和 Prettier 保持代码风格一致
- 编写清晰的提交信息
- 为新功能添加测试用例
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [React Native](https://reactnative.dev/) - 跨平台移动应用框架
- [React Navigation](https://reactnavigation.org/) - 路由和导航
- [Redux Toolkit](https://redux-toolkit.js.org/) - 状态管理
- [React Native Paper](https://callstack.github.io/react-native-paper/) - Material Design 组件库

## 📞 联系方式

如有问题或建议，请通过以下方式联系我们：
- GitHub Issues: [问题反馈](https://github.com/yourusername/music-alarm-app/issues)
- Email: your.email@example.com

---

⭐️ 如果这个项目对你有帮助，请给我们一个 Star！