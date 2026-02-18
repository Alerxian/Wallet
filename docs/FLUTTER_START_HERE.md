# Flutter 入门手册（基于本项目 wallet-flutter）

这份文档写给“完全没接触过 Flutter”的同学。

目标：你读完后可以做到：

- 在本机把 `wallet-flutter` 跑起来（iOS 模拟器）
- 看懂项目的目录结构
- 能找到一个页面的 UI 代码、路由入口、对应的状态和数据
- 会新增一个页面、加一个按钮、改一个状态字段

本仓库里还有一个 React Native 项目 `wallet-clean`，它不需要改；Flutter 版在 `wallet-flutter`。

---

## 0. 你需要知道的最小概念

Flutter = 用 Dart 写 UI + 逻辑。

- “页面”就是一个 `Widget`（小组件）
- 一个页面通常是一个 `StatelessWidget`（无状态）或 `StatefulWidget`（有状态）
- Flutter 通过 `build()` 函数把 UI “画出来”
- 你点按钮 -> 调用某个函数改数据 -> 通知 UI 刷新

在本项目里：

- UI 在 `wallet-flutter/lib/screens/`
- 状态（数据）在 `wallet-flutter/lib/state/wallet_app_state.dart`
- 路由（页面跳转表）在 `wallet-flutter/lib/ui/routes.dart`
- 主题（颜色、卡片样式等）在 `wallet-flutter/lib/core/theme.dart`

---

## 1. 如何运行（从 0 到打开 App）

### 1.1 打开终端，进入 Flutter 项目目录

```bash
cd /Users/cherry/Desktop/WorkPro/wallet-flutter
```

### 1.2 检查 Flutter 是否正常

```bash
flutter --version
flutter doctor -v
```

你看到类似这些就是 OK：

- Flutter: ✓
- Xcode: ✓
- Connected device: 有 iOS Simulator

注意：`Android toolchain` 目前是 ✗（没有 Android SDK），这不影响你先在 iOS 模拟器上跑。

### 1.3 下载依赖

```bash
flutter pub get
```

### 1.4 启动 iOS 模拟器并运行

方式 A：直接运行（Flutter 会选择一个设备）

```bash
flutter run
```

方式 B：指定设备（推荐新手）

先列出设备：

```bash
flutter devices
```

再运行（把 id 换成你的设备 id）：

```bash
flutter run -d <device-id>
```

运行后你会看到：

- App 出现在 iOS 模拟器
- 终端里会出现一些快捷命令：
  - `r` 热更新（推荐）
  - `R` 重启
  - `q` 退出

---

## 2. 项目结构（你应该先看哪里）

项目根目录：`/Users/cherry/Desktop/WorkPro`

- `wallet-clean/`：React Native 项目（不用动）
- `wallet-flutter/`：Flutter 项目（我们关注这个）
- `FLUTTER_START_HERE.md`：就是这份文档

Flutter 项目目录（最重要）：

```text
wallet-flutter/
  lib/                  # 99% 的代码都在这里
    main.dart           # 程序入口
    app.dart            # 顶层 MaterialApp + Provider
    core/theme.dart     # 主题配置
    ui/routes.dart      # 路由表（页面跳转）
    models/models.dart  # 数据结构（Model）
    state/wallet_app_state.dart  # 全局状态（数据 + 方法）
    widgets/common.dart # 通用小组件
    screens/            # 所有页面
  pubspec.yaml          # 依赖配置
  ios/ android/ web/ macos/  # 各平台工程（flutter create 自动生成）
```

你作为新手的阅读顺序建议：

1. `wallet-flutter/lib/main.dart`
2. `wallet-flutter/lib/app.dart`
3. `wallet-flutter/lib/ui/routes.dart`
4. `wallet-flutter/lib/screens/home_screen.dart`
5. `wallet-flutter/lib/state/wallet_app_state.dart`

---

## 3. 程序从哪里开始执行？（入口）

入口文件：`wallet-flutter/lib/main.dart`

```dart
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const WalletApp());
}
```

你可以把它理解为：

- `main()` 是程序开始
- `runApp(...)` 把“根组件”启动起来
- 根组件是 `WalletApp`（在 `wallet-flutter/lib/app.dart`）

---

## 4. 顶层架构（Provider + MaterialApp + Route）

看 `wallet-flutter/lib/app.dart`：

核心结构是：

