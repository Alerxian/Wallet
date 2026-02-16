# wallet-flutter

Flutter 版本的钱包项目，按 `wallet-clean` 的功能模块做映射实现，且不修改原 React Native 项目。

## 已覆盖模块

- 钱包流程：欢迎页、创建钱包、导入钱包、多钱包管理与切换
- 主钱包页：安全提示、资产总览、发送、接收、Swap、模块入口
- 交易：发送交易（地址/数量校验）、接收二维码、交易历史
- 真实链路（Phase 1）：主币余额同步、主币交易广播（RPC）
- 网络与资产：网络管理（自定义 RPC）、代币管理（隐藏/显示）
- 扩展：Swap、NFT、DeFi、dApp 会话、dApp 浏览器、投资组合、硬件钱包、设置、全局搜索
- 主题：浅色/深色/跟随系统
- 本地存储：`shared_preferences` + `flutter_secure_storage`

## 目录结构

```text
lib/
  app.dart
  core/theme.dart
  models/models.dart
  state/wallet_app_state.dart
  ui/routes.dart
  widgets/common.dart
  screens/
```

## 与 wallet-clean 的关系

- `wallet-clean` 保持不变
- 新增 `wallet-flutter` 作为独立工程
- 按需求文档中的功能域分屏实现，当前包含可运行 UI 和 demo 业务流程

## 后续接入建议

1. ERC-20 能力：余额查询、发送、授权管理
2. 链上数据：交易回执轮询、真实历史同步
3. 安全能力：交易模拟、风险扫描、生物识别认证
4. dApp/硬件：接入 WalletConnect v2 与 Ledger/Trezor SDK

## 当前真实能力

- 已支持：BIP39/BIP32 派生地址、主币余额查询、主币发送广播
- 待支持：ERC-20 发送、交易回执状态更新、授权扫描与风险引擎

## 文档

- 重构与测试文档统一放在 `wallet-flutter/docs/`
- 索引见：`wallet-flutter/docs/README.md`

## 运行

> 当前环境若未安装 Flutter SDK，需要先安装。

```bash
flutter pub get
flutter run
```

## 注意

- 本工程当前为“可跑通 UI + 部分真实链路（主币）”的对齐版本。
- `wallet-clean` 目录下当前存在大量本地未提交改动（与本 Flutter 工程无关）；本次新增不会修改它。
