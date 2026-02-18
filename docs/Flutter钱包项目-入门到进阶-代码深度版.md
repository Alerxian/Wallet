# Flutter 钱包项目：入门到进阶（代码深度版）

适用目录：`wallet-flutter`

这份文档是对 Flutter 钱包工程的“逐层拆解版”，重点写清楚：

1. 启动和路由为什么这样设计
2. 状态层如何组织业务
3. 哪些链路真实可用，哪些链路仍是示例/框架
4. 如何从当前实现走向生产级

---

## 1. 项目全景：定位、架构、成熟度

定位：`wallet-flutter` 是对 `wallet-clean` 的 Flutter 对齐工程。

按能力成熟度划分：

- L3（可用）：钱包创建导入、主币余额、主币发送、基础网络管理
- L2（可演示）：dApp 浏览器与会话、DeFi/NFT/硬件钱包页面、组合看板
- L1（待生产化）：ERC-20 真实全链路、交易状态机、风控审批、WalletConnect 正式协议

目录结构（对应 `docs/02_architecture.md`）：

- `lib/state`：状态层
- `lib/services`：服务层
- `lib/models`：模型层
- `lib/screens`：UI 业务页
- `lib/ui/routes.dart`：路由集中映射
- `lib/core/theme.dart`：主题系统

---

## 2. 启动链路：状态先行、路由分流

## 2.1 `main.dart` 与 `app.dart`

`wallet-flutter/lib/main.dart`：

```dart
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const WalletApp());
}
```

`wallet-flutter/lib/app.dart`：

```dart
ChangeNotifierProvider(
  create: (_) => WalletAppState()..init(),
  child: Consumer<WalletAppState>(
    builder: (_, appState, __) => MaterialApp(
      themeMode: appState.themeMode,
      onGenerateRoute: buildRoute,
      initialRoute: Routes.root,
    ),
  ),
)
```

核心点：`WalletAppState()..init()` 把“状态恢复”放在应用启动最前面，避免页面先渲染再补数据导致抖动。

## 2.2 Root 分流

`wallet-flutter/lib/screens/root_screen.dart`：

```dart
Navigator.pushReplacementNamed(
  context,
  appState.hasWallet ? Routes.home : Routes.welcome,
);
```

这是典型 Flow Gating，后续加锁屏态可扩展为三叉路由（welcome/lock/home）。

---

## 3. 状态层深读：`WalletAppState` 是系统中枢

文件：`wallet-flutter/lib/state/wallet_app_state.dart`

它统一管理：

- 钱包账户：`accounts/currentAccount`
- 网络：`networks/currentNetwork`
- 资产：`tokens`
- 交易：`transactions`
- dApp：`bookmarks/history/dappSessions`
- 设置与安全：`themeMode/biometricEnabled/autoLockMinutes`

## 3.1 初始化逻辑

`init()` 同时恢复 secure + prefs 数据：

```dart
final rawAccounts = await _secureStorage.read(key: _secureAccountsKey);
final rawNetworks = prefs.getString(_networksKey);
final txRaw = prefs.getString(_txKey);
```

这个设计是正确的“数据源分级”：

- 敏感数据进 secure storage
- 普通配置进 shared prefs

## 3.2 钱包动作

创建钱包：

```dart
final created = await WalletCryptoService.createWallet(words: words);
accounts.add(account);
currentAccount = account;
await _saveAccounts();
await refreshPortfolio();
notifyListeners();
```

导入钱包同理。这里体现了“服务产出 -> 状态写入 -> 持久化 -> 刷新视图”的标准链路。

## 3.3 发送交易动作

```dart
final txHash = await EvmService.sendNativeTransaction(...);
transactions.insert(0, tx);
await _saveTransactions();
await refreshPortfolio();
notifyListeners();
```

当前限制也写得很清晰：只支持主币发送，ERC-20 发送提示“下一阶段接入”。

---

## 4. 服务层深读：密码学、链交互、价格

## 4.1 密码学服务 `WalletCryptoService`

文件：`wallet-flutter/lib/services/wallet_crypto_service.dart`

关键实现：

```dart
final mnemonic = bip39.generateMnemonic(strength: words == 24 ? 256 : 128);
final seed = bip39.mnemonicToSeed(mnemonic);
final child = bip32.BIP32.fromSeed(seed).derivePath("m/44'/60'/0'/0/0");
```

导入时先识别私钥：

```dart
if (_isPrivateKey(text)) {
  final credentials = EthPrivateKey.fromHex(normalized);
}
```

否则按助记词校验。该策略对用户输入容错较好。

## 4.2 链交互服务 `EvmService`

文件：`wallet-flutter/lib/services/evm_service.dart`

余额读取：

```dart
final etherAmount = await client.getBalance(EthereumAddress.fromHex(address));
return etherAmount.getValueInUnit(EtherUnit.ether);
```

交易广播：

```dart
await client.sendTransaction(
  credentials,
  Transaction(to: ..., value: ...),
  chainId: chainId,
  fetchChainIdFromNetworkId: false,
)
```

交易回执映射：`fetchTxReceiptAsModel` 已具备，但还未形成自动轮询机制。

## 4.3 价格服务 `PriceService`

文件：`wallet-flutter/lib/services/price_service.dart`

当前实现轻量：

```dart
final uri = Uri.parse('$_base?ids=${ids.join(',')}&vs_currencies=usd');
```

优点：简单可用。

缺口：缺缓存、限流、重试，不适合高频刷新场景。建议借鉴 RN 版 `PriceService` 的队列和退避机制。

---

## 5. UI 与路由：从页面到模块编排

