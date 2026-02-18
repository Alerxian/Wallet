# React Native 钱包项目：从入门到进阶（深度版）

> 适用项目：`wallet-clean`
>
> 目标：不是只告诉你“怎么跑”，而是结合真实代码，把**架构、关键流程、设计模式、风险点、演进路线**讲透。

---

## 0. 阅读说明（先看这个）

这份文档按“先全局后细节”组织：

1. 先理解项目边界与当前成熟度
2. 再理解启动链路与架构分层
3. 再逐个拆核心域（钱包、交易、资产、dApp、Swap、NFT）
4. 最后给出生产化改造路线与任务拆分

如果你是新同学，建议按顺序读；如果你是负责人，可直接看第 10 章“生产化改造路线图”。

---

## 1. 项目定位与能力成熟度

项目定位：对齐 Rabby 功能域的钱包应用，技术栈为 React Native + Expo + TypeScript。

当前能力分级（基于代码而非口号）：

- L3（可用）：钱包创建/导入、多钱包、主币交易、基础多链、资产展示
- L2（可演示）：dApp 连接、Swap、NFT、投资组合、硬件钱包（部分模块偏框架态）
- L1（待生产化）：风险引擎、授权扫描、交易模拟、完整回执状态机、系统化测试与可观测

核心代码分布：

- 启动与流程：`wallet-clean/App.tsx`、`wallet-clean/src/navigation/RootNavigator.tsx`
- 领域服务：`wallet-clean/src/services/*.ts`
- 状态容器：`wallet-clean/src/store/*.ts`
- 页面编排：`wallet-clean/src/screens/*`

---

## 2. 快速启动与最小验证路径

## 2.1 启动命令

```bash
pnpm install
npm run ios
# 或 npm run android / npm run web
```

## 2.2 最小功能验证（建议按这个顺序）

1. 欢迎页 -> 创建钱包
2. 查看首页地址与资产卡片
3. 进入发送页，尝试主币发送
4. 查看交易历史
5. 进入设置页切换主题

这个路径覆盖：导航、store 初始化、钱包派生、RPC、价格、主题五个主链路。

---

## 3. 启动链路深读：App Shell、流程门禁与 Deep Link

入口在 `wallet-clean/App.tsx`，关键逻辑：

```tsx
useEffect(() => {
  init();

  WalletConnectService.init(WALLETCONNECT_PROJECT_ID).catch(() => undefined);

  const handleUrl = async ({ url }: { url: string }) => {
    if (!url.startsWith("wc:")) return;
    await WalletConnectService.init(WALLETCONNECT_PROJECT_ID);
    await WalletConnectService.pair(url);
  };

  const sub = Linking.addEventListener("url", handleUrl);
  return () => sub.remove();
}, []);
```

这段代码体现了三个架构原则：

- **基础设施前置**：设置、WalletConnect、Deep Link 在根层完成，页面不处理底层初始化。
- **故障降级意识**：`init().catch` 容错，不让单点失败阻塞应用启动。
- **事件统一入口**：外部 URI 统一在 App 入口处理，避免多页面重复监听。

`RootNavigator` 再做流程门禁：

```tsx
const { currentWallet, loadWallets } = useWalletStore();
useEffect(() => {
  const init = async () => {
    await loadWallets();
    setIsReady(true);
  };
  init();
}, []);

return (
  <NavigationContainer>
    {!currentWallet ? <AuthNavigator /> : <MainNavigator />}
  </NavigationContainer>
);
```

这是经典 **Flow Gating（流程门禁）**：

- 有钱包与无钱包是两条独立流程树
- 将来接入“已解锁/未解锁”时可在此继续扩展门禁条件

---

## 4. 架构分层与数据流（结合真实依赖）

目录分层：

- `screens/`：页面结构、交互控制
- `components/`：可复用 UI 基元
- `store/`：状态容器（Zustand）
- `services/`：业务编排 + 基础设施封装
- `navigation/`：路由树
- `theme/`：主题与设计令牌
- `types/`：类型契约

