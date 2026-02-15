# 钱包应用需求文档

> 参照 Rabby Wallet 功能，完善当前钱包应用

## 文档说明

本文档基于 Rabby Wallet 的功能特性，结合当前项目现状，详细描述需要实现的功能模块及其实现原理。

---

## 一、Rabby Wallet 功能列表

### 1.1 核心钱包功能

#### 1.1.1 钱包管理

- **创建钱包**：生成助记词（12/24词），遵循 BIP39 标准
- **导入钱包**：支持助记词、私钥、Keystore 导入
- **多钱包管理**：支持创建和管理多个钱包账户
- **钱包切换**：快速在不同钱包间切换
- **地址簿**：保存常用地址和联系人
- **钱包备份**：导出助记词、私钥、Keystore

#### 1.1.2 资产管理

- **余额显示**：实时显示主币和代币余额
- **多币种支持**：自动识别 ERC-20、ERC-721、ERC-1155 代币
- **资产列表**：展示所有持有的代币和 NFT
- **资产搜索**：快速搜索和添加自定义代币
- **资产隐藏**：隐藏小额或不需要的代币
- **资产价值**：显示法币价值和涨跌幅

#### 1.1.3 交易功能

- **发送交易**：支持主币和 ERC-20 代币转账
- **接收资产**：显示二维码和地址
- **交易历史**：完整的交易记录和状态
- **交易详情**：查看交易哈希、区块、Gas 费等
- **交易加速/取消**：通过提高 Gas 费加速或取消待处理交易
- **批量转账**：一次性向多个地址转账

### 1.2 多链支持

#### 1.2.1 自动网络切换

- **智能检测**：自动识别 dApp 所需的区块链网络
- **无缝切换**：无需手动切换网络，自动适配
- **网络状态**：实时显示当前连接的网络

#### 1.2.2 支持的网络

- **主流 EVM 链**：Ethereum、BSC、Polygon、Arbitrum、Optimism、Avalanche 等
- **支持 140+ 链**：覆盖几乎所有 EVM 兼容链
- **自定义 RPC**：添加自定义网络和 RPC 节点
- **网络管理**：启用/禁用网络，设置默认网络

### 1.3 安全功能

#### 1.3.1 交易预览与模拟

- **交易模拟**：签名前模拟交易结果
- **余额变化预览**：显示交易后的资产变化（流入/流出）
- **可读性展示**：将复杂的合约调用转换为人类可读的描述
- **风险提示**：标注高风险操作（如无限授权）

#### 1.3.2 安全扫描

- **合约安全检测**：识别恶意合约和钓鱼网站
- **地址风险评估**：检查接收地址的安全性
- **授权管理**：查看和撤销代币授权
- **钓鱼警告**：标记已知的钓鱼网站和诈骗地址

#### 1.3.3 隐私保护

- **非托管设计**：私钥完全由用户控制
- **本地加密**：私钥加密存储在本地设备
- **生物识别**：支持指纹/面容 ID 解锁
- **自动锁定**：设置自动锁定时间

### 1.4 DeFi 功能

#### 1.4.1 代币兑换（Swap）

- **聚合交易所**：整合多个 DEX，获取最优价格
- **滑点设置**：自定义滑点容忍度
- **Gas 优化**：智能 Gas 费估算和优化
- **交易路径**：显示代币兑换路径

#### 1.4.2 DeFi 协议集成

- **协议连接**：连接 Uniswap、Aave、Compound 等主流协议
- **流动性挖矿**：查看和管理 LP 仓位
- **借贷管理**：查看借贷仓位和健康度
- **收益追踪**：实时追踪 DeFi 收益

### 1.5 NFT 功能

#### 1.5.1 NFT 管理

- **NFT 展示**：网格视图展示所有 NFT
- **NFT 详情**：查看 NFT 元数据、属性、历史
- **NFT 发送**：转移 NFT 到其他地址
- **NFT 收藏**：按集合分类展示

#### 1.5.2 NFT 市场

- **市场价格**：显示 NFT 地板价和市场数据
- **交易历史**：查看 NFT 交易记录

