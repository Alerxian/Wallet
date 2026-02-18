# W1-W6 QA Runbook

## 1. 目标

本 runbook 用于收口 W1-W6 已实现能力，验证以下三类风险：

- 会话鉴权是否可用（SIWE + Bearer Guard）
- 交易读模型是否可用（history / positions / status）
- 索引数据与链上持仓是否一致

## 2. 前置条件

- 本地 Anvil、Postgres、Backend 已启动
- 索引器已在运行并有交易数据
- 拥有用于 QA 的私钥（建议使用 Anvil 测试账户）

## 3. 命令清单

在 `backend` 目录执行。

### 3.0 路由预检查（确认服务版本正确）

```bash
curl -i "http://127.0.0.1:3001/trades/history?walletAddress=0x0000000000000000000000000000000000000000&limit=1"
```

预期：返回 `401`（说明新版本路由存在且 Session Guard 生效）。
若返回 `404`，表示你连接的不是当前代码版本服务。

### 3.1 基础构建检查

```bash
npm run build
```

### 3.2 读模型结构检查

```bash
AUTH_TOKEN=<siwe_token> WALLET_ADDRESS=<wallet_address> npm run qa:read-model
```

用途：检查 `GET /trades/history` 和 `GET /trades/positions` 响应结构是否符合约定。

### 3.3 端到端会话与鉴权检查（推荐）

```bash
API_BASE=http://127.0.0.1:3001 QA_PRIVATE_KEY=<wallet_private_key> CHAIN_ID=31337 npm run qa:w1w6:e2e
```

覆盖点：

- `GET /auth/siwe/nonce`
- `POST /auth/siwe/verify`
- `GET /auth/siwe/session`
- Bearer token 调用 `history/positions`
- 钱包地址不匹配时返回 `403`

### 3.4 交易种子流检查（推荐）

```bash
API_BASE=http://127.0.0.1:3001 RPC_URL=http://127.0.0.1:8545 QA_PRIVATE_KEY=<wallet_private_key> CHAIN_ID=31337 npm run qa:seed-flow
```

覆盖点：

- 自动创建 market
- 自动完成 approve + buy
- 等待状态进入 confirmed/indexed
- 校验 history / positions 非空

### 3.5 链上对账检查

```bash
DATABASE_URL=<postgres_url> RPC_URL=http://127.0.0.1:8545 npm run reconcile:positions
```

用途：校验索引交易累加出的持仓与链上 `yesShares/noShares` 一致。

## 4. 通过标准

- `qa:w1w6:e2e` 返回 `QA W1-W6 E2E passed`
- `qa:seed-flow` 返回 `Seed flow passed`
- `qa:read-model` 返回 `QA read-model passed`
- `reconcile:positions` 返回 `Reconciliation passed`

任一命令失败，则 W1-W6 不得标记为“已验收”。

## 5. 常见失败定位

- `401 Session expired`：重新进行 SIWE 登录并更新 token。
- `403 Wallet/session mismatch`：确认 query 中 wallet 与登录钱包一致。
- `Reconciliation failed`：优先检查索引器是否漏块、交易 action/side 是否正确写入。
