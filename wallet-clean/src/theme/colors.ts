/**
 * 深空灰蓝配色方案
 * 适用于高端、安全的钱包应用
 */

export const colors = {
  primary: '#00A3FF',
  secondary: '#0EA5E9',
  accent: '#F59E0B',
  warning: '#FBBF24',

  background: '#090C12',
  surface: '#121826',
  surfaceLight: '#1B2435',

  border: '#2A364D',
  divider: '#1F2A3E',

  text: {
    primary: '#F8FAFC',
    secondary: '#9FB2C9',
    disabled: '#5E738D',
    inverse: '#04070D',
  },

  status: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#38BDF8',
  },

  gradient: {
    primary: ['#0066FF', '#00A3FF', '#22D3EE'],
    secondary: ['#FB923C', '#F59E0B', '#FACC15'],
    dark: ['#090C12', '#121826', '#1B2435'],
  },

  overlay: {
    light: 'rgba(148, 163, 184, 0.14)',
    medium: 'rgba(7, 10, 16, 0.55)',
    dark: 'rgba(2, 4, 8, 0.84)',
  },
} as const;

export type Colors = typeof colors;
