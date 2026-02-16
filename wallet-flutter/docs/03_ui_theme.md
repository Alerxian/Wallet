# 03 - UI/交互与主题重构

## 设计方向

- 主色：中性偏绿（`#2E8B72`），避免荧光绿
- 背景：低对比浅绿灰，提高信息层次
- 卡片：大圆角 + 轻边框
- 首页：Hero 资产卡 + 快速操作 + 模块入口

## 核心改造

1. `core/theme.dart`
   - Light/Dark 双主题
   - 输入框、按钮、卡片统一视觉

2. `widgets/common.dart`
   - `HeroBalanceCard`：首页资产主卡
   - `SectionCard`：模块化信息容器
   - `EmptyHint`：空状态统一提示

3. `screens/home_screen.dart`
   - 顶部安全提示（可开关）
   - 主资产卡（余额/地址/发送接收交换）
   - 快捷网格导航

## 交互原则

- 关键操作默认可见（发送/接收/Swap）
- 设置入口放右上角，搜索单独入口
- dApp 相关功能集中在 dApp 模块，不分散
