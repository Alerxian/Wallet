# 05 - dApp 浏览器方案设计

## 目标

实现一个可用的内置 dApp 浏览器，满足：

- URL 输入与访问
- 页面导航（前进/后退/刷新）
- 书签保存
- 历史记录
- 从浏览器发起“连接钱包”动作（当前为模拟）

## 技术选型

- `webview_flutter`
  - iOS: WKWebView
  - Android: WebView

## 页面与状态

### 页面
- `screens/dapp_browser_screen.dart`

### 状态存储
- `WalletAppState.bookmarks`
- `WalletAppState.history`
- `WalletAppState.dappSessions`

## 关键流程

1. 打开 URL
2. `onPageFinished` 回调
3. 采集标题 + URL 写入历史
4. 用户点击“连接” -> 生成会话（模拟）

## 安全策略（已做/待做）

已做：
- URL 规范化（自动补 https）
- 会话列表可断开

待做：
- 恶意域名黑名单
- 交易请求审批页
- 签名方法白名单（`eth_sign`, `eth_sendTransaction` 等）
- 连接权限（只读/可签名）