## 5.1 路由集中管理

文件：`wallet-flutter/lib/ui/routes.dart`

特点：

- `Routes` 常量统一声明
- `buildRoute` 单点映射
- 各页面通过命名路由跳转

优点是易查、易改，当前项目规模下很合适。

## 5.2 首页结构 `home_screen.dart`

文件：`wallet-flutter/lib/screens/home_screen.dart`

首页承担“钱包控制台”角色：

- 总资产 Hero
- 发送/接收/Swap/交易入口
- 资产列表
- 功能模块入口（网络、NFT、DeFi、dApp、硬件钱包）

关键刷新逻辑：

```dart
RefreshIndicator(
  onRefresh: () => context.read<WalletAppState>().refreshPortfolio(),
)
```

## 5.3 发送页 `send_screen.dart`

已具备：

- 地址正则校验
- 数量校验
- 生物识别验证开关
- 提交时调用状态层 `send`

注意一个细节：提交成功提示文案仍写“模拟广播”，但状态层实际调用了 `EvmService.sendNativeTransaction`，建议文案改为“已提交链上交易（主币）”。

## 5.4 dApp 模块：浏览器 + 会话

### 浏览器页面 `dapp_browser_screen.dart`

具备：

- WebView 加载
- URL 输入与规范化
- 前进后退刷新
- 加书签
- 自动写入历史
- “连接”按钮（当前为模拟会话）

关键代码：

```dart
await context.read<WalletAppState>().addHistory(...);
await context.read<WalletAppState>().connectDappSession(name: host, url: currentUrl);
```

### dApp 管理页 `dapp_screen.dart`

可视化展示会话与书签，属于可用的产品骨架。

---

## 6. 主题与通用组件

## 6.1 主题系统 `core/theme.dart`

优势：

- 颜色、卡片、输入框、按钮在 Theme 层集中定义
- 浅色/深色主题行为一致

建议：进一步抽象 spacing/radius/typography token，减少页面硬编码值。

## 6.2 通用组件 `widgets/common.dart`

组件层沉淀：

- `ScreenShell`
- `SectionCard`
- `HeroBalanceCard`
- `EmptyHint`

这已经具备基础设计系统雏形，后续可以持续组件化。

---

## 7. 设计模式映射（代码级）

1. Single Source of Truth
   - `WalletAppState`

2. Adapter/Facade
   - `EvmService`、`WalletCryptoService`、`PriceService`

3. DTO + Serialization
   - `models/models.dart` 全量 `toMap/fromMap`

4. Progressive Enhancement
   - 先主币链路、后 ERC-20/风控/协议栈

5. Fail-soft UX
   - `lastSyncError` 不阻塞界面主流程

---

## 8. 关键风险与现实缺口

## 8.1 单一大状态对象

`WalletAppState` 当前体量过大，风险是：

- 修改耦合高
- 重建范围大
- 单测颗粒度难控制

## 8.2 交易状态一致性

虽有 `fetchTxReceiptAsModel`，但缺完整自动同步任务。

后果：用户可能看到长期 pending。

## 8.3 价格鲁棒性

当前价格服务对接口波动的容错不足。

## 8.4 dApp 安全

浏览器与会话当前以可用为主，尚缺生产级风险治理（域名情报、签名审批、权限模型）。

---

## 9. 实战学习路线（按角色）

## 9.1 新同学（3 天）

Day1：跑通 + 路由

- 阅读 `main.dart`、`app.dart`、`root_screen.dart`

Day2：状态与交易

- 阅读 `wallet_app_state.dart` 的 `init/createWallet/send/refreshPortfolio`

Day3：服务与 UI

- 阅读 `wallet_crypto_service.dart`、`evm_service.dart`、`home_screen.dart`

## 9.2 进阶同学（1 周）

- 接入 ERC-20 余额
- 增加交易回执轮询
- 为状态层动作补测试

## 9.3 负责人（2 周）

- 拆分状态域
- 引入安全审批流程
- 建立 CI 自动化测试矩阵

---

## 10. 生产化路线图（可执行）

P0（先做）

1. 状态拆分：Wallet/Portfolio/Dapp/Settings
2. 交易状态机：pending->success/failed/replaced
3. 价格服务：缓存 + 限流 + 重试

P1（随后）

1. ERC-20 发送与余额全链路
2. dApp 权限模型（账户/链/方法）
3. 审批页可读化（TypedData、交易预览）

P2（长期）

1. 本地数据库替代部分 JSON 存储
2. 可观测（埋点、错误分级、性能）
3. WalletConnect 正式协议栈与安全策略

---

## 11. 关键文件阅读顺序

1. `wallet-flutter/lib/main.dart`
2. `wallet-flutter/lib/app.dart`
3. `wallet-flutter/lib/screens/root_screen.dart`
4. `wallet-flutter/lib/state/wallet_app_state.dart`
5. `wallet-flutter/lib/services/wallet_crypto_service.dart`
6. `wallet-flutter/lib/services/evm_service.dart`
7. `wallet-flutter/lib/services/price_service.dart`
8. `wallet-flutter/lib/screens/home_screen.dart`
9. `wallet-flutter/lib/screens/send_screen.dart`
10. `wallet-flutter/lib/screens/dapp_browser_screen.dart`

---

## 12. 总结

这个 Flutter 钱包工程已经完成“真实主链路 + 完整 UI 骨架”的关键跨越。下一步不是继续加页面，而是补足工程核心：

- 状态可维护性
- 交易一致性
- 安全审批
- 测试与可观测

这四项做好后，项目就能稳定进入长期迭代周期。