1. `ChangeNotifierProvider`：把全局状态 `WalletAppState` 放到整个 App 里
2. `MaterialApp`：Flutter 的应用外壳（主题、路由等都在这）

关键代码：

- `create: (_) => WalletAppState()..init()`
  - 创建状态对象
  - 并调用 `init()` 从本地读取钱包/交易历史/主题设置

- `theme/darkTheme/themeMode`
  - 控制浅色/深色

- `onGenerateRoute: buildRoute`
  - 所有页面跳转都走 `wallet-flutter/lib/ui/routes.dart` 里的 `buildRoute()`

---

## 5. 路由（页面跳转）怎么做？

路由文件：`wallet-flutter/lib/ui/routes.dart`

它做两件事：

1. 统一定义路由字符串（避免你手写路径写错）

```dart
class Routes {
  static const String home = '/home';
  static const String send = '/send';
  // ...
}
```

2. 把“路由名”映射到“页面 Widget”

```dart
Route<dynamic> buildRoute(RouteSettings settings) {
  switch (settings.name) {
    case Routes.home:
      return MaterialPageRoute(builder: (_) => const HomeScreen());
    // ...
  }
}
```

页面里怎么跳转？比如从首页去设置：

```dart
Navigator.pushNamed(context, Routes.settings);
```

你只要记住：

- `Navigator.pushNamed` = 打开新页面
- `Navigator.pop` = 返回上一页

---

## 6. 状态（数据）放哪里？怎么刷新 UI？

状态文件：`wallet-flutter/lib/state/wallet_app_state.dart`

它是一个类：

```dart
class WalletAppState extends ChangeNotifier {
  // 数据（字段）
  // 方法（函数）
}
```

你可以把它理解成“全局数据仓库”。

### 6.1 这里存了哪些数据？

常见字段：

- `WalletAccount? currentWallet`：当前钱包
- `List<TokenBalance> tokens`：资产列表（示例数据）
- `List<WalletTransaction> transactions`：交易历史（会存本地）
- `ThemeMode themeMode`：主题
- `String activeNetwork`：当前网络

### 6.2 UI 怎么读这些数据？

在页面里（例如 `wallet-flutter/lib/screens/home_screen.dart`）：

```dart
final state = context.watch<WalletAppState>();
```

`watch` 的意思是：

- 你在 build 里用到了 `state`
- 只要 `state.notifyListeners()` 被调用，这个页面会自动重新 build

### 6.3 UI 怎么调用方法改数据？

比如发送交易页 `wallet-flutter/lib/screens/send_screen.dart`，点击按钮时：

```dart
await context.read<WalletAppState>().send(...);
```

`read` 的意思是：

- 只是调用方法，不关心自动刷新

当 `send()` 内部做了：

```dart
notifyListeners();
```

所有 `watch` 了这个状态的页面都会更新。

---

## 7. 本项目的数据流（你点一下按钮会发生什么）

以“发送交易”为例：

1. 你在 `SendScreen` 输入地址和数量
2. 点击“确认发送”
3. 调用 `WalletAppState.send(to, amount, symbol)`
4. `send()` 创建一条 `WalletTransaction`，插入到 `transactions` 列表
5. `send()` 把交易列表写到本地（`SharedPreferences`）
6. `send()` 调用 `notifyListeners()`
7. 首页/交易历史页重新 build，展示新交易

同样逻辑也适用于：

- 创建钱包（`createWallet`）
- 导入钱包（`importWallet`）
- 切换主题（`updateTheme`）

---

## 8. Model（数据结构）是什么？在哪里？

Model 文件：`wallet-flutter/lib/models/models.dart`

这里定义了“我们要存/要显示的数据形状”，例如：

- `WalletAccount`：钱包（name/address/mnemonic）
- `TokenBalance`：代币余额
- `WalletTransaction`：交易

你会看到 `toMap()` / `fromMap()`：

- 把对象转成 Map（为了存储）
- 从 Map 还原对象

另外还有：

- `encodeTxList(...)` / `decodeTxList(...)`
  - 把交易列表转 JSON 字符串
  - 或从 JSON 字符串还原成列表

---

## 9. UI 是怎么写的？（看懂一段页面代码）

先看 `wallet-flutter/lib/screens/welcome_screen.dart`：

它是一个 `StatelessWidget`（无状态页面），核心方法是：

