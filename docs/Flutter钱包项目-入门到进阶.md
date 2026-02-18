# Flutter 钱包项目：从入门到进阶（深度版）

> 适用项目：`wallet-flutter`
>
> 目标：基于实际代码，把 Flutter 版本钱包从“跑起来”讲到“可持续工程化演进”。

---

## 0. 阅读说明

这份文档聚焦“代码事实”：

- 每个关键结论都尽量对应具体文件
- 重点流程给出真实代码结构
- 同时标出当前实现边界与生产化缺口

如果你是新同学，建议按 1 -> 12 顺序阅读；如果你是负责人，可直接看第 10 章路线图。

---

## 1. 项目定位与当前成熟度

`wallet-flutter` 是 `wallet-clean` 的 Flutter 映射工程，目标是功能域对齐而不是重写 RN 项目。

当前成熟度（基于代码）：

- 已接入真实链路：
  - 钱包创建/导入（BIP39/BIP32 派生）
  - 主币余额查询（RPC）
  - 主币发送广播（RPC）
- 已具备完整框架：
  - 多钱包、网络与代币管理
  - dApp 浏览器、书签、历史、会话模型
  - DeFi/NFT/投资组合/硬件钱包模块页面
- 待生产化：
  - ERC-20 余额与发送
  - 交易回执状态机
  - 风控与审批链路
  - WalletConnect v2 正式协议栈

参考文档索引：`wallet-flutter/docs/README.md`

---

## 2. 快速启动与最小验证路径

```bash
flutter pub get
flutter run
```

建议最小验证路径：

1. 欢迎页 -> 创建钱包
2. 首页查看地址与总资产
3. 发送页提交主币交易
4. 进入交易历史页查看记录
5. 设置页切换主题、触发生物识别

这个流程覆盖：路由、状态初始化、密码学、RPC、价格、设置持久化。

---

## 3. 启动链路深读：Provider 注入与流程门禁

## 3.1 main -> app

`wallet-flutter/lib/main.dart`：

```dart
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const WalletApp());
}
```

`wallet-flutter/lib/app.dart`：

```dart
return ChangeNotifierProvider(
  create: (_) => WalletAppState()..init(),
  child: Consumer<WalletAppState>(
    builder: (context, appState, _) {
      return MaterialApp(
        onGenerateRoute: buildRoute,
        initialRoute: Routes.root,
      );
    },
  ),
);
```

要点：`..init()` 让状态层在应用启动时立即恢复持久化数据。

## 3.2 RootScreen 门禁

`wallet-flutter/lib/screens/root_screen.dart`：

```dart
Navigator.pushReplacementNamed(
  context,
  appState.hasWallet ? Routes.home : Routes.welcome,
);
```

这是标准 **Flow Gating**（按钱包存在性分流）。后续接入“锁屏态”也应该在这里扩展。

---

## 4. 架构分层与数据流

结合 `docs/02_architecture.md` 与代码，分层如下：

- UI 层：`lib/screens/*`、`lib/widgets/common.dart`
- 状态层：`lib/state/wallet_app_state.dart`
- 模型层：`lib/models/models.dart`
- 服务层：`lib/services/*.dart`
- 基础设施：`flutter_secure_storage`、`shared_preferences`

主数据流：

```text
UI -> WalletAppState action -> Service -> RPC/API/Storage
   <- notifyListeners + rebuild
```

这是 Flutter/Provider 体系下非常典型的“单向业务流 + 响应式刷新”。

---

## 5. 核心域深读（结合关键代码）

## 5.1 钱包密码学：WalletCryptoService

文件：`wallet-flutter/lib/services/wallet_crypto_service.dart`

核心逻辑：

```dart
final mnemonic = bip39.generateMnemonic(strength: words == 24 ? 256 : 128);
final seed = bip39.mnemonicToSeed(mnemonic);
final root = bip32.BIP32.fromSeed(seed);
final child = root.derivePath("m/44'/60'/0'/0/0");
```

导入逻辑会优先识别私钥格式，否则按助记词校验：

```dart
if (_isPrivateKey(text)) {
  final credentials = EthPrivateKey.fromHex(normalized);
}

if (!bip39.validateMnemonic(text)) {
  throw Exception('助记词格式不正确');
}
```

