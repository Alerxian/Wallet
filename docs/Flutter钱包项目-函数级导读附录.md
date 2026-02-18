# Flutter 钱包项目函数级导读附录

适用目录：`wallet-flutter`

用途：按“函数粒度”给出阅读与测试清单，便于新人上手、任务拆分和 code review。

---

## 1. 启动与路由函数

## 1.1 `main()`

- 位置：`wallet-flutter/lib/main.dart`
- 输入：无
- 输出：无
- 行为：确保 Flutter 绑定初始化后启动 `WalletApp`

## 1.2 `WalletApp.build(context)`

- 位置：`wallet-flutter/lib/app.dart`
- 行为：
  - 注入 `ChangeNotifierProvider`
  - 创建 `WalletAppState()..init()`
  - 构建 `MaterialApp`（主题、路由、locale）
- 测试点：
  - `themeMode` 更新是否实时生效
  - 初始路由是否正确

## 1.3 `buildRoute(settings)`

- 位置：`wallet-flutter/lib/ui/routes.dart`
- 输入：`RouteSettings`
- 输出：`Route<dynamic>`
- 行为：按 `settings.name` 映射页面
- 测试点：未知路由回退 `RootScreen`

## 1.4 `RootScreen.build(context)`

- 位置：`wallet-flutter/lib/screens/root_screen.dart`
- 行为：根据 `appState.hasWallet` 跳转 `Routes.home` 或 `Routes.welcome`
- 测试点：
  - 首装无钱包跳 welcome
  - 导入/创建后重启跳 home

---

## 2. 状态层核心函数（`WalletAppState`）

文件：`wallet-flutter/lib/state/wallet_app_state.dart`

## 2.1 `init()`

- 输入：无
- 输出：`Future<void>`
- 副作用：
  - 从 `SharedPreferences` 恢复 theme/banner/security/network/tx/dapp
  - 从 `FlutterSecureStorage` 恢复账户与当前账户
  - 初始化默认网络、默认书签、演示 token
  - 若有当前钱包则触发 `refreshPortfolio()`
- 测试点：
  - 空存储首次初始化
  - 历史数据恢复完整性

## 2.2 `createWallet({words, name})`

- 依赖：`WalletCryptoService.createWallet`
- 行为：创建账户、写 secure storage、设置 current、刷新资产
- 风险：创建后立即刷新，RPC 异常可能影响首次体验

## 2.3 `importWallet(secret, {name})`

- 依赖：`WalletCryptoService.importFromInput`
- 行为：导入账户并持久化、刷新资产
- 测试点：
  - 私钥路径
  - 助记词路径

## 2.4 `switchAccount(id)` / `deleteAccount(id)`

- 行为：切换当前账户或删除账户并同步 current
- 测试点：删除当前账户时是否正确回退到第一个账户/null

## 2.5 `switchNetwork(chainId)` / `toggleNetwork(chainId, enabled)` / `addCustomNetwork(network)`

- 行为：网络切换和启停、持久化网络列表
- 测试点：
  - 当前网络被禁用时自动回退逻辑
  - 自定义网络重启后恢复

## 2.6 `send({to, amount, symbol, note})`

- 依赖：`EvmService.sendNativeTransaction`
- 行为：
  - 校验钱包与网络
  - 仅允许主币发送
  - 广播交易后写入本地历史并刷新资产
- 异常：地址/数量/网络未初始化/非主币
- 测试点：
  - 主币发送成功路径
  - 非主币发送报错路径

## 2.7 `refreshPortfolio()`

- 行为：
  - 读取主币余额
  - 拉取价格
  - 回写 token balance 与 price
  - 更新 `syncingPortfolio/lastSyncError`
- 测试点：
  - 网络异常时 `lastSyncError` 是否写入
  - finally 中 `syncingPortfolio` 必归位

## 2.8 dApp 相关函数

- `addBookmark/removeBookmark`
- `addHistory`
- `connectDappSession/disconnectDappSession`

关键行为：`addHistory` 去重并限制最多 100 条。

## 2.9 安全与设置函数

- `updateTheme`
- `setShowWelcomeBanner`
- `setBiometricEnabled`
- `setAutoLockMinutes`
- `authenticate`

`authenticate` 先检查设备支持，再触发生物识别。

## 2.10 `clearAll()`

- 行为：清空内存态 + 清理 secure/prefs 数据
- 风险：这是破坏性操作，UI 必须有二次确认

---

## 3. 密码学服务函数（`WalletCryptoService`）

文件：`wallet-flutter/lib/services/wallet_crypto_service.dart`

