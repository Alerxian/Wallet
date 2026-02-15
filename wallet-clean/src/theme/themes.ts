/**
 * 主题系统
 * 支持深色主题和蓝色主题
 */

export interface ThemeColors {
  // 主色调
  primary: string;
  secondary: string;
  accent: string;
  warning: string;

  // 背景色
  background: string;
  surface: string;
  surfaceLight: string;

  // 边框与分割线
  border: string;
  divider: string;

  // 文字颜色
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };

  // 状态颜色
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  // 渐变色
  gradient: {
    primary: string[];
    secondary: string[];
    dark: string[];
  };

  // 透明度变体
  overlay: {
    light: string;
    medium: string;
    dark: string;
  };
}

/**
 * 深色主题
 * Ink Night + Teal Mint + Amber
 */
export const darkTheme: ThemeColors = {
  primary: '#2DD4BF',
  secondary: '#14B8A6',
  accent: '#F59E0B',
  warning: '#FBBF24',

  background: '#080B14',
  surface: '#101826',
  surfaceLight: '#162236',

  border: '#22334A',
  divider: '#1B2A40',

  text: {
    primary: '#ECF4FF',
    secondary: '#9AB0CD',
    disabled: '#5F7696',
    inverse: '#071019',
  },

  status: {
    success: '#34D399',
    warning: '#F59E0B',
    error: '#FB7185',
    info: '#60A5FA',
  },

  gradient: {
    primary: ['#0B6B78', '#14B8A6', '#2DD4BF'],
    secondary: ['#F59E0B', '#F97316', '#F43F5E'],
    dark: ['#080B14', '#101826', '#162236'],
  },

  overlay: {
    light: 'rgba(120, 170, 220, 0.14)',
    medium: 'rgba(6, 10, 18, 0.58)',
    dark: 'rgba(2, 5, 10, 0.86)',
  },
};

/**
 * 浅色主题
 * Sand White + Atlantic Blue + Coral Accent
 */
export const blueTheme: ThemeColors = {
  primary: '#0F766E',
  secondary: '#0284C7',
  accent: '#E76F51',
  warning: '#D97706',

  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceLight: '#EEF2F7',

  border: '#D7DFEA',
  divider: '#E4EAF2',

  text: {
    primary: '#102238',
    secondary: '#50637B',
    disabled: '#8A9AAF',
    inverse: '#FFFFFF',
  },

  status: {
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#0369A1',
  },

  gradient: {
    primary: ['#0F766E', '#0891B2', '#38BDF8'],
    secondary: ['#F59E0B', '#E76F51', '#EF4444'],
    dark: ['#102238', '#1D3557', '#2C5282'],
  },

  overlay: {
    light: 'rgba(15, 118, 110, 0.08)',
    medium: 'rgba(16, 34, 56, 0.42)',
    dark: 'rgba(16, 34, 56, 0.72)',
  },
};

/**
 * 主题映射
 */
export const themes = {
  dark: darkTheme,
  blue: blueTheme,
} as const;

export type ThemeName = keyof typeof themes;

/**
 * 获取主题
 */
export function getTheme(themeName: ThemeName): ThemeColors {
  return themes[themeName];
}

/**
 * 默认导出当前主题（用于向后兼容）
 */
export const colors = darkTheme;
export type Colors = ThemeColors;
