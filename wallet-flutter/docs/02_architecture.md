# 02 - 架构说明

## 总体结构

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

## 分层职责

### 1) UI 层（screens + widgets）
- `screens/`：具体业务页面
- `widgets/common.dart`：可复用 UI 基元（SectionCard、HeroBalanceCard 等）

### 2) 状态层（state）
- `state/wallet_app_state.dart`
- 统一持有：钱包、网络、资产、交易、dApp、设置
- 通过 `ChangeNotifier` + `Provider` 驱动页面响应式刷新

### 3) 模型层（models）
- `models/models.dart`
- 定义 WalletAccount / NetworkConfig / TokenBalance / WalletTransaction / DappBookmark 等
- 负责 JSON 序列化与反序列化

### 4) 基础设施
- `flutter_secure_storage`：保存敏感数据（账户密钥类）
- `shared_preferences`：保存轻量配置（主题、历史、书签）

## 状态流

1. UI 调用 `context.read<WalletAppState>().method(...)`
2. 状态层更新内存数据并写入本地
3. `notifyListeners()`
4. 页面通过 `context.watch<WalletAppState>()` 自动刷新

## 路由策略

- 在 `ui/routes.dart` 集中声明 `Routes` 常量
- `buildRoute` 统一映射页面
- 页面跳转统一使用 `Navigator.pushNamed(context, Routes.xxx)`
