# React Native 钱包项目：入门到进阶（代码深度版）

适用目录：`wallet-clean`

本文是“深度导读版”，重点回答三件事：

1. 这个 RN 钱包项目是如何真正运作的
2. 哪些代码已经接近生产级，哪些只是框架态
3. 如何从当前状态演进到可持续迭代的工程化架构

---

## 1. 先看全局：项目分层与真实能力边界

## 1.1 分层

```text
App.tsx
  -> navigation (Root/Auth/Main)
  -> screens (交互编排)
    -> store (状态)
      -> services (业务规则)
        -> RPC/API/SecureStorage (外部依赖)
```

目录映射：

- 页面：`wallet-clean/src/screens`
- 状态：`wallet-clean/src/store`
- 服务：`wallet-clean/src/services`
- 导航：`wallet-clean/src/navigation`
- 主题：`wallet-clean/src/theme`

## 1.2 能力边界（必须明确）

已具备真实链路能力：

- 助记词/私钥钱包创建导入（`WalletService`）
- 主币与 ERC-20 基础余额读取（`TokenService` + `RPCService`）
- 主币与 ERC-20 交易签名广播（`TransactionService`）
- WalletConnect v2（含降级本地模式）

框架态或半成品能力：

- 交易状态更新索引与轮询（`updateTransactionStatus` 仍占位）
- 硬件钱包（`HardwareWalletService` 多处 `TODO`）
- 风险引擎属于轻量版（`SecurityService`）

---

## 2. 启动链路：App 初始化、Deep Link、流程门禁

## 2.1 `App.tsx` 启动职责

关键代码（`wallet-clean/App.tsx`）：

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

这段做了三件正确的事：

- 基础设施初始化上收根节点
- WalletConnect 支持失败兜底
- Deep Link 统一入口处理，避免页面重复监听

## 2.2 `RootNavigator` 门禁

关键代码（`wallet-clean/src/navigation/RootNavigator.tsx`）：

```tsx
await loadWallets();
...
{!currentWallet ? <AuthNavigator /> : <MainNavigator />}
```

这是典型 **Flow Gating**：

- 无钱包 -> 认证流
- 有钱包 -> 主流程

后续如接入“应用锁”可在这里扩展为：

`!currentWallet ? Auth : !isUnlocked ? Lock : Main`

---

## 3. 钱包核心域：密码学、存储、状态

## 3.1 助记词生成与派生

关键代码（`wallet-clean/src/services/WalletService.ts`）：

```ts
const entropyLength = length === MnemonicLength.TWELVE ? 16 : 32;
const entropy = await Crypto.getRandomBytesAsync(entropyLength);
const mnemonic = bip39.entropyToMnemonic(entropy, wordlist);
```

派生路径：

```ts
const seed = await bip39.mnemonicToSeed(mnemonic);
const hdKey = HDKey.fromMasterSeed(seed);
const derivedKey = hdKey.derive(DERIVATION_PATH);
```

结论：满足 BIP39 + BIP32 的标准派生流程。

## 3.2 地址生成实现

`getAddressFromPrivateKey` 的实现路径：

```ts
const publicKey = secp.getPublicKey(privateKey, false);
const publicKeyHash = keccak_256(publicKey.slice(1));
const address = publicKeyHash.slice(-20);
```

这是 EVM 地址生成主流实现。

## 3.3 存储策略

`StorageService`（`wallet-clean/src/services/StorageService.ts`）统一封装 secure store：

```ts
await SecureStore.setItemAsync(this.getKey(key), value);
```

优点：

- 调用方不直接接触平台 API
- 键名前缀统一，迁移成本低
- 敏感数据集中入口，便于审计

## 3.4 Store 协作

`walletStore` 主要做状态生命周期管理，不做密码学逻辑：

```ts
const wallet = await WalletService.createWallet({ name, mnemonic });
const wallets = await WalletService.getAllWallets();
set({ wallets, currentWallet: wallet, isLoading: false });
```

这符合“服务管规则、store 管状态”的职责边界。

