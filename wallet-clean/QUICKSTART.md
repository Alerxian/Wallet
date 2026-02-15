# 快速启动指南

## 安装依赖

```bash
pnpm install
```

## 运行应用

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web
```bash
npm run web
```

## 运行测试

```bash
npm test
```

## 功能概览

### 1. 欢迎界面
- 创建新钱包
- 导入已有钱包（助记词或私钥）

### 2. 创建钱包流程
1. 生成助记词（12 或 24 词）
2. 备份助记词
3. 验证助记词
4. 完成创建

### 3. 主钱包界面
- 查看钱包余额和资产
- 快捷操作（接收、发送、兑换）
- 资产列表
- 交易历史

### 4. 导入钱包
- 支持助记词导入
- 支持私钥导入
- 完整的表单验证

## 安全特性

- ✅ 系统级加密存储（iOS Keychain / Android EncryptedSharedPreferences）
- ✅ 助记词永不以明文存储
- ✅ 遵循 BIP39/BIP32/BIP44 标准
- ✅ 所有敏感操作都有验证

## 技术栈

- React Native + Expo
- TypeScript
- Zustand (状态管理)
- React Navigation
- expo-secure-store
- ethers.js
- @scure/bip39, @scure/bip32
- @noble/secp256k1

## 项目结构

```
src/
├── components/       # 可复用组件
├── navigation/       # 导航配置
├── screens/          # 页面组件
├── services/         # 业务逻辑服务
├── store/            # 状态管理
├── theme/            # 主题配置
├── types/            # TypeScript 类型定义
└── utils/            # 工具函数
```

## 开发建议

1. 使用 TypeScript 严格模式
2. 遵循 ESLint 规则
3. 编写单元测试
4. 使用 Prettier 格式化代码
5. 提交前运行测试

## 常见问题

### Q: 如何重置钱包？
A: 删除应用数据或使用 `StorageService.clearAll()`

### Q: 支持哪些网络？
A: 目前支持以太坊主网，可扩展到其他 EVM 链

### Q: 如何添加新的代币？
A: 待实现，将支持自定义 ERC-20 代币

## 下一步开发

参考 `IMPROVEMENTS.md` 文件查看详细的改进计划和待实现功能。
