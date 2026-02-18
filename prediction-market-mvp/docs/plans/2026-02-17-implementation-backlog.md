# Implementation Backlog (Jira/Linear Ready)

## 1. 说明

本清单按 12 周拆分，支持直接建工单。
字段建议：`Task ID / Lane / Priority / Dependency / DoD / KPI / Owner / ETA`

状态标记：`[TODO]` / `[IN_PROGRESS]` / `[DONE]`

## 1.1 执行日志（2026-02-17）

- [DONE] W1-W2 文档冻结：已完成 `docs/plans` 全量文档落地。
- [IN_PROGRESS] W3-W4 API 契约扩展：新增 `GET /trades/history`、`GET /trades/positions`、`GET /trades/status/:txHash`，仍需回归验收。
- [IN_PROGRESS] W3-W4 移动端重构：已接入四Tab骨架，仍需体验细节和异常流完善。
- [IN_PROGRESS] W4 交易状态闭环：已实现状态轮询展示，仍需覆盖更多失败场景。
- [IN_PROGRESS] W5-W6 持仓与历史闭环：已打通接口与页面，仍需对账与回归收口。
- [DONE] W5-W6 数据一致性脚本：新增 `npm run reconcile:positions`。
- [DONE] W5-W6 QA回归脚本：`qa:w1w6:e2e`、`qa:read-model`、`qa:seed-flow` 在本地环境执行通过。
- [DONE] QA 用例文档：新增 `docs/plans/2026-02-17-w1-w6-test-cases.md`。
- [DONE] Backend 运行修复：补 `nest-cli` ABI assets 拷贝，`npm run start` 不再缺少 ABI 文件。
- [DONE] 基础回归通过：`npm run build`（root）与 `npm run test`（contracts）通过。

## 2. W1-W2（规格冻结）

- [DONE] PM-001（Product, P0）：冻结四阶段定义与退出条件
  - DoD：Roadmap 审批通过
- [DONE] PM-002（Product, P0）：冻结功能域与条目 ID
  - DoD：Feature Matrix 审批通过
- [DONE] UX-001（Design, P0）：输出 UI Token v1
  - DoD：UI Spec 审批通过
- [DONE] BE-001（Backend, P0）：冻结交易状态接口 schema
  - DoD：API 契约文档通过评审
- [DONE] QA-001（QA, P0）：定义 MVP E2E 核心用例
  - DoD：测试清单评审通过

## 3. W3-W4（MVP闭环-身份与交易状态）

- [IN_PROGRESS] MB-101（Mobile, P0）：实现会话重连/过期处理
- [IN_PROGRESS] MB-102（Mobile, P0）：多钱包切换与冲突提示
- [IN_PROGRESS] BE-101（Backend, P0）：SIWE 会话策略与鉴权中间件
- [DONE] BE-102（Backend, P0）：交易状态查询 API（4态）
- [DONE] DX-101（Indexer, P0）：交易状态落库字段完善
- [DONE] QA-101（QA, P0）：登录->交易状态 E2E

DoD：

- 交易四态在 UI 可见
- 状态追踪覆盖率 = 100%

## 4. W5-W6（MVP闭环-资产与历史）

- [IN_PROGRESS] MB-201（Mobile, P0）：Portfolio 页（持仓、可卖数量）
- [IN_PROGRESS] MB-202（Mobile, P0）：Activity 页（历史、状态）
- [IN_PROGRESS] BE-201（Backend, P0）：持仓聚合 API
- [IN_PROGRESS] BE-202（Backend, P0）：历史分页/筛选 API
- [DONE] DX-201（Indexer, P0）：持仓快照与对账脚本
- [DONE] QA-201（QA, P0）：资产与历史一致性回归

DoD：

- 核心路径成功率 >= 98%
- 抽样对账通过

## 5. W7-W8（风控与可观测）

- BE-301（Backend, P0）：限流策略上线
- BE-302（Backend, P0）：关键交易审计日志
- BE-303（Backend, P0）：异常告警规则（频率/失败率）
- MB-301（Mobile, P0）：失败恢复引导与重试交互
- OPS-301（DevOps, P0）：日志/指标/告警大盘
- QA-301（QA, P0）：风控与告警演练

DoD：

- 关键交易可审计率 = 100%
- P0 告警链路可触发并通知到位

## 6. W9-W10（Beta工程化）

- QA-401（QA, P0）：CI 门禁（lint/type/test/e2e）
- OPS-401（DevOps, P0）：灰度发布流程
- OPS-402（DevOps, P0）：回滚预案与演练
- BE-401（Backend, P1）：降级策略与容错
- MB-401（Mobile, P1）：版本兼容提示策略

DoD：

- API 可用性 >= 99.5%
- 回滚演练通过

## 7. W11-W12（Production准备）

- SEC-501（Security, P0）：安全评审与签署
- OPS-501（Ops, P0）：应急 SOP + 值班机制
- PM-501（Product, P1）：发布说明/FAQ/客服脚本
- QA-501（QA, P0）：Go/No-Go 评审包
- ALL-501（All, P0）：Production 门禁总验收

DoD：

- 发布清单 P0 全绿
- Production 审批通过

## 8. 工单模板（复制用）

- Task ID:
- Title:
- Lane:
- Priority: P0/P1/P2
- Linked Spec: (例如 FI-C-01)
- Scope In:
- Scope Out:
- Dependency:
- Deliverables:
- DoD:
- KPI:
- Owner:
- ETA:
- Risk:
- Rollback:
