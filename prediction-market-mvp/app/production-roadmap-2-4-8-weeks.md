# 生产化落地清单（2周 / 4周 / 8周）

版本：v1.0  
更新时间：2026-02-19  
适用范围：`app/mobile/`（Expo React Native）

---

## 1. 当前项目结论（先给结论）

当前代码属于**高质量 MVP / Demo**：结构清晰、可运行、可测试，但尚未达到真实线上 App 的稳定性、可恢复性、可观测性和发布工程标准。

核心差距集中在 6 个方面：

1. 交易链路仍是模拟状态机，缺少真实链路与最终一致性保障。
2. 失败补偿、状态轮询、重试闭环尚未系统化。
3. 钱包登录与会话安全能力不完整（鉴权、过期、恢复）。
4. 测试覆盖偏窄（以 `utils` 单测为主，缺集成与 E2E）。
5. 监控与告警缺失（埋点、错误上报、性能指标）。
6. CI/CD 与发布回滚流程不完整。

---

## 2. 关键不足与风险清单

| 领域 | 现状 | 风险触发条件 | 风险后果 | 回滚/降级 |
|------|------|--------------|----------|-----------|
| 交易状态 | `submitTrade` 本地定时模拟 | 弱网/后端抖动/链上延迟 | 状态错判、用户误操作 | 降级到只读交易状态 + 强提醒 |
| 幂等与重试 | 缺统一幂等键和重试策略 | 用户重复点击/请求超时 | 重复下单或状态不一致 | 启用服务端幂等键 + 客户端去重 |
| 失败补偿 | 缺持久化补偿队列 | App 杀进程/切后台 | pending 永久挂起 | 启动/前台恢复时自动 reconcile |
| 会话与安全 | 登录链路不完整 | token 过期/签名失败 | 无法访问或状态脏数据 | 强制登出并清理本地状态 |
| 测试覆盖 | 缺关键链路集成测试 | 改动交易/状态逻辑 | 回归漏检 | 增加链路集成 + E2E 冒烟 |
| 可观测性 | 缺埋点与告警 | 线上异常发生 | 无法定位根因 | 接入 Sentry + 指标告警 |

---

## 3. 交易可靠性方案（失败补偿 + 状态轮询 + 重试闭环）

## 3.1 状态机（必须落地）

建议统一状态：

- `DRAFT`
- `SUBMITTING`
- `PENDING_CHAIN`
- `CONFIRMED`
- `INDEXED`
- `FAILED_RETRYABLE`
- `FAILED_FATAL`
- `UNKNOWN_NEEDS_RECONCILE`
- `FINAL`

约束：

- UI 不直接推进状态；只响应状态机变化。
- 状态变化必须记录事件日志（时间、原因、请求 ID、txHash）。

## 3.2 幂等与去重

- 客户端生成 `clientOrderId`（UUID）。
- 请求头带 `idempotency-key=clientOrderId`。
- 服务端对同一 key 返回同一结果或同一订单引用。
- 本地按 `clientOrderId + marketId + action + side + amount` 做短窗去重。

## 3.3 轮询策略（分层退避）

- 0-30s：每 2s 轮询
- 30s-3min：每 8s 轮询
- >3min：每 30s 轮询，且仅在前台高频
- 超时阈值（如 10 分钟）后进入 `UNKNOWN_NEEDS_RECONCILE`

## 3.4 重试闭环

- 可重试：超时、网络抖动、5xx、临时 RPC 错误
- 不可重试：参数非法、余额不足、签名拒绝、业务规则拒绝
- 策略：指数退避 + 抖动（1s, 2s, 4s, 8s, 16s，上限 30s）
- 达到上限后：`FAILED_RETRYABLE`，暴露“继续重试”入口

## 3.5 失败补偿（Reconcile）

本地持久化补偿队列（AsyncStorage）：

- `clientOrderId`
- `txHash`
- `lastKnownStatus`
- `retryCount`
- `nextRetryAt`
- `lastErrorCode`

补偿触发时机：

- App 启动
- App 回前台
- 网络恢复
- 用户手动点击“恢复交易”

补偿顺序：

1. 查服务端订单状态
2. 查链上 receipt（兜底）
3. 对账并回写本地状态与 Activity

---

## 4. 2周 / 4周 / 8周落地计划

## 4.1 两周目标（上线前最低可用生产基线）

目标：把 Demo 交易链路改成真实、可恢复、可观测的链路。

### Week 1

- 交易状态机替换：移除本地定时模拟，接入真实 `intent/status`。
- 建立 `clientOrderId` + 幂等键机制。
- 建立 pending 持久化结构与恢复入口（启动/前台）。
- API 错误码标准化（可重试 vs 不可重试）。

测试补齐：

- `trade`/`activity`/`store` 状态流单测。
- 交易提交 -> 轮询 -> 终态 的集成测试。

监控接入：

- 交易提交成功率
- 交易终态耗时 p50/p95
- 交易失败分类占比

### Week 2

- 完成重试闭环与补偿队列处理器。
- Activity 增加 `RETRYING/RECONCILING/NEEDS_ACTION` 状态展示。
- Session 恢复与过期清理（至少本地一致性到位）。
- 增加网络异常提示和手动恢复入口。