主数据流：

```text
UI event -> Store action -> Service orchestration -> RPC/API/Storage
         <-           state update + notify/re-render
```

其中最关键的工程策略是：**页面不直接拼底层请求，页面只发 action；服务层才是业务规则中心**。

---

## 5. 钱包域深读：密码学、存储与状态

## 5.1 WalletService 的核心职责

`wallet-clean/src/services/WalletService.ts` 做了钱包域几乎全部关键动作：

- 生成助记词 `generateMnemonic`
- 助记词/私钥导入 `importWallet`
- 钱包创建 `createWallet`
- 私钥导出 `exportPrivateKey`
- 当前钱包切换 `setCurrentWallet`

关键派生逻辑：

```ts
const seed = await bip39.mnemonicToSeed(mnemonic);
const hdKey = HDKey.fromMasterSeed(seed);
const derivedKey = hdKey.derive(DERIVATION_PATH);
```

地址生成关键逻辑：

```ts
const publicKey = secp.getPublicKey(privateKey, false);
const publicKeyHash = keccak_256(publicKey.slice(1));
const address = publicKeyHash.slice(-20);
```

这部分实现遵循 EVM 主流地址生成路径。

## 5.2 存储层设计：StorageService 作为 Facade

`wallet-clean/src/services/StorageService.ts` 将 `expo-secure-store` 统一封装：

```ts
static async setSecure(key, value) {
  await SecureStore.setItemAsync(this.getKey(key), value);
}
```

价值：

- 屏蔽平台差异（iOS Keychain / Android EncryptedSharedPreferences）
- 统一键规则（`STORAGE_PREFIX`）
- 未来替换存储介质时，不需要改业务代码

## 5.3 store 层与服务层协作

`walletStore` 不做密码学细节，只负责状态收敛：

```ts
createWallet: async (name, mnemonic) => {
  const wallet = await WalletService.createWallet({ name, mnemonic });
  const wallets = await WalletService.getAllWallets();
  set({ wallets, currentWallet: wallet, isLoading: false });
};
```

这符合 **Application Service + State Container** 分工：

- Service 处理业务规则
- Store 负责状态生命周期和 UI 绑定

---

## 6. 交易域深读：EIP-1559 流水线与当前缺口

## 6.1 交易发送的完整流水线

`wallet-clean/src/services/TransactionService.ts` 的发送流程：

```ts
const tx = await this.buildTransaction(params, chainId);
const signedTx = await this.signTransaction(tx, walletId);
const txHash = await RPCService.sendRawTransaction(signedTx, chainId);
await this.saveTransaction({ ... });
```

`buildTransaction` 内部会自动补齐 nonce / gas / fee：

```ts
const nonce = params.nonce ?? await RPCService.getTransactionCount(...);
const feeData = await RPCService.getFeeData(chainId);
const gasLimit = await RPCService.estimateGas(...);

const tx: ethers.TransactionRequest = {
  type: 2,
  maxFeePerGas: BigInt(...),
  maxPriorityFeePerGas: BigInt(...),
  chainId,
};
```

这是标准 EIP-1559 交易构建路径。

## 6.2 RPCService 的职责边界

`wallet-clean/src/services/RPCService.ts` 提供统一链上访问入口：

- provider 缓存
- balance/tokenBalance/tokenInfo
- feeData/estimateGas/nonce
- broadcast/receipt/wait

它本质是链访问 **Gateway/Adapter**，把 `ethers` 细节从业务域剥离。

## 6.3 当前关键缺口（必须正视）

`TransactionService.updateTransactionStatus` 仍是占位：

```ts
console.log(`更新交易状态: ${txHash} -> ${status}`);
```

影响：

- pending 到 confirmed/failed 的状态一致性不足
- 加速/取消（replace-by-fee）后的关系链未完整记录

建议优先改造：

1. 建立 `txHash -> address` 索引
2. 后台轮询 receipt
3. 引入状态机：pending -> confirmed/failed/replaced/cancelled

