/**
 * 字体样式系统
 */

import { Platform } from 'react-native';

const fontFamily = {
  display: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }),
  text: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

export const typography = {
  // 标题
  h1: {
    fontFamily: fontFamily.display,
    fontSize: 34,
    fontWeight: '800' as const,
    lineHeight: 40,
    letterSpacing: -0.7,
  },
  h2: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.35,
  },
  h3: {
    fontFamily: fontFamily.display,
    fontSize: 21,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily: fontFamily.text,
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },

  // 正文
  body: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyBold: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    fontWeight: '700' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },

  // 小字
  caption: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: 0.15,
  },
  captionMedium: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    letterSpacing: 0.15,
  },

  // 极小字
  overline: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },

  // 按钮
  button: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    fontWeight: '700' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  buttonSmall: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    fontWeight: '700' as const,
    lineHeight: 18,
    letterSpacing: 0.25,
  },
} as const;

export type Typography = typeof typography;
