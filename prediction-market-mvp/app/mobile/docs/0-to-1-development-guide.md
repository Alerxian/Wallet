# Prediction Market Mobile 从 0 到 1 开发实战手册（面向非 Native 背景）

作者：项目开发记录（Demo 阶段）  
适用代码版本：当前 `mobile/` 目录  
建议阅读人群：

- 主要是 Web 前端工程师（React/Vue）
- 不了解 React Native / Expo，但要快速参与移动端开发
- 想知道“怎么从文档到可运行产品”的同学

---

## 0. 这份文档要解决什么问题

这份文档不是 API 说明书，也不是只贴命令的 quick start，而是把这个项目**从无到有**的过程拆开，告诉你：

1. 为什么选这些技术栈；
2. 每一层代码是干什么的；
3. 核心功能（市场、交易、活动、设置、主题、动效）是怎么串起来的；
4. 如果你不懂 Native，应该怎么用 Web 思维理解这套工程；
5. 下一步把 Demo 进化成线上版本时，要补哪些东西。

你可以把它理解成“项目落地实战 + 代码导读 + 迁移指南”。

---

## 1. 先建立一个正确心智：Web 工程师如何理解 RN/Expo

如果你有 React Web 经验，可以先做下面映射：

- React Native ≈ “没有 DOM 的 React 渲染器”，组件是 `View/Text/Pressable/ScrollView`，不是 `div/span/button`。
- Expo ≈ “移动端开发工具链 + 运行时壳 + 常用能力集合”，让你不用先配 Xcode/Android Studio 的底层细节就能起步。
- StyleSheet ≈ “JS 对象形式的样式系统”，没有完整 CSS 级联，但有 Flex 布局、颜色、间距、边框、阴影等。
- AsyncStorage ≈ 浏览器的 localStorage（异步版，适配移动端）。
- Safe Area ≈ iPhone 刘海、底部 Home 指示条的可用安全区域。

这个项目就是基于这套心智搭起来的：

- UI：React Native 组件
- 状态：Zustand
- 请求：ky
- 数据校验：zod
- 持久化：AsyncStorage
- 动效：Animated API

---

## 2. 技术栈全景：为什么选这些，而不是别的

### 2.1 运行时与基础框架

见 `mobile/package.json`：

- `expo` + `react-native`
- `react`
- `expo-status-bar`

选择原因：

- **Expo 起步快**：适合从文档驱动快速做 MVP。
- **跨平台成本低**：一套代码跑 iOS/Android。
- **后续可扩展**：需要原生能力时也可以逐步深入。

### 2.2 状态管理

- `zustand`

为什么不是 Redux？

- 项目处于从 0 到 1 阶段，状态规模中等，Zustand 更轻量、上手快、模板代码少。
- 对“市场页、交易状态、设置项、主题模式”这种全局状态非常友好。

### 2.3 网络请求与数据安全

- `ky`：简洁的 fetch 封装。
- `zod`：运行时 schema 校验。

为什么要 `zod`：

- 移动端接口异常、字段缺失更常见。
- 有 TypeScript 不代表运行时安全。
- `zod` 可把“接口返回不符合预期”提前变成可控异常。

### 2.4 本地持久化

- `@react-native-async-storage/async-storage`

用途：

- 保存 tab、收藏列表、最近浏览、主题模式、设置项。
- 让用户重启 App 后还能保持上下文。

### 2.5 安全区域

- `react-native-safe-area-context`

用途：

- 处理刘海屏与底部手势条区域，避免底部导航被遮挡。

### 2.6 测试与类型门禁

- `typescript`
- `jest` + `ts-jest`
- `@types/jest`

项目门禁：

- `yarn typecheck`
- `yarn test`

这两个命令就是 Demo 阶段的“可交付底线”。

---

## 3. 从 0 到 1 的完整实施路径（真实落地顺序）

这部分按项目真实节奏还原，适合你复盘同类项目。

### 第 1 步：先拿到需求基线

项目最初只有文档（`requirements-detailed.md`、`run.md`、`1.md`、`2.md`、`3.md`），没有业务代码。

第一原则：

- 不要直接写页面。
- 先定义“必须存在”的系统骨架：导航、状态、API、持久化、测试门禁。

### 第 2 步：初始化移动端基线

创建 `mobile/` Expo TS 项目，补齐依赖，保证能起。

### 第 3 步：先跑通主链路，不求视觉极致

主链路是：