```dart
@override
Widget build(BuildContext context) {
  return Scaffold(
    body: ...,
  );
}
```

你只需要理解 3 个常见 UI 容器：

- `Scaffold`：页面骨架（AppBar、Body）
- `Column/Row`：竖排/横排布局
- `Padding/SizedBox`：间距

按钮一般是：

- `FilledButton`（主要按钮）
- `OutlinedButton`（次要按钮）

---

## 10. 本项目的通用组件（让 UI 更统一）

通用组件文件：`wallet-flutter/lib/widgets/common.dart`

这里有 3 个简单组件：

- `SectionCard`：一个统一的卡片容器
- `ScreenShell`：统一的页面壳（带 AppBar、ListView padding）
- `StatTile`：小统计块

新手建议：

你做新页面时，优先用 `ScreenShell` 和 `SectionCard`，UI 会更整齐。

---

## 11. 主题（颜色/样式）在哪里改？

主题文件：`wallet-flutter/lib/core/theme.dart`

你可以从这里改：

- `scaffoldBackgroundColor`：整体背景
- `cardTheme`：卡片样式（圆角、边框）
- `inputDecorationTheme`：输入框样式

页面里获取主题颜色一般是：

```dart
Theme.of(context)
```

---

## 12. 新手最常见的 3 个改动（照抄就能做）

### 12.1 新增一个页面

1. 在 `wallet-flutter/lib/screens/` 新建 `hello_screen.dart`
2. 写一个最简单页面：

```dart
import 'package:flutter/material.dart';
import '../widgets/common.dart';

class HelloScreen extends StatelessWidget {
  const HelloScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ScreenShell(
      title: 'Hello',
      body: SectionCard(child: Text('Hello Flutter')),
    );
  }
}
```

3. 在 `wallet-flutter/lib/ui/routes.dart`
   - `Routes` 里加一个常量：`static const hello = '/hello';`
   - `buildRoute` 里加一个 case 映射到 `HelloScreen`

4. 在首页加一个按钮跳过去：

```dart
Navigator.pushNamed(context, Routes.hello);
```

### 12.2 在状态里加一个字段

比如你要加一个开关：

1. 在 `WalletAppState` 加字段：

```dart
bool hideSmallAssets = false;
```

2. 加方法：

```dart
void setHideSmallAssets(bool value) {
  hideSmallAssets = value;
  notifyListeners();
}
```

3. 在设置页调用：

```dart
context.read<WalletAppState>().setHideSmallAssets(true);
```

### 12.3 加一个列表展示

你会经常看到这种写法：

```dart
for (final token in state.tokens)
  ListTile(title: Text(token.symbol));
```

这就是 Dart 的“列表循环渲染”。

---

## 13. 调试与常用命令

在 `wallet-flutter/` 目录下：

- `flutter pub get`：安装依赖
- `flutter run`：运行（默认设备）
- `flutter devices`：查看设备
- `flutter analyze`：静态检查（像 ESLint）
- `flutter clean`：清理构建缓存（遇到奇怪编译问题时用）

热更新：

- 运行 `flutter run` 后，在终端按 `r`

---

## 14. 你现在看到的“钱包功能”是真实的吗？

不是。

本项目当前是“可运行的 UI + 模拟数据/流程”，用来对齐 `wallet-clean` 的模块划分与页面结构。

真实钱包需要接入：

- BIP39 助记词生成
- 私钥派生、签名
- RPC 请求（余额、交易、nonce、gas）
- Etherscan/CoinGecko 等 API
- WalletConnect、硬件钱包 SDK

如果你准备开始做“真实链上版本”，建议从最小闭环开始：

1. 真实创建/导入钱包（BIP39 + 派生地址）
2. 查询 ETH 余额（RPC）
3. 发送交易（签名 + 广播）

---

## 15. 下一步建议（新手学习路径）

如果你想在这个项目上学习 Flutter，建议按这个顺序练习：

1. 改 UI：修改 `WelcomeScreen` 文案、按钮样式
2. 改路由：新增一个页面 + 首页入口
3. 改状态：新增一个设置项（开关/字符串）并在首页展示
4. 改持久化：把设置项存到 `SharedPreferences`
5. 接网络请求：用 `http` 包拉一个简单 API（比如时间）展示

你想从第几步开始，我可以手把手带你改（每步只改 1-2 个文件）。
