# Week1 + React Query 交付文档

更新时间：2026-02-19  
范围：`app/mobile/`

---

## 1. 交付结论

本次已完成两类目标：

1. **Week1 交易可靠性核心改造**（状态机、幂等头、轮询、恢复、错误分类）
2. **React Query 接入**（Provider、RN 焦点/在线管理、查询 hooks）

并保持了项目约束：

- 继续使用 `zustand` 管客户端/UI 状态
- API 边界仍在 `ky + zod` 的 `marketApi.ts`
- 无引入大型状态库替换现有架构

---

## 2. Week1 实现内容

## 2.1 状态机与交易生命周期

- 新增/扩展状态定义：
  - `TradeLifecycleStatus`: `DRAFT / SUBMITTING / PENDING_CHAIN / CONFIRMED / INDEXED / FAILED_RETRYABLE / FAILED_FATAL / UNKNOWN_NEEDS_RECONCILE / FINAL`
  - `TradeStatus` 扩展支持 `PENDING_CHAIN / FAILED_RETRYABLE / FAILED_FATAL / UNKNOWN_NEEDS_RECONCILE`

文件：

- `mobile/src/types.ts`

## 2.2 幂等提交与状态查询 API

- 新增 `submitTradeIntent(input)`：请求头注入 `idempotency-key=clientOrderId`
- 新增 `fetchTradeStatus(reference)`：统一状态读取
- 保留既有 markets API 边界和 mock fallback

文件：

- `mobile/src/api/marketApi.ts`

## 2.3 Pending 持久化与恢复

- 持久化 key：`pending_trades`
- 读写接口：`loadPendingTrades` / `savePendingTrades`
- 增强 payload 校验（字段合法性过滤）

文件：

- `mobile/src/utils/storage.ts`
- `mobile/src/utils/__tests__/storage.test.ts`

## 2.4 Store 可靠性改造

- `submitTrade` 从本地 `setTimeout` 模拟迁移为：
  - 生成 `clientOrderId`
  - 调用 `submitTradeIntent`
  - 进入 `PENDING_CHAIN`
  - 调用 `pollTradeStatus`
- 新增 `pollTradeStatus(clientOrderId, startedAt)`：
  - 2s / 8s / 30s 分段轮询
  - 超时进入 `UNKNOWN_NEEDS_RECONCILE`
- 新增 `recoverPendingTrades()`：冷启动恢复 pending 并重启轮询
- 新增 `classifyTradeError(error)`：`RETRYABLE/FATAL/RECONCILE`

文件：

- `mobile/src/store/appStore.ts`

## 2.5 Activity/状态可视化扩展

- Activity 筛选和图标映射支持新状态
- 状态胶囊扩展支持新状态配色

文件：

- `mobile/src/screens/ActivityScreen.tsx`
- `mobile/src/components/StatusPill.tsx`

---

## 3. React Query 接入内容

## 3.1 Provider 与 QueryClient

- 新增全局 QueryClient
- App 根节点包裹 `QueryClientProvider`

文件：

- `mobile/src/api/queryClient.ts`
- `mobile/App.tsx`

## 3.2 React Native 运行时对接

- `focusManager` + `AppState`（active 时聚焦）
- `onlineManager` + `NetInfo`（网络变化同步）

文件：

- `mobile/src/api/reactQueryNative.ts`
- `mobile/App.tsx`

## 3.3 Query Hooks 与页面接入

- `useMarketsQuery`：市场列表查询
- `useMarketDetailQuery`：市场详情查询
- Markets 页面使用 query 数据 + refetch
- MarketDetail 页面改用详情 query

文件：

- `mobile/src/api/queries/marketsQuery.ts`
- `mobile/src/api/queries/marketDetailQuery.ts`
- `mobile/src/screens/MarketsScreen.tsx`
- `mobile/src/screens/MarketDetailScreen.tsx`

---

## 4. 架构边界（最终形态）

- **TanStack Query**：服务端状态（查询、缓存、重连/焦点重拉）
- **Zustand**：本地/UI 状态（tab、选中 market、主题、筛选、交易动作状态机）
- **API Layer（ky + zod）**：协议与 schema 校验边界，不下沉到 screen

---

## 5. 验证结果

执行目录：`app/mobile`

- `npm run typecheck` ✅
- `npm test` ✅

当前结果：

- Test Suites: 4 passed
- Tests: 12 passed

---

## 6. 外部方案对齐（检索结论）

本次并行检索了官方文档与 OSS 实践，落实的关键点：

- RN 中使用 `onlineManager + NetInfo`
- RN 中使用 `focusManager + AppState`
- Zustand 与 TanStack Query 分层：server state vs client state
- mutation 后用失效/轮询策略驱动一致性

---

## 7. 已知风险与后续建议

1. **后端接口契约风险**
   - 若 `/trades/intent` 或 `/trades/status/:id` 返回结构变化，需要同步 `zod schema`。

2. **交易终态一致性**
   - 建议 Week2 增加 reconcile 专用接口或后台补偿任务，降低 `UNKNOWN_NEEDS_RECONCILE` 比例。

3. **测试覆盖仍可加强**
   - 当前通过门禁以 utils 测试为主。
   - 建议 Week2 增加 store 行为测试和交易链路集成测试（提交 -> 轮询 -> 终态）。

---

## 8. 对 week1 任务单的完成度

对应 `week1-implementation-checklist.md`：

- [x] 状态机替换（移除交易 `setTimeout` 模拟）
- [x] 幂等键引入（`idempotency-key`）
- [x] pending 持久化与恢复
- [x] 错误分层（可重试/不可重试/待对账）
- [x] React Query 最小接入（并保持架构边界）