### 1.6 dApp 连接

#### 1.6.1 dApp 浏览器

- **内置浏览器**：直接在钱包内访问 dApp
- **dApp 收藏**：收藏常用 dApp
- **历史记录**：浏览历史和书签

#### 1.6.2 连接管理

- **连接请求**：审批 dApp 连接请求
- **已连接站点**：查看和管理已连接的 dApp
- **断开连接**：一键断开 dApp 连接
- **权限管理**：控制 dApp 的访问权限

### 1.7 投资组合追踪

#### 1.7.1 资产概览

- **总资产价值**：实时显示所有链上的总资产
- **资产分布**：按链、按代币类型分布图表
- **历史趋势**：资产价值历史曲线

#### 1.7.2 收益分析

- **收益统计**：计算总收益和收益率
- **交易分析**：分析交易盈亏
- **Gas 费统计**：统计总 Gas 费支出

### 1.8 用户体验

#### 1.8.1 界面设计

- **现代 UI**：简洁、直观的用户界面
- **深色模式**：支持浅色/深色主题切换
- **多语言**：支持多种语言

#### 1.8.2 便捷功能

- **快捷操作**：常用功能快速访问
- **搜索功能**：全局搜索代币、交易、地址
- **通知提醒**：交易状态、价格提醒
- **下拉刷新**：快速刷新数据

### 1.9 硬件钱包集成

- **Ledger 支持**：连接 Ledger 硬件钱包
- **Trezor 支持**：连接 Trezor 硬件钱包
- **硬件签名**：使用硬件钱包签名交易

---

## 二、当前项目功能对比

### 2.1 已实现功能 ✅

#### 钱包管理

- ✅ 创建钱包（助记词生成 12/24 词）
- ✅ 导入钱包（助记词、私钥）
- ✅ 助记词备份和验证
- ✅ 钱包列表管理
- ✅ 当前钱包切换
- ✅ 钱包删除
- ✅ 导出助记词/私钥

#### 安全存储

- ✅ 系统级加密存储（iOS Keychain / Android EncryptedSharedPreferences）
- ✅ 遵循 BIP39/BIP32/BIP44 标准
- ✅ 私钥和助记词加密存储

#### 用户界面

- ✅ 欢迎界面
- ✅ 创建钱包流程（生成→备份→验证）
- ✅ 导入钱包界面
- ✅ 主钱包界面（HomeScreen）
- ✅ 地址显示组件
- ✅ 基础 UI 组件（Button、Card、Input、Loading）

#### 导航系统

- ✅ 认证导航（AuthNavigator）
- ✅ 主应用导航（MainNavigator）
- ✅ 根导航（RootNavigator）
- ✅ 自动加载钱包状态

#### 状态管理

- ✅ Zustand 状态管理
- ✅ 钱包状态管理（walletStore）

#### 测试

- ✅ WalletService 单元测试（40 个测试）
- ✅ 工具函数测试

### 2.2 待实现功能 ❌

#### 核心功能

- ❌ 发送交易功能
- ❌ 接收界面（二维码）
- ❌ 交易历史记录
- ❌ 余额查询（RPC 集成）
- ❌ ERC-20 代币支持
- ❌ 交易签名和广播

#### 多链支持

- ❌ 多网络支持（仅支持 Ethereum 主网）
- ❌ 网络切换功能
- ❌ 自定义 RPC 节点
- ❌ 自动网络检测

#### 安全功能

- ❌ 交易预览和模拟
- ❌ 安全扫描和风险提示
- ❌ 授权管理
- ❌ 生物识别认证
- ❌ 自动锁定功能

#### DeFi 功能

- ❌ 代币兑换（Swap）
- ❌ DEX 聚合
- ❌ DeFi 协议集成
- ❌ 流动性挖矿管理

#### NFT 功能

- ❌ NFT 展示和管理
- ❌ NFT 转移
- ❌ NFT 市场数据

#### dApp 连接

- ❌ dApp 浏览器
- ❌ WalletConnect 集成
- ❌ dApp 连接管理

