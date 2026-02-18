# Flutter 钱包项目任务映射迭代看板

适用项目：`wallet-flutter`

目标：把“函数级导读附录”直接转化为可分配任务，支持按角色分工和按迭代推进。

---

## 1. 角色分层任务池

## 1.1 新手任务（低风险，2-6 小时/项）

1) 发送页提示文案修正

- 关联文件：`wallet-flutter/lib/screens/send_screen.dart`
- 目标：将“模拟广播”文案改为真实主币广播语义
- 验收：发送成功提示与真实行为一致

2) 设置页破坏性操作确认弹窗

- 关联文件：`wallet-flutter/lib/screens/settings_screen.dart`
- 目标：`clearAll` 前增加二次确认
- 验收：误触不会直接清空数据

3) 交易列表状态颜色统一

- 关联文件：`wallet-flutter/lib/screens/tx_history_screen.dart`
- 目标：pending/success/failed 图标与颜色统一主题语义
- 验收：各状态视觉识别明确

4) dApp 浏览器 URL 输入容错优化

- 关联文件：`wallet-flutter/lib/screens/dapp_browser_screen.dart`
- 目标：非法 URL 提示、空输入提示
- 验收：无效输入不崩溃且有反馈

## 1.2 中级任务（中风险，0.5-2 天/项）

1) 交易回执轮询同步

- 关联函数：`EvmService.fetchTxReceiptAsModel`、`WalletAppState.send`
- 目标：发送后自动轮询回执并更新 `transactions`
- 验收：pending 可自动变 success/failed

2) PriceService 增加缓存与重试

- 关联文件：`wallet-flutter/lib/services/price_service.dart`
- 目标：避免价格接口抖动影响首页
- 验收：接口失败时应用仍可展示最近价格

3) ERC-20 余额读取（一期）

- 关联文件：`wallet-flutter/lib/services/evm_service.dart`、`wallet-flutter/lib/state/wallet_app_state.dart`
- 目标：在当前网络下读取 ERC-20 余额并回写 token
- 验收：非主币余额可真实显示

4) dApp 历史与书签管理能力补强

- 关联函数：`addHistory/addBookmark/removeBookmark`
- 目标：增加去重策略、排序策略和上限策略一致性
- 验收：历史/书签行为符合预期且可持久化恢复

## 1.3 高级任务（高风险，2-5 天/项）

1) 状态层拆分

- 关联文件：`wallet-flutter/lib/state/wallet_app_state.dart`
- 目标：拆为 Wallet/Portfolio/Dapp/Settings 多状态域
- 验收：功能不回归，单文件体量显著下降

2) ERC-20 发送全链路

- 关联文件：`wallet-flutter/lib/services/evm_service.dart`、`wallet-flutter/lib/screens/send_screen.dart`
- 目标：支持合约调用发送 ERC-20
- 验收：测试网完成真实 ERC-20 转账

3) dApp 审批与权限模型

- 关联模块：`dapp_browser_screen.dart` + `WalletAppState.dappSessions`
- 目标：按账户/链/方法维护会话权限
- 验收：超权限请求可识别并阻断

4) 持久化升级（结构化）

- 目标：从大量 JSON 串逐步迁移到结构化存储
- 验收：关键数据读写性能与一致性提升

---

## 2. Sprint 看板（建议 3 个迭代）

## Sprint 1（主链路正确性）

目标：让“发送 -> 历史 -> 状态”闭环可信。

- 中级：交易回执轮询同步
- 中级：PriceService 缓存与重试
- 新手：发送页文案修正
- 新手：clearAll 二次确认

完成定义（DoD）：

- 交易状态可自动更新
- 价格接口异常时 UI 仍可用

## Sprint 2（资产能力扩展）

目标：从“主币钱包”升级为“多资产钱包”。

- 中级：ERC-20 余额读取
- 高级：ERC-20 发送全链路
- 新手：交易状态视觉统一

完成定义（DoD）：

- 首页可展示至少一种 ERC-20 真实余额
- 发送页可发送 ERC-20（测试网验证）

## Sprint 3（架构与安全）

目标：降低耦合并提升 dApp 安全治理能力。

- 高级：状态层拆分
- 高级：dApp 权限模型
- 中级：dApp 历史/书签策略补强

完成定义（DoD）：

- 关键状态域解耦
- dApp 会话权限可控可追踪

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

## 4. 测试映射建议

新手任务：

- 以手工回归为主（页面路径验证）

中级任务：

- 增加服务层 mock 测试
- 增加状态动作行为测试

高级任务：

- 增加集成测试（创建钱包->切网->发送->状态更新）
- 引入 CI 自动执行分析和测试

---

## 5. 推荐执行顺序

1. 先修主链路状态正确性（Sprint 1）
2. 再扩资产能力（Sprint 2）
3. 最后做架构拆分和 dApp 安全治理（Sprint 3）

这个顺序能保证每次迭代都“可见收益 + 可控风险”。
