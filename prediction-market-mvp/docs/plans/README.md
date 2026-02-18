# Plans Directory

本目录是 Prediction Market App 的唯一规划源（Source of Truth）。
规则：先文档后开发；未绑定文档条目的需求不得进入实现。

## 阅读顺序

1. `2026-02-17-product-master-roadmap.md`
2. `2026-02-17-feature-inventory-and-gap.md`
3. `2026-02-17-ui-ux-spec.md`
4. `2026-02-17-security-and-risk-spec.md`
5. `2026-02-17-release-readiness-checklist.md`
6. `2026-02-17-implementation-backlog.md`
7. `2026-02-17-w1-w6-qa-runbook.md`
8. `2026-02-17-w1-w6-test-cases.md`
9. `2026-02-17-connect-login-issues-log.md`

## 执行规则

- 每个开发任务必须绑定文档条目 ID（例如：`FI-C-03`）。
- 每周更新：
  - 完成度矩阵
  - 风险列表
  - 验收证据（测试结果/日志/截图/指标）
- 发布门禁：
  - `release-readiness-checklist` 中任一 P0 条目未通过，禁止发布。

## 状态定义

- `未开始`
- `进行中`
- `阻塞`
- `已完成`
- `已验收`