#### 投资组合

- ❌ 资产价值追踪
- ❌ 收益分析
- ❌ 图表展示

#### 用户体验

- ❌ 深色模式切换
- ❌ 多语言支持
- ❌ 通知系统
- ❌ 全局搜索

#### 硬件钱包

- ❌ Ledger 集成
- ❌ Trezor 集成

---

## 三、详细功能需求与实现原理

### 3.1 发送交易功能

#### 功能描述

用户可以发送 ETH 或 ERC-20 代币到指定地址，支持自定义 Gas 费和交易备注。

#### 实现原理

1. **交易构建**：
   - 使用 ethers.js 构建交易对象
   - 设置 to、value、data、gasLimit、gasPrice/maxFeePerGas
   - 对于 ERC-20，调用 transfer 方法编码 data

2. **交易签名**：
   - 从安全存储获取私钥
   - 使用 secp256k1 签名交易
   - 生成签名的 rawTransaction

3. **交易广播**：
   - 通过 RPC 节点发送 eth_sendRawTransaction
   - 获取交易哈希（txHash）
   - 保存交易记录到本地

4. **交易追踪**：
   - 轮询 eth_getTransactionReceipt 获取交易状态
   - 更新交易状态（pending → success/failed）

#### 技术要点

- 使用 ethers.js 的 Transaction 类
- Gas 费估算：eth_estimateGas
- Nonce 管理：eth_getTransactionCount
- 错误处理：余额不足、Gas 不足、网络错误

### 3.2 余额查询功能

#### 功能描述

实时查询钱包的 ETH 余额和 ERC-20 代币余额，显示法币价值。

#### 实现原理

1. **ETH 余额查询**：
   - 调用 RPC 方法：eth_getBalance(address, "latest")
   - 将 Wei 转换为 ETH（除以 10^18）

2. **ERC-20 余额查询**：
   - 调用合约方法：balanceOf(address)
   - 使用 eth_call 静态调用
   - 根据 decimals 转换余额

3. **价格查询**：
   - 集成 CoinGecko 或 CoinMarketCap API
   - 获取实时价格和 24h 涨跌幅
   - 计算法币价值

4. **批量查询优化**：
   - 使用 Multicall 合约批量查询多个代币
   - 减少 RPC 请求次数

#### 技术要点

- RPC 节点选择：Infura、Alchemy、QuickNode
- 缓存策略：避免频繁请求
- 错误重试：网络失败自动重试

### 3.3 多链支持

#### 功能描述

支持多个 EVM 链，自动检测 dApp 所需网络并切换。

#### 实现原理

1. **网络配置**：

   ```typescript
   interface Network {
     chainId: number;
     name: string;
     rpcUrl: string;
     symbol: string;
     explorer: string;
   }
   ```

2. **网络切换**：
   - 切换当前 RPC 端点
   - 更新 chainId
   - 重新查询余额和交易

3. **自动检测**：
   - 监听 dApp 的 wallet_switchEthereumChain 请求
   - 自动切换到目标链
   - 提示用户确认

4. **自定义网络**：
   - 允许用户添加自定义 RPC
   - 验证 RPC 可用性
   - 保存到本地配置

#### 技术要点

- 支持 EIP-3326（wallet_switchEthereumChain）
- 支持 EIP-3085（wallet_addEthereumChain）
- 网络状态管理

### 3.4 交易预览与模拟

#### 功能描述

在签名前模拟交易，显示资产变化和潜在风险，类似 Rabby 的核心功能。

#### 实现原理

1. **交易模拟**：
   - 使用 eth_call 模拟交易执行
   - 或使用 Tenderly API 进行高级模拟
   - 获取交易执行结果和状态变化

2. **资产变化分析**：
   - 解析交易日志（Logs）
   - 识别 Transfer 事件
   - 计算余额变化（流入/流出）

3. **合约解码**：
   - 使用 ABI 解码合约调用
   - 识别方法名和参数
   - 转换为人类可读的描述

