# React Native 钱包项目函数级导读附录

适用目录：`wallet-clean`

用途：给研发同学做“逐函数阅读”的速查手册。每个函数都标明输入、输出、副作用、异常与测试关注点。

---

## 1. 启动与流程门禁

## 1.1 `App.tsx`

`useEffect(init + deep link)`

- 位置：`wallet-clean/App.tsx`
- 输入：无（组件挂载触发）
- 输出：无
- 副作用：
  - 初始化 `settingsStore.init()`
  - 初始化 `WalletConnectService.init()`
  - 监听 `Linking` URL 事件
- 异常处理：WalletConnect 初始化失败会被捕获，不阻塞启动
- 测试关注：
  - `wc:` 链接能否触发 `pair`
  - 非 `wc:` 链接是否被忽略

## 1.2 `RootNavigator.tsx`

`loadWallets()`（在 `useEffect` 调用）

- 位置：`wallet-clean/src/navigation/RootNavigator.tsx`
- 输入：无
- 输出：无
- 副作用：读取本地钱包列表并更新全局 `walletStore`
- 异常处理：异常写入 `walletStore.error`
- 测试关注：
  - 首次安装无钱包进入 `AuthNavigator`
  - 有钱包进入 `MainNavigator`

---

## 2. 钱包域核心函数（`WalletService`）

文件：`wallet-clean/src/services/WalletService.ts`

## 2.1 `generateMnemonic(length)`

- 输入：`MnemonicLength`（12/24）
- 输出：助记词字符串
- 关键依赖：`expo-crypto`、`@scure/bip39`
- 副作用：无存储
- 异常：随机熵生成失败、助记词生成失败
- 测试点：
  - 12/24 词数量正确
  - 词库校验通过

## 2.2 `createWallet({ name, mnemonic })`

- 输入：钱包名、助记词
- 输出：`Wallet`
- 副作用：
  - 安全存储助记词
  - 追加钱包列表
  - 设置当前钱包 ID
- 异常：助记词无效、派生私钥失败、存储失败
- 测试点：
  - 地址格式正确
  - 列表新增且 currentWallet 更新

## 2.3 `importWallet({ name, mnemonic?, privateKey? })`

- 输入：钱包名 + 助记词或私钥
- 输出：`Wallet`
- 分支：
  - 助记词导入：BIP39/BIP32 派生地址
  - 私钥导入：十六进制解析后生成地址
- 副作用：保存密钥、保存钱包、设置 current
- 异常：输入缺失、私钥格式错误、存储失败
- 测试点：
  - 助记词和私钥两条路径都可用
  - 不同钱包 ID 不冲突

## 2.4 `getWalletPrivateKey(walletId)`

- 输入：钱包 ID
- 输出：`Uint8Array` 私钥字节
- 副作用：读取 secure storage
- 异常：钱包不存在、密钥缺失
- 测试点：
  - mnemonic 钱包可正确派生
  - private key 钱包可正确回读

## 2.5 `getAllWallets / getWalletById / getCurrentWallet`

- 输入：无或 `walletId`
- 输出：钱包列表/钱包对象/null
- 副作用：读取 secure storage
- 异常策略：读取异常时返回空或 null
- 测试点：空数据、脏数据恢复

## 2.6 `setCurrentWallet(walletId)`

- 输入：钱包 ID
- 输出：void
- 副作用：写 `CURRENT_WALLET_ID`
- 测试点：切换后重启应用是否仍生效

## 2.7 `deleteWallet(walletId)`

- 输入：钱包 ID
- 输出：void
- 副作用：
  - 删除对应密钥
  - 更新钱包列表
  - 若删除当前钱包则清理 current
- 测试点：
  - 删除当前钱包
  - 删除非当前钱包

## 2.8 `exportMnemonic / exportPrivateKey`

- 输入：钱包 ID
- 输出：明文助记词/私钥字符串
- 风险：高敏数据导出
- 测试点：
  - 非助记词钱包导出助记词应报错
  - 私钥导出格式是否 `0x` 开头

---

## 3. 钱包状态函数（`walletStore`）

文件：`wallet-clean/src/store/walletStore.ts`

## 3.1 `loadWallets()`

- 输入：无
- 输出：void
- 副作用：设置 `isLoading/error/wallets/currentWallet`
- 测试点：加载成功与失败分支

## 3.2 `createWallet(name, mnemonic)`

- 输入：名称、助记词
- 输出：`Wallet`
- 副作用：调用 `WalletService.createWallet` 并刷新列表
- 测试点：成功后 `currentWallet` 更新

## 3.3 `importWallet(name, mnemonic?, privateKey?)`

- 输入：导入参数
- 输出：`Wallet`
- 副作用：刷新列表与 current

## 3.4 `deleteWallet(walletId)`

- 输入：钱包 ID
- 输出：void
- 副作用：删除后刷新列表，必要时清空 current

---

## 4. RPC 层函数（`RPCService`）

文件：`wallet-clean/src/services/RPCService.ts`

## 4.1 `getProvider(chainId)`

- 输入：链 ID
- 输出：`ethers.JsonRpcProvider`
- 副作用：provider 缓存到 `Map`
- 测试点：同链复用 provider

## 4.2 `getBalance(address, chainId)`

- 输出：Wei 字符串
- 依赖：`provider.getBalance`

## 4.3 `getTokenBalance(address, tokenAddress, chainId)`

