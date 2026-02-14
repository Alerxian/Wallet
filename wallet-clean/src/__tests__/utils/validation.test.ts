/**
 * 验证工具测试
 */

import {
  isValidAddress,
  isValidMnemonic,
  validatePassword,
  isPasswordMatch,
} from '@utils/validation';

describe('Validation Utils', () => {
  describe('isValidAddress', () => {
    it('应该验证有效的以太坊地址', () => {
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(false);
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(true);
    });

    it('应该拒绝无效地址', () => {
      expect(isValidAddress('invalid')).toBe(false);
      expect(isValidAddress('0x123')).toBe(false);
      expect(isValidAddress('')).toBe(false);
    });
  });

  describe('isValidMnemonic', () => {
    it('应该验证 12 词助记词', () => {
      const valid12 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      expect(isValidMnemonic(valid12, 12)).toBe(true);
    });

    it('应该拒绝错误长度的助记词', () => {
      const invalid = 'word1 word2 word3';
      expect(isValidMnemonic(invalid, 12)).toBe(false);
    });

    it('应该拒绝包含非法字符的助记词', () => {
      const invalid = 'word1 word2 word3 123 word5 word6 word7 word8 word9 word10 word11 word12';
      expect(isValidMnemonic(invalid, 12)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('应该接受有效密码', () => {
      const result = validatePassword('test123456');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该拒绝过短的密码', () => {
      const result = validatePassword('123');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该拒绝过长的密码', () => {
      const result = validatePassword('a'.repeat(25));
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('isPasswordMatch', () => {
    it('应该验证密码匹配', () => {
      expect(isPasswordMatch('test123', 'test123')).toBe(true);
    });

    it('应该检测密码不匹配', () => {
      expect(isPasswordMatch('test123', 'test456')).toBe(false);
    });
  });
});