4. **风险评估**：
   - 检测无限授权（approve(uint256.max)）
   - 识别可疑合约地址
   - 标注高风险操作

#### 技术要点

- 使用 ethers.js 解析交易
- 集成 Tenderly Simulation API
- 事件日志解析
- ABI 解码

### 3.5 安全扫描

#### 功能描述

检测恶意合约、钓鱼网站和高风险地址，保护用户资产安全。

#### 实现原理

1. **合约安全检测**：
   - 集成 GoPlus Security API
   - 检查合约是否开源
   - 检测蜜罐合约、代理合约
   - 分析合约权限（owner、mint、pause）

2. **地址风险评估**：
   - 查询地址黑名单数据库
   - 检查地址交易历史
   - 识别诈骗地址

3. **钓鱼网站检测**：
   - 维护钓鱼网站黑名单
   - 检查域名相似度
   - SSL 证书验证

4. **授权管理**：
   - 扫描所有代币授权
   - 显示授权的 spender 和额度
   - 一键撤销授权（approve(0)）

#### 技术要点

- GoPlus Security API
- ChainAbuse 数据库
- 本地黑名单维护
- 授权查询：Approval 事件

### 3.6 代币兑换（Swap）

#### 功能描述

集成 DEX 聚合器，为用户提供最优兑换价格和路径。

#### 实现原理

1. **DEX 聚合**：
   - 集成 1inch、0x、ParaSwap 等聚合器 API
   - 查询多个 DEX 的报价
   - 选择最优价格和路径

2. **交易构建**：
   - 获取 swap 交易的 data
   - 设置滑点容忍度
   - 计算最小接收量

3. **Gas 优化**：
   - 估算 Gas 费用
   - 提供快速/标准/慢速选项
   - 支持 EIP-1559（maxFeePerGas）

4. **交易执行**：
   - 签名并发送交易
   - 监控交易状态
   - 显示兑换结果

#### 技术要点

- 1inch Aggregation API
- 滑点计算
- Gas 费估算
- 交易路径展示

### 3.7 NFT 管理

#### 功能描述

展示、管理和转移用户的 NFT 资产。

#### 实现原理

1. **NFT 查询**：
   - 使用 Alchemy NFT API 或 Moralis API
   - 查询地址拥有的所有 NFT
   - 获取 NFT 元数据（图片、名称、属性）

2. **NFT 展示**：
   - 网格布局展示 NFT
   - 加载 IPFS 图片（通过网关）
   - 按集合分类

3. **NFT 转移**：
   - ERC-721：调用 transferFrom 或 safeTransferFrom
   - ERC-1155：调用 safeTransferFrom
   - 签名并发送交易

4. **NFT 详情**：
   - 显示 tokenId、合约地址
   - 显示属性和稀有度
   - 显示交易历史

#### 技术要点

- Alchemy NFT API
- IPFS 网关（Pinata、Cloudflare）
- ERC-721/ERC-1155 标准
- 元数据解析

### 3.8 dApp 连接（WalletConnect）

#### 功能描述

支持通过 WalletConnect 协议连接 dApp，签名交易和消息。

#### 实现原理

1. **WalletConnect 集成**：
   - 使用 @walletconnect/react-native-dapp
   - 扫描二维码或深度链接连接
   - 建立加密通信通道

2. **连接管理**：
   - 保存已连接的 dApp 会话
   - 显示连接状态
   - 断开连接

3. **请求处理**：
   - eth_sendTransaction：签名并发送交易
   - personal_sign：签名消息
   - eth_signTypedData：签名结构化数据
   - wallet_switchEthereumChain：切换网络

4. **安全确认**：
   - 显示请求详情
   - 用户确认后执行
   - 拒绝可疑请求

#### 技术要点

- WalletConnect v2 协议
- 深度链接处理
- 会话管理
- 签名方法实现

### 3.9 生物识别认证

#### 功能描述

使用指纹或面容 ID 保护钱包，提升安全性和便捷性。

#### 实现原理

1. **生物识别检测**：
   - 使用 expo-local-authentication
   - 检查设备是否支持生物识别
   - 获取支持的认证类型

