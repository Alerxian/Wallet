# Week 1 实施任务单（生产化第一周）

来源：`production-roadmap-2-4-8-weeks.md` 的 Week 1 目标拆解  
范围：仅覆盖交易可靠性最小闭环（状态机 + 幂等 + 真实状态查询）

---

## 1) 本周目标（必须达成）

1. 用真实交易状态机替换 `setTimeout` 模拟流转。
2. 引入 `clientOrderId` + `idempotency-key`，防重复提交。
3. 建立 pending 交易持久化结构，支持冷启动恢复。
4. 完成错误分层（可重试 / 不可重试 / 待对账）。

---

## 2) 允许改动范围

- `mobile/src/types.ts`
- `mobile/src/store/appStore.ts`
- `mobile/src/api/marketApi.ts`
- `mobile/src/utils/storage.ts`
- `mobile/src/utils/activity.ts`（仅在状态字段扩展需要时）
- `mobile/src/screens/MarketDetailScreen.tsx`（仅最小交互状态文案）
- `mobile/src/screens/ActivityScreen.tsx`（仅最小状态展示）
- `mobile/src/utils/__tests__/`（新增与更新测试）

禁止改动：

- 与交易可靠性无关的视觉重构
- 新增大型状态库
- 改变业务规则（只提升可靠性，不改交易规则）

---

## 3) 数据结构改造（先做）

## 3.1 类型定义（`mobile/src/types.ts`）

新增或调整：

- `TradeLifecycleStatus`：
  - `DRAFT`
  - `SUBMITTING`
  - `PENDING_CHAIN`
  - `CONFIRMED`
  - `INDEXED`
  - `FAILED_RETRYABLE`
  - `FAILED_FATAL`
  - `UNKNOWN_NEEDS_RECONCILE`
- `RetryCategory`：`RETRYABLE | FATAL | RECONCILE`
- `PendingTradeRecord`：
  - `clientOrderId`
  - `txHash?`
  - `marketId`
  - `action`
  - `side`
  - `amount`
  - `status`
  - `retryCount`
  - `nextRetryAt?`
  - `lastErrorCode?`
  - `createdAt`
  - `updatedAt`

验收点：

- 类型层无 `any` 回退。
- 状态枚举可覆盖所有前端交易阶段。

## 3.2 存储结构（`mobile/src/utils/storage.ts`）

新增：

- `PENDING_TRADES_KEY`
- `loadPendingTrades()`
- `savePendingTrades(records)`

验收点：

- 存取失败时安全回退空数组。
- 写入结构可向后兼容（字段新增不导致旧版本崩溃）。

---

## 4) API 合约改造（`mobile/src/api/marketApi.ts`）

新增接口封装：

- `submitTradeIntent(payload, clientOrderId)`
  - 请求头附带 `idempotency-key`
  - 返回 `txHash` 或服务端订单引用
- `fetchTradeStatus(reference)`
  - 返回标准化状态（含错误码）

错误分层规范：

- 网络超时/5xx -> `RETRYABLE`
- 参数非法/余额不足/签名拒绝 -> `FATAL`
- 状态未知/链上延迟 -> `RECONCILE`

验收点：

- API 返回统一映射到前端状态机，不在 UI 分散判断。

---

## 5) Store 状态机改造（核心，`mobile/src/store/appStore.ts`）

删除：

- 现有 `submitTrade` 内的 `setTimeout` 模拟推进逻辑。

新增 Action：

- `submitTrade(params)`：
  - 生成 `clientOrderId`
  - 状态 `SUBMITTING`
  - 调 `submitTradeIntent`
  - 成功后进入 `PENDING_CHAIN`
- `pollTradeStatus(clientOrderId)`：
  - 分段轮询（2s / 8s / 30s）
  - 命中终态后停止
- `recoverPendingTrades()`：
  - 冷启动与回前台时恢复
- `classifyTradeError(error)`：
  - 统一分类重试类型

状态机约束：

- 所有状态迁移必须是“可追踪事件”
- 本地与持久化同步更新

验收点：

- 同一 `clientOrderId` 不会重复创建并发提交。
- 弱网下可进入可重试分支，不会卡死无提示。

---

## 6) UI 最小改造（只做必要透出）

- `mobile/src/screens/MarketDetailScreen.tsx`
  - 提交中禁用重复点击
  - 展示“可重试 / 不可重试 / 待恢复”提示文案
- `mobile/src/screens/ActivityScreen.tsx`
  - 增加状态标签映射（至少：`PENDING_CHAIN`、`FAILED_RETRYABLE`、`UNKNOWN_NEEDS_RECONCILE`）

验收点：

- 用户可理解当前交易进度与下一步动作。

---

## 7) 测试清单（Week 1 必测）

单测：

- `classifyTradeError` 分类正确
- 状态迁移合法性（不允许非法跳转）
- pending 读写与兼容回退

集成测试：

- 提交交易 -> `PENDING_CHAIN` -> 终态
- API 超时 -> `FAILED_RETRYABLE`
- 重启恢复 pending 队列后继续轮询

回归验证：

- `npm run typecheck`
- `npm test`

---

## 8) 埋点与监控字段（本周先埋点）

事件：

- `trade_submit_start`
- `trade_submit_success`
- `trade_submit_fail`
- `trade_status_polled`
- `trade_status_final`

公共字段：

- `clientOrderId`
- `marketId`
- `action`
- `side`
- `amount`
- `status`
- `errorCode?`
- `latencyMs?`

---

## 9) 风险与回滚

主要风险：

- 状态机改造触发 Activity 与持仓联动回归。
- API 契约未稳定导致状态映射反复变更。

回滚方案：

- 保留旧提交路径 feature flag（`trade_state_machine_v2`）
- 出现生产异常时切回旧逻辑并关闭轮询
- 通过 `clientOrderId` + 日志回放排查错单

---

## 10) 本周完成定义（DoD）

- 真实交易状态机替换成功，无本地定时模拟依赖。
- 具备幂等提交能力，重复点击不重复下单。
- pending 状态可跨重启恢复。
- `typecheck` 与 `test` 全绿。
