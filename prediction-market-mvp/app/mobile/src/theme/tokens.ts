import { ThemeMode } from '../types';

export const themePalettes: Record<ThemeMode, {
  bg: string;
  bgElevated: string;
  card: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryStrong: string;
  accent: string;
  danger: string;
  successBg: string;
  warningBg: string;
  infoBg: string;
  veil: string;
}> = {
  sand: {
    bg: '#efe7dc',
    bgElevated: '#f7f1e8',
    card: '#fffaf1',
    border: '#d8ccb9',
    textPrimary: '#162920',
    textSecondary: '#4e5f57',
    textMuted: '#7b847f',
    primary: '#1f5a47',
    primaryStrong: '#174636',
    accent: '#c58a39',
    danger: '#9f1239',
    successBg: '#dcf4e5',
    warningBg: '#f8ebcc',
    infoBg: '#deecff',
    veil: 'rgba(239,231,220,0.95)',
  },
  night: {
    bg: '#0f161c',
    bgElevated: '#15212a',
    card: '#1a2833',
    border: '#2b3f4f',
    textPrimary: '#f1f8ff',
    textSecondary: '#c2d6e6',
    textMuted: '#8ea5b8',
    primary: '#2f8f76',
    primaryStrong: '#5cb59d',
    accent: '#f0b35f',
    danger: '#f0719c',
    successBg: '#224539',
    warningBg: '#4f3e21',
    infoBg: '#1f3952',
    veil: 'rgba(15,22,28,0.9)',
  },
};

export const colors = {
  bg: '#efe7dc',
  bgElevated: '#f7f1e8',
  card: '#fffaf1',
  border: '#d8ccb9',
  textPrimary: '#162920',
  textSecondary: '#4e5f57',
  textMuted: '#7b847f',
  primary: '#1f5a47',
  primaryStrong: '#174636',
  accent: '#c58a39',
  danger: '#9f1239',
  successBg: '#dcf4e5',
  warningBg: '#f8ebcc',
  infoBg: '#deecff',
};

export function getThemePalette(mode: ThemeMode) {
  return themePalettes[mode];
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

export const typography = {
  display: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800' as const,
    letterSpacing: 0.2,
  },
  section: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
};

export const motion = {
  quick: 160,
  normal: 220,
};