2. **认证流程**：
   - 用户启用生物识别
   - 在敏感操作前触发认证
   - 认证成功后执行操作

3. **应用场景**：
   - 打开应用时认证
   - 发送交易前认证
   - 导出私钥前认证
   - 修改设置前认证

4. **降级方案**：
   - 生物识别失败后使用密码
   - 设备不支持时仅使用密码

#### 技术要点

- expo-local-authentication
- 认证状态管理
- 错误处理

### 3.10 投资组合追踪

#### 功能描述

实时追踪用户的资产价值、收益和交易统计。

#### 实现原理

1. **资产聚合**：
   - 查询所有链上的资产
   - 获取代币价格
   - 计算总资产价值

2. **历史数据**：
   - 记录每日资产快照
   - 存储到本地数据库
   - 生成历史曲线

3. **收益计算**：
   - 计算持仓成本
   - 计算当前价值
   - 计算收益率和盈亏

4. **图表展示**：
   - 使用 react-native-chart-kit
   - 资产分布饼图
   - 价值趋势折线图

#### 技术要点

- 价格 API（CoinGecko）
- 本地数据库（SQLite）
- 图表库
- 数据聚合算法

### 3.11 交易历史

#### 功能描述

显示钱包的所有交易记录，包括发送、接收、合约交互。

#### 实现原理

1. **交易查询**：
   - 使用 Etherscan API 或 Alchemy API
   - 查询地址的所有交易
   - 分页加载

2. **交易分类**：
   - 发送：from = 当前地址
   - 接收：to = 当前地址
   - 合约交互：to = 合约地址

3. **交易解析**：
   - 解析 input data
   - 识别方法调用
   - 显示可读描述

4. **本地缓存**：
   - 缓存已查询的交易
   - 定期同步新交易
   - 减少 API 请求

#### 技术要点

- Etherscan API
- 交易解析
- 分页加载
- 本地缓存

---

## 四、技术架构

### 4.1 技术栈

#### 前端框架

- **React Native**：跨平台移动应用框架
- **Expo**：React Native 开发工具链
- **TypeScript**：类型安全

#### 状态管理

- **Zustand**：轻量级状态管理

#### 导航

- **React Navigation**：路由和导航

#### 区块链交互

- **ethers.js**：以太坊库
- **@scure/bip39**：助记词生成
- **@scure/bip32**：HD 钱包
- **@noble/secp256k1**：椭圆曲线加密

#### 安全存储

- **expo-secure-store**：系统级加密存储

#### 网络请求

- **axios**：HTTP 客户端

#### UI 组件

- **react-native-svg**：SVG 支持
- **react-native-chart-kit**：图表
- **react-native-qrcode-svg**：二维码

### 4.2 项目结构