- Markets 发现市场
- Detail 发起交易
- Activity 追踪状态
- Portfolio 看持仓
- Settings 做环境控制

这一步先解决“功能可走通”。

### 第 4 步：再做 UI 产品化重构

统一主题 token、组件库、信息密度、图标图表、空态加载态、交互动效。

### 第 5 步：补高级体验

- 主题切换涟漪动画（点扩散 + 收束）
- Safe Area 兜底
- 页面切换动画
- 设置项持久化

这就是本项目当前状态。

---

## 4. 代码目录怎么读（非 Native 同学最关心）

```
mobile/
  App.tsx                      # 应用入口：路由、safe area、主题动画
  src/
    api/marketApi.ts           # 请求层（ky + zod + mock fallback）
    store/appStore.ts          # 全局状态（zustand）
    types.ts                   # 类型定义
    utils/                     # 纯函数与持久化
    theme/                     # 主题 token 与主题 Hook
    components/                # 通用组件和图表
    screens/                   # 页面层
```

你可以按这个顺序阅读：

1. `App.tsx`
2. `src/store/appStore.ts`
3. `src/screens/*`
4. `src/components/*`
5. `src/api/*` + `src/utils/*`

---

## 5. 入口层详解：App.tsx 做了哪些“总控”工作

参考 `mobile/App.tsx`。

### 5.1 路由切换（无 react-navigation 的轻路由）

核心思想：

- 通过 `currentTab` + `selectedMarketId` 决定显示哪个页面。
- `selectedMarketId` 有值时进入详情页，否则展示 tab 页面。

关键代码（简化版）：

```ts
const routeKey = selectedMarketId ? `DETAIL-${selectedMarketId}` : currentTab
const activeScreen = selectedMarketId ? <MarketDetailScreen /> : tabMap[currentTab]
```

这是一种“状态即路由”的实现，适合 MVP；后续复杂化可以接 `react-navigation`。

### 5.2 页面切换动效

```ts
Animated.timing(routeAnim, {
  toValue: 1,
  duration: settings.reducedMotion ? 80 : 240,
  easing: Easing.out(Easing.cubic),
  useNativeDriver: true,
}).start()
```

意义：

- 切 tab/detail 不再硬切，用户感知更顺。
- reduced motion 开关能降低动效强度，兼顾可访问性。

### 5.3 主题切换“点扩散 + 收束”

这是项目的体验亮点之一。

关键流程：

1. 设置页点击主题按钮，测量按钮中心点；
2. 调用 `requestThemeTransition(x, y)` 写入 store；
3. `App.tsx` 监听 `themeTransition`，执行 ripple 动画；
4. 扩散到全屏后切换主题；
5. 再做收束，完成视觉闭环。

核心代码（简化）：

```ts
Animated.sequence([
  Animated.timing(ripple, { toValue: maxRadius, duration: 360, ... }),
  Animated.timing(ripple, { toValue: 0, duration: 280, ... }),
]).start()

setTimeout(() => {
  applyThemeMode(nextMode)
}, 360)
```

### 5.4 Safe Area 兜底

```ts
<SafeAreaProvider>
  <SafeAreaView edges={['top', 'left', 'right']}>
```

同时底部 `TabBar` 用 `useSafeAreaInsets()` 增加 `paddingBottom`，防止手势条遮挡。

---

## 6. 状态管理详解：appStore 是“业务中枢”

参考 `mobile/src/store/appStore.ts`。

很多同学写 RN 项目会“页面各写各逻辑”，导致后期难维护。这个项目把跨页面状态集中在 store：

### 6.1 状态域划分

- 路由域：`currentTab`、`selectedMarketId`
- 市场域：`markets`、`query`、`filters`、`sortMode`
- 用户偏好域：`themeMode`、`settings`
- 交易域：`pendingTxs`、`historyTxs`
- 本地增强域：`watchlistIds`、`recentMarketIds`
- 诊断域：`diagnostics`

### 6.2 hydrate 恢复机制

冷启动时统一恢复：

```ts
const [watchlistIds, recentMarketIds, tab, mode, rawSettings] = await Promise.all([...])
```

这个模式优点：

- 启动逻辑集中
- 异步并发恢复，速度更快
- 有默认值兜底，避免崩溃

### 6.3 主题与设置持久化

```ts
applyThemeMode: (mode) => {
  void saveThemeMode(mode)
  set({ themeMode: mode, themeTransition: null })
}

updateSettings: (patch) => {
  const next = { ...get().settings, ...patch }
  void saveSettings(next as Record<string, unknown>)
  set({ settings: next })
}
```

