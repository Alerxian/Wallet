/**
 * 主题系统导出
 */

import { colors } from "./colors";
import { typography } from "./typography";
import { spacing } from "./spacing";
import { shadows } from "./shadows";

export { colors, typography, spacing, shadows };

// 导出主题系统
export * from './themes';
export * from './ThemeContext';

export const theme = {
  colors,
  typography,
  spacing,
  shadows,
} as const;

export type Theme = typeof theme;
