/**
 * WalletService 单元测试
 */

import { WalletService } from '@services/WalletService';
import { MnemonicLength } from '@types/wallet.types';
import { isValidMnemonic } from '@utils/validation';

describe('WalletService', () => {
  describe('generateMnemonic', () => {
    it('应该生成 12 词助记词', () => {
      const mnemonic = WalletService.generateMnemonic(MnemonicLength.TWELVE);
      const words = mnemonic.split(' ');

      expect(words.length).toBe(12);
      expect(isValidMnemonic(mnemonic, 12)).toBe(true);
    });

    it('应该生成 24 词助记词', () => {
      const mnemonic = WalletService.generateMnemonic(MnemonicLength.TWENTY_FOUR);
      const words = mnemonic.split(' ');

      expect(words.length).toBe(24);
      expect(isValidMnemonic(mnemonic, 24)).toBe(true);
    });

    it('每次生成的助记词应该不同', () => {
      const mnemonic1 = WalletService.generateMnemonic();
      const mnemonic2 = WalletService.generateMnemonic();

      expect(mnemonic1).not.toBe(mnemonic2);
    });
  });

  describe('createWallet', () => {
    it('应该成功创建钱包', async () => {
      const mnemonic = WalletService.generateMnemonic();
      const wallet = await WalletService.createWallet({
        name: '测试钱包',
        password: 'test123456',
        mnemonic,
      });

      expect(wallet).toBeDefined();
      expect(wallet.name).toBe('测试钱包');
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('无效助记词应该抛出错误', async () => {
      await expect(
        WalletService.createWallet({
          name: '测试钱包',
          password: 'test123456',
          mnemonic: 'invalid mnemonic phrase',
        })
      ).rejects.toThrow();
    });
  });
});
