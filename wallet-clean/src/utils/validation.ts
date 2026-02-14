/**
 * 验证工具函数
 */

import { REGEX, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from './constants';

/**
 * 验证以太坊地址
 */
export const isValidAddress = (address: string): boolean => {
  return REGEX.ETH_ADDRESS.test(address);
};

/**
 * 验证私钥
 */
export const isValidPrivateKey = (privateKey: string): boolean => {
  return REGEX.PRIVATE_KEY.test(privateKey);
};

/**
 * 验证交易哈希
 */
export const isValidTxHash = (hash: string): boolean => {
  return REGEX.TX_HASH.test(hash);
};

/**
 * 验证助记词
 * @param mnemonic 助记词字符串
 * @param expectedLength 期望的单词数量（12 或 24）
 */
export const isValidMnemonic = (mnemonic: string, expectedLength?: 12 | 24): boolean => {
  const words = mnemonic.trim().split(/\s+/);

  // 检查单词数量
  if (expectedLength) {
    if (words.length !== expectedLength) {
      return false;
    }
  } else {
    if (words.length !== 12 && words.length !== 24) {
      return false;
    }
  }

  // 检查每个单词是否为有效字符
  const wordRegex = /^[a-z]+$/;
  return words.every(word => wordRegex.test(word));
};

/**
 * 验证密码强度
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];

  // 长度检查
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`密码长度至少 ${PASSWORD_MIN_LENGTH} 位`);
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`密码长度最多 ${PASSWORD_MAX_LENGTH} 位`);
  }

  // 复杂度检查（可选）
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumber = /[0-9]/.test(password);
  // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // if (!hasUpperCase) errors.push('密码需包含大写字母');
  // if (!hasLowerCase) errors.push('密码需包含小写字母');
  // if (!hasNumber) errors.push('密码需包含数字');

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 验证两次密码是否一致
 */
export const isPasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

/**
 * 验证金额
 */
export const isValidAmount = (amount: string): boolean => {
  if (!amount || amount.trim() === '') return false;

  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

/**
 * 验证 Gas 价格
 */
export const isValidGasPrice = (gasPrice: string): boolean => {
  if (!gasPrice || gasPrice.trim() === '') return false;

  const num = parseFloat(gasPrice);
  return !isNaN(num) && num >= 0;
};
