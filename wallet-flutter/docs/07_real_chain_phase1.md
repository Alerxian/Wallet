# 07 - 真实链路接入（Phase 1）

## 本阶段目标

在不破坏现有 UI 与流程的前提下，优先把“最关键的真实能力”接入：

1. 真实钱包创建/导入（BIP39/BIP32 派生）
2. 真实主币余额查询（RPC）
3. 真实主币转账广播（RPC）
4. 安全设置基础能力（生物识别验证 + 自动锁定配置）

## 关键实现

### 新增服务

- `lib/services/wallet_crypto_service.dart`
  - 创建钱包：生成助记词并派生 EVM 地址
  - 导入钱包：支持私钥或助记词导入并派生地址

- `lib/services/evm_service.dart`
  - `getNativeBalance`：通过 RPC 获取主币余额
  - `sendNativeTransaction`：发送主币交易

- `lib/services/price_service.dart`
  - 使用 CoinGecko 获取价格（ETH/USDC/ARB）

### 状态层改造

- `lib/state/wallet_app_state.dart`
  - `createWallet/importWallet` 改为真实密钥路径
  - 新增 `refreshPortfolio` 同步余额和价格
- `send` 改为真实广播（当前仅主币）
- 设置能力：生物识别开关、自动锁定时间、生物识别验证方法

## 能力边界

已接入：
- 真实主币余额
- 真实主币发送

未接入（下一阶段）：
- ERC-20 余额查询与发送
- 交易回执轮询与状态自动更新
- Gas 高级策略（EIP-1559 参数可配置）
