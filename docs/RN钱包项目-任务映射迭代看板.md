# React Native 钱包项目任务映射迭代看板

适用项目：`wallet-clean`

目标：把“函数级导读附录”转成可执行迭代任务，按角色分层（新手/中级/高级）+ 按迭代节奏拆分（Sprint 1/2/3）。

---

## 1. 角色分层任务池

## 1.1 新手任务（低风险，2-6 小时/项）

1) 发送页错误提示统一

- 关联文件：`wallet-clean/src/screens/Send/SendScreen.tsx`
- 目标：统一地址错误、金额错误、余额不足的文案与展示位置
- 验收：三类错误可稳定复现且提示一致

2) 钱包列表空状态优化

- 关联文件：`wallet-clean/src/screens/*`、`wallet-clean/src/store/walletStore.ts`
- 目标：无钱包、无交易、无会话场景统一空态样式
- 验收：空态文本、按钮、跳转路径清晰

3) 网络显示文案校对

- 关联文件：`wallet-clean/src/config/networks.ts`、`wallet-clean/src/screens/Home/HomeScreen.tsx`
- 目标：网络名称、符号与 UI 展示一致
- 验收：首页、发送页、设置页网络信息一致

4) 本地模式提示优化

- 关联文件：`wallet-clean/src/screens/DApp/DAppConnectionsScreen.tsx`
- 目标：WalletConnect local mode 提示更明确（能力边界/下一步）
- 验收：用户可理解“为何无法真实连接”

## 1.2 中级任务（中风险，0.5-2 天/项）

1) 交易记录索引表

- 关联函数：`TransactionService.saveTransaction`、`updateTransactionStatus`
- 目标：新增 `txHash -> address` 索引，支持按 hash 定位交易
- 验收：给定 hash 可 O(1)/近 O(1) 找到交易归属地址

2) 交易状态轮询器（基础版）

- 关联函数：`TransactionService.waitForTransaction`、`RPCService.getTransactionReceipt`
- 目标：pending 交易自动更新为 confirmed/failed
- 验收：发送后在限定时间内状态自动变化

3) PriceService 监控日志增强

- 关联文件：`wallet-clean/src/services/PriceService.ts`
- 目标：记录缓存命中、队列长度、429 重试次数
- 验收：可在调试日志中识别限流与降级路径

4) dApp 方法权限白名单（第一阶段）

- 关联函数：`WalletConnectService.approveRequest`
- 目标：只放行白名单方法，其它方法明确拒绝并提示
- 验收：未知方法请求必被拒绝，且用户可见原因

## 1.3 高级任务（高风险，2-5 天/项）

1) 完整交易状态机

- 关联文件：`wallet-clean/src/services/TransactionService.ts`
- 目标：支持 `pending/confirmed/failed/replaced/cancelled`
- 验收：加速与取消交易后状态链可追溯

2) dApp 安全审批增强

- 关联文件：`wallet-clean/src/services/SecurityService.ts`、`wallet-clean/src/screens/DApp/DAppConnectionsScreen.tsx`
- 目标：审批页显示可读化摘要 + 风险级别 + 二次确认
- 验收：高风险请求必须二次确认，审批信息完整

3) Repository 抽象层

- 关联范围：`services` + `store`
- 目标：抽离 RPC/Storage/API 访问层，减少服务耦合
- 验收：核心服务不直接操作底层依赖

4) 硬件钱包 SDK 实接（一期）

- 关联文件：`wallet-clean/src/services/HardwareWalletService.ts`
- 目标：至少打通设备扫描 + 连接 + 地址读取
- 验收：真机可连接并展示账户地址

---

## 2. Sprint 看板（建议 3 个迭代）

## Sprint 1（稳定性与可观测）

目标：先稳定主链路，避免“看起来可用、状态不可信”。

- 中级：交易记录索引表
- 中级：交易状态轮询器（基础版）
- 中级：PriceService 监控日志增强
- 新手：发送页提示统一

完成定义（DoD）：

- 能稳定观察 pending -> confirmed/failed
- 调试日志可判断价格服务是否限流降级

## Sprint 2（安全与审批）

目标：让 dApp 请求“可读、可判、可拒绝”。

- 中级：方法白名单
- 高级：安全审批增强
- 新手：本地模式提示优化

完成定义（DoD）：

- 每个请求都有清晰摘要和风险标签
- 高风险请求存在强确认门槛

## Sprint 3（架构升级）

目标：降低后续功能开发成本。

- 高级：交易状态机完整化
- 高级：Repository 抽象层
- 高级：硬件钱包 SDK 实接（一期）

完成定义（DoD）：

- 新增链路不需要改动多个 service 内部细节
- 关键模块有可替换接口

---

## 3. 任务模板（复制即用）

```text
任务名：
级别：新手 / 中级 / 高级
关联文件：
关联函数：
改动目标：
不做范围：
验收标准：
测试点：
风险与回滚：
```

---

## 4. 推荐执行顺序

1. 先做交易状态与日志可观测（Sprint 1）
2. 再做 dApp 安全审批（Sprint 2）
3. 最后做架构抽象和硬件钱包实接（Sprint 3）

这样可以先把“正确性”打稳，再扩展“复杂性”。