---

## 7. 资产域深读：链上余额 + 价格服务 + UI 聚合

## 7.1 余额与代币

`TokenService` 负责链上余额读取与金额转换：

```ts
const balance = await RPCService.getTokenBalance(
  address,
  token.address,
  chainId,
);
const balanceFormatted = ethers.formatUnits(balance, token.decimals);
```

`tokenStore` 负责批量加载与可见性管理：

- 默认代币列表（按链）
- 自定义代币增删
- 隐藏代币列表
- 并行加载余额

## 7.2 PriceService 的工程亮点（重点）

`wallet-clean/src/services/PriceService.ts` 是当前代码里工程化程度最高的模块之一。

它实现了：

- 新鲜缓存 + 过期降级缓存
- 同 key 请求去重
- 请求队列（串行化）
- 最小请求间隔控制
- 429 限流退避重试（含 jitter）

关键策略代码（简化）：

```ts
private static dedupeRequest<T>(key: string, fn: () => Promise<T>): Promise<T> { ... }
private static async enqueueRequest<T>(execute: () => Promise<T>): Promise<T> { ... }
private static async requestWithRetry<T>(fn, retries = 3): Promise<T> { ... }
```

这套策略极大降低了价格接口波动导致的 UI 抖动和异常报警。

## 7.3 首页聚合逻辑

`HomeScreen` 中将主币余额与代币余额估值合并：

```ts
const nativeValue = PriceService.calculateValue(nativeBalanceFormatted, nativePrice);
const tokenValue = visibleTokens.reduce((sum, token) => { ... }, 0);
const totalValue = nativeValue + tokenValue;
```

建议后续把这段“估值聚合”下沉到服务层，避免页面承担过多业务计算。

---

## 8. dApp 连接深读：WalletConnect 的实战设计

`wallet-clean/src/services/WalletConnectService.ts` 设计非常关键，建议逐段阅读。

## 8.1 初始化降级策略

```ts
if (!projectId) {
  this.localMode = true;
  this.initialized = true;
  await this.loadSessionsFromStorage();
  return;
}
```

优势：

- 配置缺失时仍可本地联调
- 不阻塞主应用流程

## 8.2 会话与请求管理

- 会话：`sessions: Map<string, WalletConnectSession>`
- 待审批请求：`pendingRequests: Map<number, SignRequest>`
- 订阅通知：`subscribeRequests(listener)`

这是“连接态 + 请求态”分离管理，便于 UI 分屏展示。

## 8.3 事件驱动审批链路

核心事件：

- `session_proposal`：连接提案审批
- `session_request`：签名/交易请求入队
- `session_delete`/`session_expire`：会话清理

审批方法分发（简化）：

```ts
if (method === 'eth_sendTransaction') result = await this.handleSendTransaction(req);
else if (method === 'personal_sign') result = await this.handlePersonalSign(req);
...
```

建议增强点：

- 增加方法级权限开关
- 增加地址白名单、金额阈值、风险标签

---

## 9. Swap、NFT 与多链：能力与边界

## 9.1 SwapService（链上路由逻辑）

`wallet-clean/src/services/SwapService.ts` 已实现：

- Router 配置（Uniswap/Pancake/QuickSwap）
- 路径探测（直连失败则经 wrapped native 中转）
- 授权检查与 `approveMax`
- 交易执行编码

路径策略关键逻辑：

```ts
try {
  const directAmounts = await router.getAmountsOut(amountIn, [from, to]);
} catch {
  const routedAmounts = await router.getAmountsOut(amountIn, [
    from,
    wrapped,
    to,
  ]);
}
```

生产环境注意：

- `approveMax` 需要风险提示（无限授权）
- 报价与执行之间可能滑点扩大，需二次确认

## 9.2 NFTService

`wallet-clean/src/services/NFTService.ts` 通过 Alchemy NFT API 获取列表/详情/集合。

关键边界：

- 依赖 API Key（`setApiKey`）
- 仅支持映射网络
- IPFS URL 做了网关转换

