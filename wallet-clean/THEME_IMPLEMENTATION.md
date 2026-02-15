# 主题切换功能实现文档

## ✅ 已完成

### 1. 主题系统创建

**创建的文件：**
- `src/theme/themes.ts` - 主题定义文件
- `src/theme/ThemeContext.tsx` - 主题上下文

**支持的主题：**
- **深色主题（dark）**：原有的深空灰蓝配色
- **蓝色主题（blue）**：高级的蓝色渐变配色

### 2. 蓝色主题配色方案

```typescript
{
  // 主色调 - 更鲜艳的蓝色系
  primary: '#2563EB',        // 亮蓝色
  secondary: '#3B82F6',      // 天蓝色
  accent: '#60A5FA',         // 浅蓝色

  // 背景色 - 深蓝色渐变
  background: '#0F172A',     // 深蓝黑色
  surface: '#1E293B',        // 深蓝灰色
  surfaceLight: '#334155',   // 中蓝灰色

  // 边框 - 蓝色调
  border: '#475569',         // 蓝灰色边框
  divider: '#334155',        // 蓝灰色分割线

  // 文字颜色
  text: {
    primary: '#F8FAFC',      // 接近白色
    secondary: '#94A3B8',    // 蓝灰色
    disabled: '#64748B',     // 深蓝灰
  }
}
```

### 3. 主题切换实现

**更新的文件：**
- `App.tsx` - 添加 ThemeProvider
- `src/theme/index.ts` - 导出主题系统
- `src/screens/Settings/SettingsScreen.tsx` - 实现主题切换 UI
- `src/screens/Home/HomeScreen.tsx` - 示例：使用 useTheme hook

**使用方法：**

```typescript
import { useTheme } from '@/theme/ThemeContext';

function MyComponent() {
  const { theme: colors } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text.primary }}>Hello</Text>
    </View>
  );
}
```

### 4. 设置界面更新

在设置界面中，用户可以选择：
- **蓝色主题**（对应 light 设置）
- **深色主题**（对应 dark 设置）
- **跟随系统**（对应 auto 设置，当前默认为深色）

## 📝 迁移指南

### 需要更新的组件

所有使用 `colors` 的组件都需要更新为使用 `useTheme` hook：

**旧代码：**
```typescript
import { colors, typography, spacing } from '@/theme';

export const MyScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  text: {
    color: colors.text.primary,
  },
});
```

**新代码：**
```typescript
import { typography, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';

export const MyScreen: React.FC = () => {
  const { theme: colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text.primary }]}>Hello</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // 移除固定颜色
  },
  text: {
    ...typography.body,
    // 移除固定颜色
  },
});
```

### 推荐的迁移方式

**方式 1：动态样式（推荐）**
```typescript
const { theme: colors } = useTheme();

<View style={{ backgroundColor: colors.background }}>
```

**方式 2：样式函数**
```typescript
const { theme: colors } = useTheme();
const styles = createStyles(colors);

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
  });
}
```

**方式 3：混合样式**
```typescript
const { theme: colors } = useTheme();

<View style={[styles.container, { backgroundColor: colors.background }]}>
```

## 🎨 主题对比

### 深色主题（Dark Theme）
- 背景：深黑色 `#0A0A0A`
- 卡片：深灰色 `#1A1A1A`
- 主色：深蓝色 `#1E3A8A`
- 适合：夜间使用，省电

### 蓝色主题（Blue Theme）
- 背景：深蓝黑 `#0F172A`
- 卡片：深蓝灰 `#1E293B`
- 主色：亮蓝色 `#2563EB`
- 适合：日常使用，更有活力

## 🔧 待完成任务

### 组件迁移状态

以下组件已完成 `useTheme` 迁移，支持动态主题：

- [x] App.tsx
- [x] HomeScreen.tsx
- [x] SettingsScreen.tsx
- [x] Button.tsx
- [x] Card.tsx
- [x] Input.tsx
- [x] Loading.tsx
- [x] AddressDisplay.tsx
- [x] MnemonicGrid.tsx
- [x] MnemonicWord.tsx
- [x] WelcomeScreen.tsx
- [x] GenerateMnemonicScreen.tsx
- [x] BackupMnemonicScreen.tsx
- [x] VerifyMnemonicScreen.tsx
- [x] SetPasswordScreen.tsx
- [x] ImportWalletScreen.tsx
- [x] ReceiveScreen.tsx
- [x] SendScreen.tsx
- [x] TransactionHistoryScreen.tsx
- [x] NetworksScreen.tsx
- [x] AddNetworkScreen.tsx
- [x] TokensScreen.tsx
- [x] AddTokenScreen.tsx
- [x] SwapScreen.tsx
- [x] NFTListScreen.tsx
- [x] NFTDetailScreen.tsx
- [x] DeFiScreen.tsx
- [x] DAppConnectionsScreen.tsx
- [x] PortfolioScreen.tsx
- [x] HardwareWalletScreen.tsx

### 自动化迁移脚本

可以创建一个脚本来批量更新组件：

```bash
# 查找所有使用 colors 的文件
grep -r "from '@/theme'" src/screens src/components --include="*.tsx"

# 替换导入语句
# 从: import { colors, typography, spacing } from '@/theme';
# 到: import { typography, spacing } from '@/theme';
#     import { useTheme } from '@/theme/ThemeContext';
```

## 🚀 使用说明

### 切换主题

1. 打开应用
2. 进入"设置"界面
3. 点击"主题"选项
4. 选择"蓝色主题"或"深色主题"
5. 主题立即生效

### 开发时测试主题

```typescript
// 在任何组件中临时切换主题
const { setTheme } = useTheme();

// 切换到蓝色主题
setTheme('blue');

// 切换到深色主题
setTheme('dark');
```

## 📊 性能优化

### 已实现的优化
- ✅ 使用 React Context 避免 prop drilling
- ✅ 主题状态持久化到 AsyncStorage
- ✅ 主题切换无需重启应用

### 待优化项
- [ ] 主题切换动画
- [x] 跟随系统主题自动切换
- [ ] 主题预览功能

## 🎯 下一步

1. **批量更新组件**：使用脚本或手动更新所有组件
2. **添加主题切换动画**：平滑的过渡效果
3. **系统主题跟随**：使用 `Appearance` API
4. **主题预览**：在设置界面显示主题预览
5. **自定义主题**：允许用户自定义颜色

---

**创建日期**：2026-02-15
**状态**：✅ 主题系统完成并已完成批量组件迁移