```
src/
├── components/           # 可复用组件
│   ├── common/          # 通用组件
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Loading.tsx
│   ├── wallet/          # 钱包组件
│   │   ├── AddressDisplay.tsx
│   │   ├── MnemonicGrid.tsx
│   │   └── TransactionItem.tsx
│   └── nft/             # NFT 组件
│       └── NFTCard.tsx
├── navigation/           # 导航配置
│   ├── AuthNavigator.tsx
│   ├── MainNavigator.tsx
│   └── RootNavigator.tsx
├── screens/              # 页面组件
│   ├── Auth/            # 认证页面
│   │   └── WelcomeScreen.tsx
│   ├── CreateWallet/    # 创建钱包
│   │   ├── GenerateMnemonicScreen.tsx
│   │   ├── BackupMnemonicScreen.tsx
│   │   └── VerifyMnemonicScreen.tsx
│   ├── ImportWallet/    # 导入钱包
│   │   └── ImportWalletScreen.tsx
│   ├── Home/            # 主页
│   │   └── HomeScreen.tsx
│   ├── Send/            # 发送
│   │   └── SendScreen.tsx
│   ├── Receive/         # 接收
│   │   └── ReceiveScreen.tsx
│   ├── Swap/            # 兑换
│   │   └── SwapScreen.tsx
│   ├── NFT/             # NFT
│   │   ├── NFTListScreen.tsx
│   │   └── NFTDetailScreen.tsx
│   ├── Settings/        # 设置
│   │   ├── SettingsScreen.tsx
│   │   ├── NetworksScreen.tsx
│   │   └── SecurityScreen.tsx
│   └── Transaction/     # 交易
│       ├── TransactionListScreen.tsx
│       └── TransactionDetailScreen.tsx
├── services/             # 业务逻辑服务
│   ├── WalletService.ts      # 钱包服务
│   ├── StorageService.ts     # 存储服务
│   ├── BiometricService.ts   # 生物识别
│   ├── TransactionService.ts # 交易服务
│   ├── TokenService.ts       # 代币服务
│   ├── NFTService.ts         # NFT 服务
│   ├── NetworkService.ts     # 网络服务
│   ├── PriceService.ts       # 价格服务
│   └── SecurityService.ts    # 安全服务
├── store/                # 状态管理
│   ├── walletStore.ts
│   ├── networkStore.ts
│   ├── tokenStore.ts
│   └── settingsStore.ts
├── theme/                # 主题配置
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
├── types/                # TypeScript 类型
│   ├── wallet.types.ts
│   ├── transaction.types.ts
│   ├── token.types.ts
│   └── network.types.ts
├── utils/                # 工具函数
│   ├── constants.ts
│   ├── validation.ts
│   ├── format.ts
│   └── helpers.ts
└── api/                  # API 客户端
    ├── rpc.ts
    ├── etherscan.ts
    ├── coingecko.ts
    └── goplus.ts
```

### 4.3 数据流

```
用户操作 → UI 组件 → Store Action → Service → API/RPC → 区块链
                ↓                                    ↓
            Store State ← Service Response ← API Response
                ↓
            UI 更新
```

---

## 五、开发优先级

### 5.1 第一阶段：核心交易功能（P0）✅

#### 目标

实现基本的发送、接收和交易历史功能。

#### 任务列表

1. **发送功能** ✅
   - [x] 创建 SendScreen 界面
   - [x] 实现 TransactionService
   - [x] 交易签名和广播
   - [x] Gas 费估算
   - [x] 交易状态追踪

2. **接收功能** ✅
   - [x] 创建 ReceiveScreen 界面
   - [x] 生成二维码
   - [x] 地址复制功能

3. **余额查询** ✅
   - [x] 集成 RPC 节点（Infura/Alchemy）
   - [x] 实现 ETH 余额查询
   - [x] 实现 ERC-20 余额查询
   - [x] 余额自动刷新

4. **交易历史** ✅
   - [x] 集成 Etherscan API
   - [x] 创建 TransactionListScreen
   - [x] 交易详情页面
   - [x] 本地缓存

### 5.2 第二阶段：多链与代币（P1）

#### 目标

支持多个 EVM 链和 ERC-20 代币管理。

#### 任务列表

1. **多链支持**
   - [x] 网络配置管理
   - [x] 网络切换功能
   - [x] 自定义 RPC
   - [x] 多链余额查询

2. **代币管理**
   - [x] 代币列表展示
   - [x] 添加自定义代币
   - [x] 代币搜索
   - [x] 代币隐藏

3. **价格集成**
   - [x] 集成 CoinGecko API
   - [x] 实时价格更新
   - [x] 法币价值显示
   - [x] 涨跌幅显示

### 5.3 第三阶段：安全功能（P1）

#### 目标

增强安全性，保护用户资产。

#### 任务列表

1. **交易预览**
   - [ ] 交易模拟
   - [ ] 资产变化预览
   - [ ] 合约解码
   - [ ] 风险提示

2. **安全扫描**
   - [ ] 集成 GoPlus API
   - [ ] 合约安全检测
   - [ ] 地址风险评估
   - [ ] 授权管理

3. **生物识别**
   - [ ] 集成 expo-local-authentication
   - [ ] 应用锁定
   - [ ] 敏感操作认证

### 5.4 第四阶段：DeFi 与 NFT（P2）