## 3.1 `createWallet({words})`

- 输入：词数（12/24）
- 输出：`CreatedWallet { address, privateKeyHex, mnemonic }`
- 核心：`mnemonic -> seed -> bip32 derivePath -> EthPrivateKey`

## 3.2 `importFromInput(input)`

- 输入：助记词或私钥字符串
- 输出：`ImportedWallet`
- 分支：
  - 私钥：`EthPrivateKey.fromHex`
  - 助记词：校验后派生

## 3.3 `_isPrivateKey(value)`（私有）

- 行为：正则匹配 64 位十六进制

## 3.4 `_bytesToHex(bytes)`（私有）

- 行为：字节转 `0x` 前缀十六进制

---

## 4. 链交互服务函数（`EvmService`）

文件：`wallet-flutter/lib/services/evm_service.dart`

## 4.1 `_client(rpcUrl)`（私有）

- 输出：`Web3Client`

## 4.2 `getNativeBalance({rpcUrl, address})`

- 输出：`double`（ether 单位）
- 注意：采用浮点返回，展示方便但精度场景需谨慎

## 4.3 `sendNativeTransaction({rpcUrl, chainId, privateKeyHex, to, amount})`

- 输出：交易哈希
- 关键参数：`fetchChainIdFromNetworkId: false`

## 4.4 `fetchTxReceiptAsModel({rpcUrl, tx})`

- 输出：`WalletTransaction?`
- 行为：若 receipt 为空返回 null
- 用途：可作为后续轮询状态机基础

---

## 5. 价格服务函数（`PriceService`）

文件：`wallet-flutter/lib/services/price_service.dart`

## 5.1 `fetchUsdPrices(symbols)`

- 输入：symbol 列表
- 输出：`Map<String, double>`
- 行为：先做 symbol->CoinGecko ID 映射，再请求 simple price

## 5.2 `_toCoinGeckoIds(symbols)`（私有）

- 当前内置映射：ETH/USDC/ARB

## 5.3 `_symbolFromId(id)`（私有）

- 将 API 返回 id 转回 symbol

建议测试点：

- 未支持 symbol 返回空映射
- 接口失败返回空 map 不抛异常

---

## 6. 页面函数（高频业务页）

## 6.1 `home_screen.dart`

- `build(context)`：读取 `WalletAppState`，渲染资产、快捷入口、刷新状态
- 刷新动作：`refreshPortfolio`

## 6.2 `send_screen.dart`

- `build(context)`：校验地址和数量，必要时走生物识别
- 提交动作：`appState.send(...)`

关键点：文案写“模拟广播”，但实际调用了真实主币广播，建议后续修正文案。

## 6.3 `tx_history_screen.dart`

- `_status(status)`：状态图标映射
- `build(context)`：渲染交易列表与时间/网络/Gas/Nonce

## 6.4 `dapp_browser_screen.dart`

- `_open(input)`：URL 规范化后 `loadRequest`
- `onPageFinished`：更新标题并写历史
- 连接动作：`connectDappSession`（当前模拟）

## 6.5 `settings_screen.dart`

- 主题切换、生物识别开关、自动锁定设置
- `authenticate` 手动触发验证
- 清空数据：`clearAll` 后回 welcome

---

## 7. 模型与编解码函数（`models.dart`）

文件：`wallet-flutter/lib/models/models.dart`

关键模型函数类型：

- `toMap/fromMap`
- `copyWith`（如 `NetworkConfig.copyWith`）
- 列表编解码：
  - `encodeTxList/decodeTxList`
  - `encodeBookmarks/decodeBookmarks`
  - `encodeHistory/decodeHistory`
  - `encodeNetworks/decodeNetworks`

测试关注：

- 序列化回环不丢字段
- 枚举字段（如 `TxStatus`）解析稳定

---

## 8. 推荐函数级测试清单

P0：

1. `WalletCryptoService.createWallet/importFromInput`
2. `WalletAppState.send/refreshPortfolio/init`
3. `EvmService.sendNativeTransaction/fetchTxReceiptAsModel`
4. `PriceService.fetchUsdPrices`

P1：

1. `addHistory` 去重与 100 条上限
2. `toggleNetwork` 当前网络回退逻辑
3. `clearAll` 清理完整性

---

## 9. 结论

这份附录可直接作为任务拆分模板：

- 新功能开发时先标注涉及函数
- 代码评审时按“输入/输出/副作用/异常”四要素检查
- 测试编写时按本附录优先级落地

这样可以显著降低状态耦合与回归风险。