生产建议：

- 引入多网关回退
- 增加图片加载失败与恶意资源过滤策略

## 9.3 多链网络管理

`wallet-clean/src/config/networks.ts` + `networkStore.ts` 实现：

- 预置链配置
- 当前链切换持久化
- 自定义链存储

建议改造：

- `customNetworks` 应合并到统一 `getNetwork` 检索路径
- RPC 健康检查应在添加网络时即时校验

---

## 10. 设计模式与架构决策（代码映射）

1. **Facade**
   - `StorageService`、`RPCService`、`PriceService`
   - 意义：屏蔽底层依赖，减少调用方复杂度

2. **Domain Service**
   - `WalletService`、`TransactionService`、`SwapService`、`NFTService`
   - 意义：业务规则集中，页面保持轻量

3. **State Container + Observer**
   - Zustand 多 store
   - 意义：响应式更新 + 域隔离

4. **Pipeline Orchestration**
   - 交易发送、资产刷新
   - 意义：步骤固定、参数可变、便于插入审计与风控节点

5. **Graceful Degradation**
   - WalletConnect local mode
   - 意义：环境不完备时依然可调试可演示

---

## 11. 关键风险清单（结合当前代码）

## 11.1 安全风险

- dApp 请求审批粒度不够细
- 无限授权提醒需强化
- 交易模拟尚未形成完整闭环

## 11.2 一致性风险

- 交易状态更新占位导致历史状态可能失真
- 多 store 初始化顺序不当时可能出现短时数据错位

## 11.3 可维护性风险

- 部分页面聚合计算较重，建议服务化
- 部分模块“框架能力”和“生产能力”边界未在代码层显式标注

---

## 12. 从入门到进阶的实战路线（可执行）

## 12.1 入门（1-2 天）

- 跑通项目
- 阅读 `App.tsx`、`RootNavigator.tsx`、`walletStore.ts`
- 走通创建钱包与发送交易流程

## 12.2 进阶（3-5 天）

- 深读 `WalletService.ts`、`TransactionService.ts`、`RPCService.ts`
- 写一个“交易发送失败原因分类”工具函数
- 为 `PriceService` 增加单元测试

## 12.3 高级（1-2 周）

- 完成交易状态机与 receipt 同步
- 完成 dApp 请求权限模型（方法/链/账户）
- 接入风控策略（交易模拟 + 风险分）

---

## 13. 生产化改造路线图（建议优先级）

P0（先做）

1. 交易状态机 + 后台回执同步
2. dApp 请求审批增强（权限 + 风险）
3. 错误分级（用户可读 + 开发可观测）

P1（随后）

1. Repository 层抽象（RPC/API/Storage）
2. 安全与审计日志体系（脱敏）
3. 集成测试（创建钱包、发送、切网、dApp）

P2（长期）

1. 数据层升级（SQLite/增量同步）
2. 多链扩展与性能优化
3. 完整的安全模拟与授权管理中心

---

## 14. 关键文件索引（建议重点阅读顺序）

1. `wallet-clean/App.tsx`
2. `wallet-clean/src/navigation/RootNavigator.tsx`
3. `wallet-clean/src/store/walletStore.ts`
4. `wallet-clean/src/services/WalletService.ts`
5. `wallet-clean/src/services/TransactionService.ts`
6. `wallet-clean/src/services/RPCService.ts`
7. `wallet-clean/src/services/PriceService.ts`
8. `wallet-clean/src/services/WalletConnectService.ts`
9. `wallet-clean/src/services/SwapService.ts`
10. `wallet-clean/src/store/tokenStore.ts`

---

## 15. 结语

`wallet-clean` 已经不是“纯 UI demo”，而是具备真实钱包核心链路的工程基础。当前最重要的不是继续堆功能页面，而是把三件事做深：

- 交易一致性
- 安全审批与风控
- 自动化测试与可观测

把这三件事补齐后，这个项目就可以从“可运行”真正迈向“可生产、可持续迭代”。