#### 目标

支持 DeFi 和 NFT 功能。

#### 任务列表

1. **代币兑换**
   - [x] 集成 1inch API
   - [x] Swap 界面
   - [x] 滑点设置
   - [x] 交易路径展示

2. **NFT 管理**
   - [x] 集成 Alchemy NFT API
   - [x] NFT 列表展示
   - [x] NFT 详情页面
   - [x] NFT 转移功能

3. **DeFi 集成**
   - [x] DeFi 协议连接
   - [x] 流动性挖矿
   - [x] 借贷管理

### 5.5 第五阶段：高级功能（P3）

#### 目标

提升用户体验和功能完整性。

#### 任务列表

1. **dApp 连接**
   - [x] WalletConnect 集成
   - [x] 连接管理
   - [ ] dApp 浏览器

2. **投资组合**
   - [x] 资产追踪
   - [x] 收益分析
   - [x] 图表展示

3. **用户体验**
   - [x] 深色模式（框架）
   - [x] 多语言支持（框架）
   - [x] 通知系统（开关）
   - [ ] 全局搜索

4. **硬件钱包**
   - [x] Ledger 集成（框架）
   - [x] Trezor 集成（框架）

---

## 六、API 与服务集成

### 6.1 RPC 节点

#### Infura

- **用途**：以太坊和 EVM 链 RPC 访问
- **端点**：`https://mainnet.infura.io/v3/YOUR_API_KEY`
- **功能**：余额查询、交易发送、区块查询

#### Alchemy

- **用途**：增强的以太坊 API
- **端点**：`https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
- **功能**：NFT API、交易历史、WebSocket

### 6.2 区块浏览器 API

#### Etherscan

- **用途**：交易历史、合约 ABI
- **端点**：`https://api.etherscan.io/api`
- **功能**：
  - 交易列表：`?module=account&action=txlist`
  - ERC-20 交易：`?module=account&action=tokentx`
  - 合约 ABI：`?module=contract&action=getabi`

### 6.3 价格 API

#### CoinGecko

- **用途**：加密货币价格和市场数据
- **端点**：`https://api.coingecko.com/api/v3`
- **功能**：
  - 价格查询：`/simple/price`
  - 市场数据：`/coins/markets`
  - 历史价格：`/coins/{id}/market_chart`

### 6.4 安全 API

#### GoPlus Security

- **用途**：合约安全检测
- **端点**：`https://api.gopluslabs.io/api/v1`
- **功能**：
  - 代币安全：`/token_security/{chainId}`
  - 地址安全：`/address_security/{address}`
  - 授权检测：`/approval_security/{chainId}`

### 6.5 DEX 聚合器

#### 1inch

- **用途**：代币兑换聚合
- **端点**：`https://api.1inch.dev/swap/v5.2/{chainId}`
- **功能**：
  - 报价：`/quote`
  - Swap：`/swap`
  - 流动性来源：`/liquidity-sources`

### 6.6 NFT API

#### Alchemy NFT API

- **用途**：NFT 数据查询
- **功能**：
  - 获取 NFT：`getNFTs`
  - NFT 元数据：`getNFTMetadata`
  - 集合信息：`getContractMetadata`

---

## 七、安全考虑

### 7.1 私钥安全

#### 存储

- ✅ 使用系统级加密存储（Keychain/EncryptedSharedPreferences）
- ✅ 私钥永不以明文形式存储
- ✅ 私钥永不通过网络传输

#### 使用

- 仅在签名时从安全存储读取
- 签名后立即清除内存
- 使用完毕后销毁私钥对象

### 7.2 网络安全

#### HTTPS

- 所有 API 请求使用 HTTPS
- 验证 SSL 证书
- 防止中间人攻击

#### RPC 安全

- 使用可信的 RPC 节点
- 支持自定义 RPC（用户自行承担风险）
- 验证 RPC 响应

### 7.3 交易安全

#### 签名前验证

- 验证接收地址格式
- 检查余额是否足够
- 估算 Gas 费用
- 显示交易详情供用户确认

#### 风险提示