---

## 4. 交易域深读：从输入到广播

## 4.1 交易构建

`TransactionService.buildTransaction` 自动补齐链上必要字段：

```ts
const nonce = params.nonce ?? await RPCService.getTransactionCount(params.from, chainId);
const feeData = await RPCService.getFeeData(chainId);
const gasLimit = await RPCService.estimateGas(...);
```

构建 EIP-1559 交易：

```ts
type: 2,
maxFeePerGas,
maxPriorityFeePerGas,
chainId,
```

## 4.2 签名与广播

```ts
const privateKey = await WalletService.getWalletPrivateKey(walletId);
const signer = new ethers.Wallet(privateKeyHex);
const signedTx = await signer.signTransaction(tx);
const txHash = await RPCService.sendRawTransaction(signedTx, chainId);
```

## 4.3 发送页如何驱动服务层

`SendScreen`（`wallet-clean/src/screens/Send/SendScreen.tsx`）做了合理的“前置校验 + 二次确认”：

- 地址格式校验 `isValidAddress`
- 金额校验与余额校验
- Gas 预估（防抖）
- ReviewSheet 二次确认

关键行为：

```ts
const estimate = await TransactionService.estimateGas(...);
...
const txHash = await TransactionService.sendTransaction(...);
```

这是正确的分工：页面做交互与校验，服务做链上编排。

## 4.4 当前缺口：交易状态机

`updateTransactionStatus` 仍为占位：

```ts
console.log(`更新交易状态: ${txHash} -> ${status}`);
```

必须补齐，否则历史页状态容易失真。

推荐改造：

1. 本地 `tx_index`：`txHash -> ownerAddress`
2. 后台轮询 receipt
3. 状态枚举扩展：`pending|confirmed|failed|replaced|cancelled`

---

## 5. 资产域深读：余额、价格、估值

## 5.1 余额读取

`TokenService`：

```ts
const balanceWei = await RPCService.getBalance(address, chainId);
const balanceFormatted = ethers.formatEther(balanceWei);
```

ERC-20：

```ts
const balance = await RPCService.getTokenBalance(address, token.address, chainId);
const balanceFormatted = ethers.formatUnits(balance, token.decimals);
```

## 5.2 `tokenStore` 的域模型

`tokenStore` 管：

- 默认代币
- 自定义代币
- 隐藏代币
- 余额与价格

并发加载余额：

```ts
await Promise.all(tokens.map(async token => { ... }));
```

## 5.3 `PriceService` 是当前最工程化模块之一

文件：`wallet-clean/src/services/PriceService.ts`

已实现：

- 缓存（新鲜/过期）
- 请求去重（pending map）
- 队列化执行
- 最小请求间隔
- 429 退避重试

典型代码：

```ts
private static pendingRequests = new Map<string, Promise<any>>();
private static requestQueue: QueueItem[] = [];
private static MIN_REQUEST_INTERVAL = 2500;
```

这是典型 **Resilience Pattern**，可直接作为其他外部 API 模块模板。

---

## 6. dApp 与安全域：WalletConnect + 轻量风控

## 6.1 WalletConnectService 的核心架构

文件：`wallet-clean/src/services/WalletConnectService.ts`

关键设计：

- 在线模式：真实 SDK
- 本地模式：缺 Project ID 时降级
- 会话持久化：`walletconnect_sessions`
- 待处理请求队列：`pendingRequests`

降级关键代码：

```ts
if (!projectId) {
  this.localMode = true;
  this.initialized = true;
  await this.loadSessionsFromStorage();
  return;
}
```

## 6.2 请求审批链路

`DAppConnectionsScreen`（`wallet-clean/src/screens/DApp/DAppConnectionsScreen.tsx`）内对请求做可视化审批：

```ts
const summary = SecurityService.summarizeWalletConnectRequest({ ... });
...
await WalletConnectService.approveRequest(request.id);
```

## 6.3 SecurityService 当前能力

`wallet-clean/src/services/SecurityService.ts` 已做：