这个实现路径是 EVM 钱包的常规实现，并且将输入归一化逻辑做在服务层，页面层无需关心密码学细节。

## 5.2 链上服务：EvmService

文件：`wallet-flutter/lib/services/evm_service.dart`

主币余额：

```dart
final etherAmount = await client.getBalance(EthereumAddress.fromHex(address));
return etherAmount.getValueInUnit(EtherUnit.ether);
```

主币交易发送：

```dart
final txHash = await client.sendTransaction(
  credentials,
  Transaction(
    to: EthereumAddress.fromHex(to),
    value: EtherAmount.fromBase10String(EtherUnit.ether, amount.toString()),
  ),
  chainId: chainId,
  fetchChainIdFromNetworkId: false,
);
```

这里采用 `try/finally` 释放 client，是正确的资源管理实践。

## 5.3 状态中枢：WalletAppState（重点）

文件：`wallet-flutter/lib/state/wallet_app_state.dart`

它统一维护：

- 钱包：`accounts/currentAccount`
- 网络：`networks/currentNetwork`
- 资产：`tokens`
- 交易：`transactions`
- dApp：`bookmarks/history/dappSessions`
- 安全设置：`biometricEnabled/autoLockMinutes`

初始化路径（持久化恢复）包含两类存储：

- `flutter_secure_storage`：账户等敏感数据
- `shared_preferences`：主题、网络、交易历史、书签等

关键初始化代码结构：

```dart
final rawAccounts = await _secureStorage.read(key: _secureAccountsKey);
final rawNetworks = prefs.getString(_networksKey);
final txRaw = prefs.getString(_txKey);
```

发送交易动作是状态层编排服务层的典型用法：

```dart
final txHash = await EvmService.sendNativeTransaction(...);
transactions.insert(0, tx);
await _saveTransactions();
await refreshPortfolio();
notifyListeners();
```

这段很关键：它保证“发送成功后，状态与持久化同时更新”。

## 5.4 价格服务：PriceService

文件：`wallet-flutter/lib/services/price_service.dart`

当前实现是轻量映射模型：

```dart
final uri = Uri.parse('$_base?ids=${ids.join(',')}&vs_currencies=usd');
```

代币映射采用内置 switch：

```dart
switch (s.toUpperCase()) {
  'ETH' => 'ethereum',
  'USDC' => 'usd-coin',
  'ARB' => 'arbitrum',
}
```

这是“先可用后扩展”的典型做法，但生产化阶段必须增加缓存、限流与重试。

## 5.5 路由体系：Routes + buildRoute

文件：`wallet-flutter/lib/ui/routes.dart`

结构特点：

- `Routes` 常量集中声明
- `buildRoute` 单点映射
- 页面跳转统一使用命名路由

这个设计在中小项目中维护成本低，适合当前阶段。

---

## 6. UI 架构与组件层实践

## 6.1 HomeScreen 的信息架构

文件：`wallet-flutter/lib/screens/home_screen.dart`

首页结构是典型“钱包控制台”：

- 顶部动作（搜索、设置）
- 资产 Hero 卡
- 资产列表
- 模块快捷入口

拉取刷新直接绑定状态层：

```dart
onRefresh: () => context.read<WalletAppState>().refreshPortfolio(),
```

## 6.2 通用组件层

文件：`wallet-flutter/lib/widgets/common.dart`

沉淀了：

- `ScreenShell`（页面壳）
- `SectionCard`（统一卡片容器）
- `HeroBalanceCard`（品牌风格资产卡）
- `StatTile`、`EmptyHint`

这是 **Design System Lite** 的基础。后续可继续抽 token（间距、圆角、排版）。

## 6.3 主题系统

文件：`wallet-flutter/lib/core/theme.dart`

特点：

- 浅色/深色双主题
- 统一绿色系视觉语言
- 输入框、按钮、卡片风格集中定义

这种“主题集中管理”可以有效避免页面内联样式散落。

---

## 7. 设计模式与架构决策（代码映射）

1. **Single Source of Truth**
   - `WalletAppState` 作为状态单点。