### 6.4 交易状态模拟（Demo 版）

当前没有接真实链上状态轮询，先用定时器模拟生命周期：

- 提交 -> `PENDING`
- 1.2s -> `CONFIRMED`
- 2.6s -> `INDEXED`

这让我们先把 UI 和状态机磨顺，再接后端真实接口。

---

## 7. API 层详解：为什么 `ky + zod + fallback` 是 MVP 友好方案

参考 `mobile/src/api/marketApi.ts`。

### 7.1 结构

```ts
const api = ky.create({
  prefixUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  timeout: 8000,
})
```

### 7.2 运行时校验

```ts
const marketSchema = z.object({ ... })
const marketsSchema = z.array(marketSchema)
```

### 7.3 后端不可用时降级

```ts
try {
  const result = await api.get('markets').json()
  return marketsSchema.parse(result)
} catch {
  return mockMarkets
}
```

这段逻辑的价值非常实用：

- 后端未联调时，前端仍可推进；
- Demo 演示不被“接口偶发错误”卡死；
- 开发体验更稳定。

但请注意：上线前一定要把 fallback 行为改成可观测的错误策略（比如 toast + retry + 错误埋点），避免误把 mock 当线上数据。

---

## 8. 本地持久化详解：为什么要集中封装 storage

参考 `mobile/src/utils/storage.ts`。

这里做了两件事：

1. key 统一管理（防止页面写死字符串）
2. 读写函数统一（防止 JSON parse/stringify 到处散落）

示例：

```ts
const WATCHLIST_KEY = 'watchlist_ids'
const THEME_KEY = 'theme_mode'
const SETTINGS_KEY = 'app_settings'
```

以及：

```ts
export async function loadSettings(): Promise<Record<string, unknown> | null> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY)
  ...
}
```

这对不懂 Native 的同学非常重要：

- 你可以把它当成一个“移动端 localStorage service”；
- 只要在 store 调这些方法，不要直接在页面乱写 AsyncStorage。

---

## 9. 主题系统详解：从静态色到动态 palette

主题定义在 `mobile/src/theme/tokens.ts`，核心是 `themePalettes`：

- `sand`（浅色交易台）
- `night`（深色终端风）

通过 `getThemePalette(mode)` 返回当前主题对象。

为了避免每个文件都手动写 `themeMode` 读取，我们新增了：

- `mobile/src/theme/useThemePalette.ts`

```ts
export function useThemePalette() {
  const themeMode = useAppStore((state) => state.themeMode)
  return getThemePalette(themeMode)
}
```

然后在组件中这样用：

```ts
const palette = useThemePalette()
<View style={{ backgroundColor: palette.card, borderColor: palette.border }} />
```

这套做法让主题切换从“入口遮罩变色”变成“全应用真实换肤”。

---

## 10. 页面层怎么搭：以 Markets 为例讲完整套路

参考 `mobile/src/screens/MarketsScreen.tsx`。

### 10.1 状态来源

从 store 取：

- markets、query、filters、sortMode
- watchlistIds、recentMarketIds
- loading 和 loadMarkets

### 10.2 搜索防抖

```ts
useEffect(() => {
  const timer = setTimeout(() => setQuery(draftQuery), 260)
  return () => clearTimeout(timer)
}, [draftQuery])
```

### 10.3 过滤管道

通过 `runMarketPipeline(markets, query, filters, sortMode, watchlistIds)`，把搜索/筛选/排序串起来。

### 10.4 列表项动画

`MarketRow` 内用 `Animated.Value` 做分段入场，增强层次感。

### 10.5 空态与加载态

- 加载且无数据：骨架屏
- 有数据但筛不到：空态组件 + 一键重置

这就是“真实产品”体验，而不是“列表为空就一句文本”。

---

## 11. Detail 页怎么实现交易体验

参考 `mobile/src/screens/MarketDetailScreen.tsx`。

### 11.1 交易输入流程

- BUY/SELL + YES/NO 方向切换
- 金额输入
- 快捷金额 chips

### 11.2 前置校验

- 钱包是否连接
- 网络是否 31337（Demo 规则）
- 金额是否合法（`validateTradeAmount`）

### 11.3 反馈层

- Execution Intensity（趋势示意）
- Estimated Execution（均价/滑点/手续费）
- Risk Checklist（风险文案）

对于不懂链上交易的用户，这些层能把“输入金额 -> 风险感知 -> 提交”链路补完整。

