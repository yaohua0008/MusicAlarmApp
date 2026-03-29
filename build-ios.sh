#!/bin/bash

# iOS构建脚本
# 使用方法：在macOS上运行 ./build-ios.sh

set -e  # 遇到错误时退出

echo "🎯 MusicAlarmApp iOS构建脚本"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查环境
echo -e "${BLUE}1. 检查环境...${NC}"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js版本: $(node --version)${NC}"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm版本: $(npm --version)${NC}"

# 检查Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Xcode未安装${NC}"
    echo "请从App Store安装Xcode"
    exit 1
fi
echo -e "${GREEN}✅ Xcode已安装${NC}"

# 检查CocoaPods
if ! command -v pod &> /dev/null; then
    echo -e "${YELLOW}⚠️  CocoaPods未安装，正在安装...${NC}"
    sudo gem install cocoapods
fi
echo -e "${GREEN}✅ CocoaPods版本: $(pod --version)${NC}"

# 2. 安装依赖
echo -e "${BLUE}2. 安装项目依赖...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm安装失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ JavaScript依赖安装完成${NC}"

# 3. 安装iOS依赖
echo -e "${BLUE}3. 安装iOS依赖...${NC}"
cd ios
pod install --repo-update
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ CocoaPods安装失败${NC}"
    exit 1
fi
cd ..
echo -e "${GREEN}✅ iOS依赖安装完成${NC}"

# 4. 清理项目
echo -e "${BLUE}4. 清理项目...${NC}"
cd ios
xcodebuild clean -workspace MusicAlarmApp.xcworkspace -scheme MusicAlarmApp
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  清理过程中出现警告，继续...${NC}"
fi
cd ..
echo -e "${GREEN}✅ 项目清理完成${NC}"

# 5. Metro打包
echo -e "${BLUE}5. 打包JavaScript代码...${NC}"
npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios/main.jsbundle --assets-dest ios
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ JavaScript打包失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ JavaScript打包完成${NC}"

# 6. 构建Archive
echo -e "${BLUE}6. 构建Archive...${NC}"
cd ios

# 检查工作空间是否存在
if [ ! -d "MusicAlarmApp.xcworkspace" ]; then
    echo -e "${RED}❌ Xcode工作空间不存在${NC}"
    echo "请确保ios目录包含正确的Xcode项目"
    exit 1
fi

# 构建Archive
xcodebuild archive \
  -workspace MusicAlarmApp.xcworkspace \
  -scheme MusicAlarmApp \
  -configuration Release \
  -archivePath build/MusicAlarmApp.xcarchive \
  -allowProvisioningUpdates \
  -quiet

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Archive构建失败${NC}"
    echo "可能的原因："
    echo "1. 证书配置错误"
    echo "2. 描述文件不匹配"
    echo "3. 缺少必要的权限"
    exit 1
fi

echo -e "${GREEN}✅ Archive构建完成${NC}"

# 7. 导出IPA
echo -e "${BLUE}7. 导出IPA文件...${NC}"

# 检查ExportOptions.plist是否存在
if [ ! -f "ExportOptions.plist" ]; then
    echo -e "${YELLOW}⚠️  ExportOptions.plist不存在，创建默认配置...${NC}"
    cat > ExportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>compileBitcode</key>
    <false/>
    <key>method</key>
    <string>development</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>com.yourcompany.musicalarmapp</key>
        <string>MusicAlarmApp Development</string>
    </dict>
    <key>signingCertificate</key>
    <string>iPhone Developer</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
</dict>
</plist>
EOF
    echo -e "${YELLOW}⚠️  请编辑ExportOptions.plist文件，填写正确的Team ID和证书信息${NC}"
fi

# 导出IPA
xcodebuild -exportArchive \
  -archivePath build/MusicAlarmApp.xcarchive \
  -exportPath build \
  -exportOptionsPlist ExportOptions.plist \
  -allowProvisioningUpdates \
  -quiet

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ IPA导出失败${NC}"
    echo "可能的原因："
    echo "1. ExportOptions.plist配置错误"
    echo "2. 证书权限问题"
    echo "3. 描述文件不匹配"
    exit 1
fi

cd ..
echo -e "${GREEN}✅ IPA文件导出完成${NC}"

# 8. 完成
echo -e "${BLUE}8. 构建完成！${NC}"
echo "========================================"
echo -e "${GREEN}🎉 iOS构建成功！${NC}"
echo ""
echo "📁 生成的文件："
echo "   Archive: ios/build/MusicAlarmApp.xcarchive"
echo "   IPA文件: ios/build/MusicAlarmApp.ipa"
echo ""
echo "📱 安装方法："
echo "   1. 使用Xcode安装到设备"
echo "   2. 使用Apple Configurator 2"
echo "   3. 通过TestFlight分发"
echo "   4. 使用第三方分发平台"
echo ""
echo "🔧 后续步骤："
echo "   1. 测试应用功能"
echo "   2. 上传到App Store Connect"
echo "   3. 提交App Store审核"
echo ""
echo "⚠️  注意："
echo "   - 确保Bundle ID与Apple Developer配置一致"
echo "   - 检查所有权限是否已配置"
echo "   - 测试推送通知功能"
echo ""
echo "祝你好运！🚀"