- 输出：最小单位字符串
- 依赖：ERC20 `balanceOf`

## 4.4 `getTokenInfo(tokenAddress, chainId)`

- 输出：`{name,symbol,decimals}`
- 依赖：ERC20 `name/symbol/decimals`

## 4.5 `getFeeData / estimateGas / getTransactionCount`

- 用途：交易构建基础数据
- 输出：费率、gasLimit、nonce

## 4.6 `sendRawTransaction / getTransactionReceipt / waitForTransaction`

- 用途：广播 + 回执 + 确认
- 风险：RPC 波动和链拥堵导致超时

---

## 5. 交易域函数（`TransactionService`）

文件：`wallet-clean/src/services/TransactionService.ts`

## 5.1 `estimateGas(params, chainId)`

- 输入：from/to/value/data
- 输出：`GasEstimate`
- 关键：`estimatedFee = gasLimit * maxFeePerGas`

## 5.2 `buildTransaction(params, chainId)`（私有）

- 输出：`ethers.TransactionRequest`
- 自动补：nonce、feeData、gasLimit
- 固定：`type: 2`（EIP-1559）

## 5.3 `signTransaction(tx, walletId)`（私有）

- 输出：签名原始交易串
- 依赖：`WalletService.getWalletPrivateKey`

## 5.4 `sendTransaction(params, walletId, chainId)`

- 输出：`txHash`
- 副作用：保存交易记录（pending）
- 风险：当前 `type` 判定逻辑简单（`to===from` 划分收发）

## 5.5 `sendToken(params, walletId, chainId)`

- 行为：编码 ERC20 `transfer` 后复用 `sendTransaction`

## 5.6 `waitForTransaction(txHash, confirmations, chainId)`

- 行为：等待确认后更新状态
- 风险：`updateTransactionStatus` 目前占位，状态落库不完整

## 5.7 `getTransactions(address)`

- 输出：该地址本地交易列表
- 存储键：`transactions_${address}`

## 5.8 `speedUpTransaction / cancelTransaction`

- 行为：读取原交易，提升 10% 费率，复用 nonce 重发
- 风险：原交易不存在、链上状态已变化

---

## 6. dApp 连接函数（`WalletConnectService`）

文件：`wallet-clean/src/services/WalletConnectService.ts`

## 6.1 `init(projectId?)`

- 无 Project ID：本地模式 + 会话缓存恢复
- 有 Project ID：初始化 Core/Web3Wallet + 绑定事件

## 6.2 `setWalletContext(context)`

- 用途：后续签名/发送请求必须依赖该上下文

## 6.3 `pair(uri)`

- 在线模式：调用 `core.pairing.pair`
- 本地模式：创建本地会话对象

## 6.4 `getActiveSessions / disconnectSession / disconnectAllSessions`

- 用途：会话管理
- 副作用：会话持久化写入

## 6.5 `approveRequest(requestId)`

- 根据 method 分发：
  - `eth_sendTransaction`
  - `personal_sign`
  - `eth_sign`
  - `eth_signTypedData(_v4)`
- 输出：向 dApp 响应 result

## 6.6 `rejectRequest(requestId, message)`

- 输出：向 dApp 响应 error

## 6.7 `parseUri(uri)`

- 输出：topic/symKey/relay 等解析对象
- 测试点：格式异常输入返回 null

---

## 7. 安全函数（`SecurityService`）

文件：`wallet-clean/src/services/SecurityService.ts`

## 7.1 `assessUrl(rawUrl)`

- 输出：`RiskReport`
- 检查：协议、https、punycode、短链、高风险关键词

## 7.2 `summarizeWalletConnectRequest(req)`

- 输出：`title + lines + risk`
- 行为：
  - 对 tx data 方法签名做可读化
  - 对签名方法给风险提示

---

## 8. 页面关键函数

## 8.1 `SendScreen`

文件：`wallet-clean/src/screens/Send/SendScreen.tsx`

- `handleEstimateGas()`：估算手续费并更新 UI
- `handleSend()`：做输入校验并弹出确认
- `submitSend()`：真正调用 `TransactionService.sendTransaction`
- `handleSetMax()`：按余额和预估费计算最大可发

测试重点：

- 地址错误/余额不足/金额非法
- gasEstimate 存在与不存在两种 max 行为

## 8.2 `DAppConnectionsScreen`

文件：`wallet-clean/src/screens/DApp/DAppConnectionsScreen.tsx`

- `loadSessions()`：初始化并刷新会话+请求
- `handleManualConnect()`：URI 校验后配对
- `handleApproveRequest()`：安全摘要后审批
- `handleRejectRequest()`：拒绝请求

测试重点：

- 本地模式与在线模式行为差异
- 高风险请求二次确认逻辑

---

## 9. 建议测试矩阵（函数级）

必测用例：

1. `WalletService.createWallet/importWallet` 双路径
2. `TransactionService.buildTransaction` 补齐字段
3. `TransactionService.speedUp/cancelTransaction` nonce 重发
4. `WalletConnectService.parseUri/approveRequest`
5. `SecurityService.assessUrl/summarizeWalletConnectRequest`

---

## 10. 结论

这份附录可以直接作为 code review 和单测拆分清单使用。建议你在下一轮迭代中先围绕“交易状态机 + dApp 审批风控”补齐函数测试，再扩展功能。
