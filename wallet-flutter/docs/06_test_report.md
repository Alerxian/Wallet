# 06 - 测试报告

## 测试日期

- 2026-02-15

## 环境

- Flutter 3.41.1
- Dart 3.11.0
- iOS Simulator: iPhone 17 Pro
- macOS 26.3 (arm64)

## 执行项

### 1) 静态检查

命令：

```bash
flutter analyze
```

结果：

- 通过（No issues found）

### 2) 纯 Dart 单元测试

命令：

```bash
dart test test/pure_models_test.dart
```

结果：

- 3/3 通过
- 覆盖：交易编解码、dApp 历史编解码、网络 copyWith

### 2.1 服务接入后回归

命令：

```bash
dart test test/pure_models_test.dart
flutter analyze
```

结果：

- 继续通过
- 表明模型层与代码结构在真实链路接入后未破坏

### 3) iOS 模拟器运行

命令：

```bash
flutter run -d 30B6B7FC-8D24-4682-93EC-4AED049D0B2B
```

结果：

- Xcode build 成功
- App 启动成功
- DevTools 和 VM Service 可用
- 设置页生物识别按钮可触发系统验证流程

### 4) Flutter widget 测试（说明）

命令尝试：

```bash
flutter test --no-test-assets
```

现象：

- 当前机器环境的 `flutter_tester` 存在稳定性问题（超时/连接中断）
- 已采用 `dart test` 对核心模型层做稳定回归

## 结论

- 当前应用在 iOS 模拟器可启动并可交互
- 代码静态检查通过
- 核心模型逻辑具备可重复单测
- 主币真实余额与主币发送链路已接入（受 RPC 状态影响）

## 建议补充（生产前）

1. CI 增加 macOS runner，固定 Flutter 版本
2. 增加 integration_test（页面流程自动化）
3. 引入真链路 API 后补充服务层 Mock + Contract 测试
