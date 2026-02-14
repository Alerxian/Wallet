/**
 * 深空灰蓝配色方案
 * 适用于高端、安全的钱包应用
 */

export const colors = {
  // 主色调
  primary: '#1E3A8A',        // 深蓝色（主按钮、强调）
  secondary: '#1E40AF',      // 中蓝色（次要按钮）
  accent: '#60A5FA',         // 天蓝色（高亮、链接）

  // 背景色
  background: '#0A0A0A',     // 深黑色（主背景）
  surface: '#1A1A1A',        // 深灰色（卡片背景）
  surfaceLight: '#2A2A2A',   // 浅灰色（输入框背景）

  // 边框与分割线
  border: '#333333',         // 边框颜色
  divider: '#2A2A2A',        // 分割线

  // 文字颜色
  text: {
    primary: '#FFFFFF',      // 主文字（白色）
    secondary: '#A0A0A0',    // 次要文字（灰色）
    disabled: '#666666',     // 禁用文字
    inverse: '#000000',      // 反色文字（用于浅色背景）
  },

  // 状态颜色
  status: {
    success: '#10B981',      // 成功（绿色）
    warning: '#F59E0B',      // 警告（橙色）
    error: '#EF4444',        // 错误（红色）
    info: '#60A5FA',         // 信息（蓝色）
  },

  // 渐变色
  gradient: {
    primary: ['#1E3A8A', '#1E40AF', '#3B82F6'],     // 主渐变
    secondary: ['#60A5FA', '#3B82F6', '#2563EB'],   // 次渐变
    dark: ['#0A0A0A', '#1A1A1A'],                   // 暗色渐变
  },

  // 透明度变体
  overlay: {
    light: 'rgba(255, 255, 255, 0.1)',   // 浅色遮罩
    medium: 'rgba(0, 0, 0, 0.5)',        // 中等遮罩
    dark: 'rgba(0, 0, 0, 0.8)',          // 深色遮罩
  },
} as const;

export type Colors = typeof colors;