- 无限授权警告
- 可疑合约警告
- 高 Gas 费警告
- 大额转账二次确认

### 7.4 应用安全

#### 认证

- 生物识别认证
- 自动锁定
- 防截屏（敏感页面）

#### 数据保护

- 敏感数据加密
- 日志脱敏
- 防调试

---

## 八、测试策略

### 8.1 单元测试

#### 测试范围

- WalletService：钱包创建、导入、导出
- TransactionService：交易构建、签名
- ValidationUtils：地址、私钥、助记词验证
- FormatUtils：余额格式化、地址格式化

#### 工具

- Jest
- @testing-library/react-native

### 8.2 集成测试

#### 测试范围

- 创建钱包流程
- 导入钱包流程
- 发送交易流程
- 网络切换

### 8.3 端到端测试

#### 测试范围

- 完整的用户流程
- 跨页面交互
- 真实网络请求（测试网）

#### 工具

- Detox

### 8.4 安全测试

#### 测试范围

- 私钥泄露测试
- 中间人攻击测试
- 恶意合约测试
- 钓鱼攻击测试

---

## 九、性能优化

### 9.1 网络优化

- **请求合并**：使用 Multicall 批量查询
- **缓存策略**：缓存余额、交易历史
- **懒加载**：分页加载交易历史
- **预加载**：预加载常用数据

### 9.2 渲染优化

- **虚拟列表**：使用 FlatList 渲染长列表
- **图片优化**：压缩和缓存图片
- **防抖节流**：搜索、滚动事件优化
- **Memo 优化**：避免不必要的重渲染

### 9.3 存储优化

- **数据压缩**：压缩大数据
- **定期清理**：清理过期缓存
- **索引优化**：数据库索引

---

## 十、参考资料

### 官方文档

- [Rabby Wallet](https://rabby.io/)
- [Ethereum JSON-RPC](https://ethereum.org/en/developers/docs/apis/json-rpc/)
- [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559)
- [BIP39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [BIP44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)

### API 文档

- [Infura Documentation](https://docs.infura.io/)
- [Alchemy Documentation](https://docs.alchemy.com/)
- [Etherscan API](https://docs.etherscan.io/)
- [CoinGecko API](https://www.coingecko.com/en/api)
- [GoPlus Security API](https://docs.gopluslabs.io/)
- [1inch API](https://docs.1inch.io/)

### 开源项目

- [MetaMask Mobile](https://github.com/MetaMask/metamask-mobile)
- [Rainbow Wallet](https://github.com/rainbow-me/rainbow)
- [Trust Wallet](https://github.com/trustwallet/wallet-core)

### 搜索来源

- [Rabby Wallet Review - GN Crypto News](https://www.gncrypto.news/news/rabby-wallet-review/)
- [Rabby Wallet Features Guide](https://install-en-rabby-wallet.pages.dev/)
- [Rabby Wallet vs MetaMask - Messari](https://messari.io/compare/rabby-wallet-vs-metamask)
- [Rabby Wallet Setup Guide 2026](https://www.themarketsunplugged.com/rabby-wallet-extension-setup-safety-guide-2026/)

---

## 附录：术语表

- **助记词（Mnemonic）**：12 或 24 个单词，用于恢复钱包
- **私钥（Private Key）**：64 位十六进制字符串，控制钱包资产
- **HD 钱包（Hierarchical Deterministic Wallet）**：分层确定性钱包，从一个种子派生多个密钥
- **Gas**：以太坊交易的计算费用
- **ERC-20**：以太坊代币标准
- **ERC-721**：以太坊 NFT 标准
- **ERC-1155**：以太坊多代币标准
- **DEX**：去中心化交易所
- **dApp**：去中心化应用
- **RPC**：远程过程调用，与区块链交互的接口
- **ABI**：应用程序二进制接口，合约调用规范
- **Nonce**：交易序号，防止重放攻击
- **Slippage**：滑点，实际价格与预期价格的差异

---

**文档版本**：v1.0
**创建日期**：2026-02-14
**最后更新**：2026-02-14
