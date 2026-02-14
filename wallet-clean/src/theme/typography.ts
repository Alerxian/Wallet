/**
 * 字体样式系统
 */

export const typography = {
  // 标题
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },

  // 正文
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },

  // 小字
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  captionMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  // 极小字
  overline: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },

  // 按钮
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
} as const;

export type Typography = typeof typography;
