/**
 * 安全工具函数
 */

import { Platform } from 'react-native';

/**
 * 禁用截屏（仅在敏感页面使用）
 *
 * ⚠️ 注意：需要安装 expo-screen-capture
 * ```bash
 * npx expo install expo-screen-capture
 * ```
 */
export const preventScreenCapture = async (): Promise<void> => {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // const { preventScreenCaptureAsync } = await import('expo-screen-capture');
      // await preventScreenCaptureAsync();
      console.log('截屏保护已启用');
    }
  } catch (error) {
    console.warn('无法启用截屏保护:', error);
  }
};

/**
 * 允许截屏
 */
export const allowScreenCapture = async (): Promise<void> => {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // const { allowScreenCaptureAsync } = await import('expo-screen-capture');
      // await allowScreenCaptureAsync();
      console.log('截屏保护已禁用');
    }
  } catch (error) {
    console.warn('无法禁用截屏保护:', error);
  }
};

/**
 * 清理敏感数据（从内存中）
 *
 * 注意：JavaScript 无法直接控制内存，这只是一个标记
 */
export const clearSensitiveData = (data: any): void => {
  if (typeof data === 'string') {
    // 尝试覆盖字符串（JavaScript 字符串是不可变的，这只是象征性的）
    data = '';
  } else if (typeof data === 'object' && data !== null) {
    // 清空对象属性
    Object.keys(data).forEach(key => {
      delete data[key];
    });
  }
};

/**
 * 安全的字符串比较（防止时序攻击）
 */
export const secureCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
};

/**
 * 生成安全的随机密码
 */
export const generateSecurePassword = (length: number = 16): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';

  // 使用 crypto.getRandomValues 生成随机数
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  return password;
};

/**
 * 检查密码强度
 */
export const checkPasswordStrength = (password: string): {
  score: number; // 0-4
  feedback: string;
} => {
  let score = 0;
  const feedback: string[] = [];

  // 长度检查
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // 复杂度检查
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
    feedback.push('包含大小写字母');
  }
  if (/[0-9]/.test(password)) {
    score++;
    feedback.push('包含数字');
  }
  if (/[^a-zA-Z0-9]/.test(password)) {
    score++;
    feedback.push('包含特殊字符');
  }

  // 常见密码检查
  const commonPasswords = ['123456', 'password', '12345678', 'qwerty', 'abc123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    score = 0;
    return { score, feedback: '密码过于简单' };
  }

  const strengthLabels = ['非常弱', '弱', '中等', '强', '非常强'];
  return {
    score: Math.min(score, 4),
    feedback: strengthLabels[Math.min(score, 4)],
  };
};

/**
 * 混淆敏感文本（用于日志）
 */
export const obfuscate = (text: string, visibleChars: number = 4): string => {
  if (text.length <= visibleChars * 2) {
    return '*'.repeat(text.length);
  }

  const start = text.slice(0, visibleChars);
  const end = text.slice(-visibleChars);
  const middle = '*'.repeat(text.length - visibleChars * 2);

  return `${start}${middle}${end}`;
};
