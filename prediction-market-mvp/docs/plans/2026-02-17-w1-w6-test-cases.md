# W1-W6 Test Cases

## 1. 范围

覆盖 W1-W6 核心能力：

- SIWE 登录与会话
- 交易读模型（history / positions / status）
- 移动端四 Tab 主流程

## 2. 用例清单

### TC-001 SIWE 登录成功

- 前置：后端可访问，钱包可签名
- 步骤：
  1. 调 `GET /auth/siwe/nonce`
  2. 钱包签名 SIWE message
  3. 调 `POST /auth/siwe/verify`
- 期望：返回 `session.token` 和 `session.expiresAt`

### TC-002 Session 恢复成功

- 前置：本地已保存有效 token
- 步骤：重启 App
- 期望：`GET /auth/siwe/session` 验证通过，不要求重新登录

### TC-003 Session 过期失效

- 前置：使用过期 token
- 步骤：请求 `GET /trades/positions`
- 期望：返回 401，App 清理会话并提示重新登录

### TC-004 钱包地址不匹配被拒绝

- 前置：token 属于 A 地址
- 步骤：用 A token 调 `walletAddress=B` 的 positions/history
- 期望：返回 403

### TC-005 Trades History 返回结构

- 前置：wallet 有交易
- 步骤：调 `GET /trades/history?walletAddress=...`
- 期望：每条至少包含 `txHash/marketId/action/side/amount/state`

### TC-006 Positions 返回结构

- 前置：wallet 有或无仓位
- 步骤：调 `GET /trades/positions?walletAddress=...`
- 期望：数组结构稳定；有仓位时包含 `yesShares/noShares`

### TC-007 Trade 状态机

- 前置：有有效 txHash
- 步骤：轮询 `GET /trades/status/:txHash`
- 期望：状态在 `PENDING/CONFIRMED/INDEXED/FAILED` 中

### TC-008 移动端 Portfolio 页面

- 前置：钱包已登录
- 步骤：进入 Portfolio，点击 Refresh
- 期望：正常展示仓位或空态，不崩溃

### TC-009 移动端 Activity 页面

- 前置：钱包已登录
- 步骤：进入 Activity，点击 Refresh
- 期望：展示交易记录与状态，不崩溃

### TC-010 对账检查

- 前置：索引器运行并有交易
- 步骤：执行 `npm run reconcile:positions`
- 期望：输出 `Reconciliation passed`

## 3. 自动化映射

- 脚本 `qa:w1w6:e2e`：覆盖 TC-001、TC-004、TC-005、TC-006
- 脚本 `qa:seed-flow`：覆盖 TC-001、TC-005、TC-006、TC-007、TC-010（间接）
- 脚本 `qa:read-model`：覆盖 TC-005、TC-006
- 脚本 `reconcile:positions`：覆盖 TC-010

TC-002、TC-003、TC-008、TC-009 当前为人工回归项。