---

## 12. Activity 页怎么做可追踪

参考 `mobile/src/screens/ActivityScreen.tsx` + `mobile/src/utils/activity.ts`。

关键逻辑：

- `mergeAndDedupeActivity(pending, history)`
- `filterActivity(items, filters)`

这让 Activity 具备两个核心价值：

1. 同一笔 tx 不重复展示；
2. 用户可按状态和动作快速定位问题单。

页面还做了时间线视觉锚点（状态 icon + 纵向引导线），大幅提升扫读效率。

---

## 13. Settings 页重写策略：为什么不仅是“放几个开关”

参考 `mobile/src/screens/SettingsScreen.tsx`。

Settings 在这个项目里承担三种角色：

1. **环境控制台**：钱包、网络
2. **体验偏好中心**：主题、语言、货币、动效偏好
3. **诊断面板**：近期错误与关键操作日志

尤其是主题切换按钮：

```ts
themeButtonRef.current?.measureInWindow((x, y, width, height) => {
  requestThemeTransition(x + width / 2, y + height / 2)
})
```

这一步把视觉动效与用户触点绑定，让切换更“有因果感”。

---

## 14. 组件层拆分思路：为什么不是在 screen 里堆样式

这个项目把高复用块下沉到 `src/components/ui` 与 `src/components/charts`：

- UI：`Card`、`Button`、`Input`、`Chip`、`KpiRow`、`EmptyState`、`Skeleton`
- Charts：`PoolBar`、`SparkBars`

好处：

- 主题迁移时，改一个组件就能全局生效；
- 页面代码聚焦业务流程；
- 避免“复制粘贴样式导致全站不一致”。

---

## 15. 测试策略：为什么先测 utils

当前测试放在 `mobile/src/utils/__tests__`，主要覆盖：

- 金额校验
- 活动合并去重
- 市场过滤排序
- storage 读写

这符合 MVP 阶段策略：

- 优先稳住“纯逻辑函数”（最容易回归）；
- UI 变化频繁时，先不过度绑定快照。

后续建议补充：

- 页面级交互测试（筛选点击、交易按钮禁用态）
- store 行为测试（hydrate、theme transition）

---

## 16. 从零搭建你可以直接照抄的实施清单

下面是一份可复用 checklist：

### 阶段 A：工程初始化

1. `create-expo-app` 初始化 TS 项目
2. 安装依赖：zustand/ky/zod/AsyncStorage/safe-area
3. 补脚本：`typecheck`、`test`

### 阶段 B：架构骨架

1. 建立 `types.ts`
2. 建立 `appStore.ts`
3. 建立 `api/marketApi.ts`
4. 建立 `utils/storage.ts`

### 阶段 C：页面主链路

1. Markets
2. MarketDetail
3. Activity
4. Portfolio
5. Settings

### 阶段 D：产品化

1. 主题 token
2. 组件复用层
3. 图表与信息密度
4. 空态/骨架/动效

### 阶段 E：高级体验

1. safe area
2. 主题切换涟漪
3. 页面过渡
4. 设置项持久化

### 阶段 F：门禁

1. `yarn typecheck`
2. `yarn test`

---

## 17. 不懂 Native 的常见坑（结合本项目）

### 坑 1：以为 RN 样式就是 CSS

不是。RN 没有 CSS 级联和伪类，样式是 JS 对象。建议统一 token + 组件封装。

### 坑 2：把路由、业务、主题都塞页面

会很快失控。这个项目把它们拆到：

- `App.tsx`（入口控制）
- `appStore.ts`（状态中枢）
- `theme`（主题系统）

### 坑 3：忽略 safe area

真机上会被刘海或底部手势挡住。必须上 `react-native-safe-area-context`。

### 坑 4：只有 TypeScript，没有运行时校验

接口脏数据照样炸。用 `zod` 校验。

### 坑 5：没有降级方案

网络不稳是移动端常态。当前项目在市场接口不可达时 fallback mock，至少保证流程可运行。

---

## 18. 把 Demo 推向生产，还差什么

当前是高质量 Demo，可演示、可继续开发，但离生产还有关键 gap：

### 18.1 交易链路要接真实后端

现在是本地模拟状态机，需替换为：

- `approve-intent`
- `intent`
- `status polling`

### 18.2 安全与认证

- WalletConnect + SIWE 完整接入
- token 过期策略
- 敏感日志脱敏

### 18.3 观测能力

- 埋点（点击、失败、耗时）
- 错误上报（Sentry 类）
- 性能采样（首屏、列表帧率）