2. **Facade/Adapter**
   - `EvmService`、`WalletCryptoService`、`PriceService` 封装第三方库细节。

3. **DTO + Serialization**
   - `models.dart` 全量 `toMap/fromMap`，便于本地持久化和未来接口对接。

4. **Progressive Enhancement**
   - 先完成主币链路，再逐步接 ERC-20、风控、协议栈。

5. **Fail-soft UX**
   - `lastSyncError` 提示失败但不阻塞主流程。

---

## 8. 关键风险与当前短板

## 8.1 状态层过载

`WalletAppState` 体量较大，承担了过多职责（账户、网络、资产、交易、dApp、设置）。

风险：

- 修改一个域可能影响全局 rebuild
- 单文件维护成本持续上升

## 8.2 交易状态一致性

当前发送后主要记录 pending，receipt 自动更新链路不足。

风险：

- 用户可能长期看到 pending
- 失败交易无法及时反馈

## 8.3 价格与同步鲁棒性

`PriceService` 当前较轻，缺少：

- 缓存
- 限流
- 重试

风险：第三方接口波动时用户体验下降明显。

## 8.4 安全能力缺口

当前已具备基础生物识别能力，但仍缺：

- dApp 风险域名判断
- 交易模拟与可读化审批
- 会话权限粒度控制

---

## 9. 从入门到高级的实战路径

## 9.1 入门（1-2 天）

- 跑通应用并完成一笔主币发送
- 阅读 `main.dart`、`app.dart`、`root_screen.dart`
- 阅读 `wallet_app_state.dart` 的 `init/createWallet/send`

## 9.2 进阶（3-5 天）

- 深读 `wallet_crypto_service.dart`、`evm_service.dart`
- 增加一个网络并完成切换
- 增加一个代币价格映射并验证资产估值变化

## 9.3 高级（1-2 周）

- 实现 ERC-20 余额查询与发送
- 实现交易回执轮询与状态更新
- 增加状态层测试（关键 action）和服务层 mock 测试

---

## 10. 生产化改造路线图（建议优先级）

P0（先做）

1. 拆分 `WalletAppState`（至少拆 Wallet/Portfolio/Dapp/Settings）
2. 补齐交易状态机与回执同步
3. 给价格服务补缓存 + 限流 + 重试

P1（随后）

1. ERC-20 全链路（余额、发送、精度、失败重试）
2. dApp 权限系统（按链/账户/方法）
3. 安全审批页（交易模拟 + 风险标签）

P2（长期）

1. 持久化从 JSON 向结构化数据库演进
2. CI 自动化（analyze + unit + integration）
3. 可观测体系（日志分级、埋点、崩溃上报）

---

## 11. 测试策略（结合现状）

依据 `wallet-flutter/docs/06_test_report.md`，当前已有：

- `flutter analyze` 通过
- `dart test test/pure_models_test.dart` 通过
- iOS 模拟器运行验证通过

建议扩展测试矩阵：

1. 模型层：序列化反序列化不变式
2. 服务层：RPC/价格 mock
3. 状态层：关键 action 行为测试
4. 集成层：创建钱包 -> 切网 -> 发送 -> 历史更新

---

## 12. 关键文件索引（建议阅读顺序）

1. `wallet-flutter/lib/main.dart`
2. `wallet-flutter/lib/app.dart`
3. `wallet-flutter/lib/screens/root_screen.dart`
4. `wallet-flutter/lib/state/wallet_app_state.dart`
5. `wallet-flutter/lib/services/wallet_crypto_service.dart`
6. `wallet-flutter/lib/services/evm_service.dart`
7. `wallet-flutter/lib/services/price_service.dart`
8. `wallet-flutter/lib/ui/routes.dart`
9. `wallet-flutter/lib/models/models.dart`
10. `wallet-flutter/lib/widgets/common.dart`

---

## 13. 结语

`wallet-flutter` 已经具备“真实链路 + 完整框架”的底座，下一阶段要从“功能完整”转向“工程完整”：

- 状态拆分
- 交易一致性
- 安全审批
- 自动化测试

把这四个点做扎实，项目就能从“可演示”升级为“可生产迭代”。