- URL 风险评估（协议、短链、punycode、关键词）
- 方法签名可读化（approve/setApprovalForAll 等）
- 请求级风险报告

例如对 `approve` 给出高风险提示，属于正确方向。

但注意：当前仍是“轻量规则引擎”，并非情报驱动的生产风控系统。

---

## 7. Swap、NFT、Portfolio、Hardware：完成度拆解

## 7.1 Swap（可用）

`SwapService` 已具备：

- 多链 router 配置
- 路径探测（直连/经 wrapped native）
- 授权与执行交易编码

风险点：

- `approveMax` 无限授权提示需更强
- 报价到执行期间价格漂移需要强约束

## 7.2 NFT（基础可用）

`NFTService` 已具备：

- NFT 列表、详情、集合信息拉取
- ERC721/ERC1155 转账 data 构建
- IPFS/Arweave URL 解析

风险点：

- API Key 与限流管理
- 图片资源安全与网关降级

## 7.3 Portfolio（有框架，需优化）

`PortfolioService` 已做快照、统计、收益计算、图表数据生成。

注意：

- 当前按 token 逐个拉取，性能可进一步优化（批量请求/缓存）
- 快照与交易关联模型还可更严谨

## 7.4 Hardware（框架态）

`HardwareWalletService` 多个核心方法为 TODO：

- `scanDevices`
- `signTransaction`
- `signMessage`

当前可视为“接口契约已定义，SDK 尚未接入”。

---

## 8. 设计模式映射（结合代码）

1. Facade
   - `StorageService`、`RPCService`

2. Domain Service
   - `WalletService`、`TransactionService`、`SwapService`、`SecurityService`

3. Pipeline/Orchestration
   - 交易发送、资产刷新、会话审批

4. State Container
   - 多个 Zustand store 按域拆分

5. Graceful Degradation
   - WalletConnect 在线/离线模式切换

---

## 9. 从入门到进阶：建议任务路径

## 9.1 入门（1-2 天）

- 跑通创建钱包和发送页
- 阅读：`App.tsx`、`RootNavigator.tsx`、`walletStore.ts`

## 9.2 进阶（3-5 天）

- 深读：`WalletService.ts`、`TransactionService.ts`、`RPCService.ts`
- 手动触发交易发送并观察 nonce、gas、hash

## 9.3 高级（1-2 周）

- 完成交易状态机
- 增强 dApp 权限控制
- 给 Price/Tx/WalletConnect 增加测试

---

## 10. 生产化改造清单（优先级）

P0：

1. 交易状态一致性（回执轮询 + replace 处理）
2. dApp 请求权限模型（方法/账户/链）
3. 错误分级（用户提示 vs 开发日志）

P1：

1. Repository 层抽象
2. 风险数据源接入（phishing feed）
3. 集成测试（关键流程）

P2：

1. 数据层升级（结构化存储）
2. 可观测（埋点 + 崩溃 + 性能）
3. 硬件钱包 SDK 正式接入

---

## 11. 关键文件阅读顺序

1. `wallet-clean/App.tsx`
2. `wallet-clean/src/navigation/RootNavigator.tsx`
3. `wallet-clean/src/services/WalletService.ts`
4. `wallet-clean/src/services/TransactionService.ts`
5. `wallet-clean/src/services/RPCService.ts`
6. `wallet-clean/src/services/PriceService.ts`
7. `wallet-clean/src/services/WalletConnectService.ts`
8. `wallet-clean/src/services/SecurityService.ts`
9. `wallet-clean/src/screens/Send/SendScreen.tsx`
10. `wallet-clean/src/screens/DApp/DAppConnectionsScreen.tsx`

---

## 12. 总结

这个 RN 钱包项目已经具备“可跑通真实关键链路”的基础，不是纯展示工程。下一步要把“能运行”升级到“能长期维护”，关键是三件事：

- 交易状态一致性
- dApp 风险与权限治理
- 自动化测试与可观测

这三项做深之后，项目会从“功能齐”变成“工程稳”。