测试补齐：

- 弱网/超时/5xx 的重试与补偿测试。
- App 重启后 pending 恢复测试。

监控接入：

- Reconcile 成功率
- 重试成功率
- `UNKNOWN_NEEDS_RECONCILE` 占比

2周 DoD：

- 核心链路在弱网与重启场景下可恢复。
- 无重复下单（幂等验证通过）。
- `typecheck + test` 全绿。

---

## 4.2 四周目标（可灰度发布）

目标：补齐工程化与观测，达到小流量可控发布标准。

### Week 3

- 接入 Sentry（JS error + rejection + breadcrumb）。
- 关键埋点落地：`trade_submit_*`, `trade_status_*`, `reconcile_*`。
- 建立基础 Dashboard（成功率、失败率、延迟、崩溃率）。
- CI 建立：PR 必跑 `typecheck + test`。

测试补齐：

- API 契约测试（zod schema drift 保护）。
- Store hydration 与 session 生命周期测试。

### Week 4

- 加入 lint 与发布前检查脚本。
- 引入 feature flag（交易重试策略、补偿策略可开关）。
- 加入 release checklist（版本、变更摘要、回滚点、告警阈值）。
- 手工回归脚本化（关键路径逐条验证）。

监控接入：

- Crash-free sessions
- API 5xx/超时告警
- 交易终态超时告警

4周 DoD：

- 支持 staging 灰度发布。
- 出现故障可在 30 分钟内定位并执行回滚。
- 告警可驱动值班处理（非静默失败）。

---

## 4.3 八周目标（真实生产可持续运营）

目标：形成完整生产能力：安全、观测、运营、性能和发布体系。

### Week 5-6

- 完整 WalletConnect + SIWE 流程与 token 策略。
- 安全增强：日志脱敏、敏感字段保护、会话安全策略。
- 性能优化：首屏耗时、列表滚动、长列表渲染优化。
- 扩展测试：关键链路 E2E 冒烟（至少 iOS/Android 各一套）。

### Week 7-8

- 多环境发布流（dev/staging/prod）标准化。
- 自动化回滚方案（版本 + 配置双回滚）。
- 完整运行手册：故障分级、应急预案、值班手册。
- 运营闭环：通知策略、留存漏斗指标、实验策略（A/B）。

8周 DoD：

- 交易链路具备最终一致性与可恢复性。
- 具备可持续发布和应急能力。
- 关键业务指标可观测并持续优化。

---

## 5. 每周改动重点（模块视角）

| 周 | 重点模块 | 改动目标 |
|----|----------|----------|
| W1 | `src/store/appStore.ts`, `src/api/marketApi.ts`, `src/types.ts` | 状态机 + 幂等 + 真实提交/查询 |
| W2 | `src/utils/activity.ts`, `src/utils/storage.ts`, `src/screens/ActivityScreen.tsx` | 补偿队列 + 状态可视化 + 恢复入口 |
| W3 | API 层与监控接入点 | 埋点 + Sentry + 契约防漂移 |
| W4 | 工程脚本与流程文档 | CI/lint/release checklist |
| W5-6 | 钱包/会话/安全模块 | 完整认证与安全基线 |
| W7-8 | 发布与运营模块 | 多环境发布、回滚、运营闭环 |

---

## 6. 测试补齐路线图

优先顺序：

1. **单测**：状态机迁移、错误分类、重试策略、补偿队列。
2. **集成**：提交交易 -> 轮询 -> 终态；重启恢复；网络抖动。
3. **E2E**：发现市场 -> 下单 -> 状态追踪 -> 失败恢复。
4. **回归手测**：弱网、后台切换、重启、会话过期、网络切换。

停止条件：

- 关键链路测试全部通过。
- 回归脚本无阻塞问题。
- 线上告警阈值配置完成。

---

## 7. 监控与告警清单（必须）

最小指标集：

- `trade_submit_success_rate`
- `trade_to_final_duration_ms`（p50/p95）
- `trade_retry_success_rate`
- `trade_reconcile_success_rate`
- `unknown_status_ratio`
- `session_restore_success_rate`
- `crash_free_sessions`

告警建议：

- 连续 5 分钟 `trade_submit_success_rate < 95%`
- `unknown_status_ratio > 3%`
- `trade_to_final_duration_p95` 超阈值
- crash-free 低于阈值

---

## 8. 发布建议与执行顺序

建议顺序：

1. 先在 staging 跑满 1 周真实流量 + 演练故障恢复。
2. 再小流量灰度（5% -> 20% -> 50% -> 100%）。
3. 每次放量前必须通过：`typecheck + test + 回归脚本 + 告警检查`。

上线前一票否决项：

- 无幂等保护
- 无补偿任务
- 无告警
- 无回滚预案

---

## 9. 与现有文档关系

- 本文档补充 `requirements-detailed.md` 的 Phase 建议，强调“生产化能力”建设路径。
- 实施时仍以 `run.md` 约束优先：小步推进、分阶段执行、先验证后继续。
- 阶段执行可复用 `2.md` 模板，最终收口按 `3.md` 验收。

执行入口：

- Week 1 直接使用：`week1-implementation-checklist.md`
