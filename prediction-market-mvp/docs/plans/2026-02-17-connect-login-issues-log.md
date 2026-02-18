# Connect / Login Issues Log

## 1. 文档目的

记录移动端 WalletConnect 登录链路中出现的关键问题、根因、修复动作与当前状态，避免重复踩坑。

## 2. 当前链路概览

当前登录链路：

1. App 初始化 WalletConnect `SignClient`
2. `Connect` 发起 WalletConnect 会话
3. 跳转 MetaMask 授权
4. 授权后拿到 session/account
5. 发起 SIWE（nonce -> signature -> verify）
6. 后端返回 session token
7. 拉取 positions/history

## 3. 问题清单（按时间）

### C-001 `Cannot reach backend 127.0.0.1`

- 现象：安卓真机扫码 Expo 后，页面提示无法访问 backend。
- 根因：真机无法访问本机回环地址 `127.0.0.1`。
- 修复：
  - Backend 改为监听 `0.0.0.0`
  - 默认 Backend URL 固定为 `http://192.168.0.103:3001`
- 状态：已修复。

### C-002 `react-native-compat: Application module is not available`

- 现象：点击 Connect 报 `Application module is not available`。
- 根因：缺少 `expo-application` 依赖，compat 模块初始化失败。
- 修复：
  - 安装 `expo-application`
  - 在入口 `index.js` 预加载 `@walletconnect/react-native-compat`
- 状态：已修复。

### C-003 `failed to publish custom payload`

- 现象：Connect 很慢且登录失败，报 relay 发布 payload 失败。
- 根因：网络到 WalletConnect relay 不稳定/被拦截。
- 修复：
  - 连接流程增加超时和重试
  - 增加主备 relay 切换：
    - `wss://relay.walletconnect.com`
    - `wss://relay.walletconnect.org`
  - UI 增加 relay 与错误显示
- 状态：部分修复（依赖网络环境，非纯代码可控）。

### C-004 MetaMask 授权后不回跳，App 显示未连接

- 现象：MetaMask 授权成功，但未自动回 App；手动回 App 仍显示未连接。
- 根因：Expo Go 下深链回跳不稳定，且缺少回前台 session 恢复兜底。
- 修复：
  - 增加 app `scheme`（`predictionmvp://`）
  - WalletConnect metadata 增加 `redirect.native`
  - App 从后台切回前台时自动恢复现有 session
- 状态：已修复（Expo Go 仍可能不自动回跳，但可手动回 App 恢复）。

### C-005 `missing or invalid request chainId 31337`

- 现象：MetaMask 授权后登录失败，报 chainId 无效。
- 根因：签名请求 chainId 固定写死 `31337`，与会话实际 chain 不一致。
- 修复：
  - 请求签名与发交易统一使用 session 实际 chainId
  - SIWE message 的 `Chain ID` 改为 session chainId
- 状态：已修复。

### C-006 MetaMask 添加 Anvil 网络报“URL 与链 ID 不匹配”

- 现象：MetaMask 无法添加本地网络。
- 根因：Anvil 只监听 `127.0.0.1`，手机访问不到 RPC，MetaMask 无法读取 `eth_chainId`。
- 修复：
  - Anvil 改为 `--host 0.0.0.0 --port 8545`
  - 验证 `http://192.168.0.103:8545` 返回 `0x7a69`（31337）
- 状态：已修复。

## 4. 仍存在的非代码风险

- 网络风险：当前网络对 WalletConnect relay 的可达性不稳定（可能超时/重置）。
- Expo Go 限制：自动深链回跳不如 Dev Client 稳定。
- 钱包配置风险：MetaMask 必须正确配置并切换到目标链（Anvil 31337）。

## 5. 标准排查顺序

1. 后端连通：手机浏览器访问 `http://192.168.0.103:3001/health`
2. RPC 连通：手机浏览器访问 `http://192.168.0.103:8545` 的 `eth_chainId`（通过钱包配置验证）
3. 钱包网络：MetaMask 当前链是否为 `31337`
4. Relay 可达：若仍报 `publish custom payload`，优先排查代理/VPN/网络策略
5. 回跳问题：若不自动回跳，手动切回 App，观察是否自动恢复 session

## 6. 建议下一步（稳定性优先）

- 短期：继续保留“手动回 App 自动恢复 session”的兜底。
- 中期：切换到 Expo Dev Client（替代 Expo Go）提升深链稳定性。
- 中期：提供开发模式备用登录（仅本地调试）降低 relay 依赖。