### 18.4 测试完善

- Store 行为测试
- 页面交互测试
- 关键链路 E2E

### 18.5 发布工程

- 环境区分（dev/staging/prod）
- build profiles
- 灰度策略与回滚流程

---

## 19. 非 Native 同学的上手路径（7 天计划）

### Day 1

- 熟悉 `App.tsx`、`appStore.ts`
- 跑通 `yarn start`

### Day 2

- 跟读 `MarketsScreen.tsx`
- 修改一个筛选交互

### Day 3

- 跟读 `MarketDetailScreen.tsx`
- 改一个交易前置校验文案

### Day 4

- 跟读 `ActivityScreen.tsx`
- 改一个 timeline UI 细节

### Day 5

- 跟读 `SettingsScreen.tsx`
- 新增一个设置项并持久化

### Day 6

- 跟读主题系统
- 新增第三个主题实验（比如 `graphite`）

### Day 7

- 运行门禁
- 输出变更文档与截图对比

---

## 20. 关键代码片段索引（方便快速定位）

### 20.1 主题切换涟漪

- 文件：`mobile/App.tsx`
- 关键词：`themeTransition`、`Animated.sequence`、`ripple`

### 20.2 全局状态中心

- 文件：`mobile/src/store/appStore.ts`
- 关键词：`hydratePersisted`、`updateSettings`、`applyThemeMode`

### 20.3 API 校验与降级

- 文件：`mobile/src/api/marketApi.ts`
- 关键词：`marketsSchema.parse`、`catch -> mockMarkets`

### 20.4 持久化策略

- 文件：`mobile/src/utils/storage.ts`
- 关键词：`THEME_KEY`、`SETTINGS_KEY`

### 20.5 页面交互示例

- Markets：`mobile/src/screens/MarketsScreen.tsx`
- Detail：`mobile/src/screens/MarketDetailScreen.tsx`
- Activity：`mobile/src/screens/ActivityScreen.tsx`
- Settings：`mobile/src/screens/SettingsScreen.tsx`

---

## 21. 为什么这个项目对“Web 转 Native”很友好

因为它遵循了几个原则：

1. 结构先行：先有 store/api/theme，再堆页面；
2. 能跑优先：先主链路，后视觉精修；
3. 组件复用：避免样式散弹枪；
4. 可验证：typecheck + test 门禁强制执行；
5. 可迭代：主题、设置、动效都通过状态驱动，后续扩展成本低。

---

## 22. FAQ（给第一次做 RN 的你）

### Q1：为什么不用 react-navigation？

答：从 0 到 1 的 Demo 阶段，状态驱动路由更轻、学习成本更低。后续页面变多、导航层级变深时再接。

### Q2：为什么测试几乎都在 utils？

答：因为现在变化最快的是 UI，先稳纯逻辑函数是最高性价比策略。

### Q3：主题切换为什么不直接瞬间切？

答：可做，但体验会“突兀”。点扩散动画能明确告诉用户“是我触发了切换”，交互心理模型更自然。

### Q4：mock fallback 会不会误导业务？

答：会，所以必须在文档与发布流程标注“仅开发/演示使用”，上线前改成明确错误提示与重试。

### Q5：这套代码能扩展到真生产吗？

答：能，但要补真实交易后端、认证安全、观测埋点、E2E 与发布流水线。

---

## 23. 总结：从文档驱动到产品化 Demo 的核心方法

这个项目最重要的不是某个炫动画，而是方法论：

- 先定边界（文档）
- 再搭骨架（状态/API/主题/持久化）
- 先打通链路（功能）
- 再做质感（视觉/动效/交互）
- 最后守门（类型/测试）

如果你是 Web 工程师，按这个顺序走，你会发现 RN 并不神秘。

你只要记住一句话：

**不要把它当“写几个页面”，要把它当“设计一个可持续演进的客户端系统”。**

---

## 24. 附录：本项目主要运行命令

在 `mobile/` 目录执行：

```bash
yarn start
yarn ios
yarn android
yarn typecheck
yarn test
```

---

## 25. 附录：建议下一版文档扩展

当前文档已覆盖 0-1 实战与代码导读。若继续演进，建议新增：

1. 真机调试问题排查手册（iOS/Android）
2. WalletConnect + SIWE 完整接入步骤
3. 后端联调契约文档（字段、错误码、重试策略）
4. 发布 checklist（版本号、环境变量、回滚流程）

---

（完）
