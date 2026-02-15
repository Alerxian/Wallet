/**
 * WalletService 完整测试用例
 */

import { WalletService } from "@services/WalletService";
import { StorageService } from "@services/StorageService";
import { MnemonicLength, WalletType } from "@/types/wallet.types";
import { isValidMnemonic, isValidAddress } from "@utils/validation";

// Mock StorageService
jest.mock("@services/StorageService", () => ({
  StorageService: {
    setSecure: jest.fn(() => Promise.resolve()),
    getSecure: jest.fn(() => Promise.resolve(null)),
    deleteSecure: jest.fn(() => Promise.resolve()),
    hasKey: jest.fn(() => Promise.resolve(false)),
    clearAll: jest.fn(() => Promise.resolve()),
  },
}));

describe("WalletService - 助记词生成", () => {
  describe("generateMnemonic", () => {
    it("应该生成 12 词助记词", async () => {
      const mnemonic = await WalletService.generateMnemonic(
        MnemonicLength.TWELVE,
      );
      const words = mnemonic.split(" ");

      expect(words.length).toBe(12);
      expect(isValidMnemonic(mnemonic, 12)).toBe(true);
    });

    it("应该生成 24 词助记词", async () => {
      const mnemonic = await WalletService.generateMnemonic(
        MnemonicLength.TWENTY_FOUR,
      );
      const words = mnemonic.split(" ");

      expect(words.length).toBe(24);
      expect(isValidMnemonic(mnemonic, 24)).toBe(true);
    });

    it("默认应该生成 12 词助记词", async () => {
      const mnemonic = await WalletService.generateMnemonic();
      const words = mnemonic.split(" ");

      expect(words.length).toBe(12);
    });

    it("每次生成的助记词应该不同", async () => {
      const mnemonic1 = await WalletService.generateMnemonic();
      const mnemonic2 = await WalletService.generateMnemonic();

      expect(mnemonic1).not.toBe(mnemonic2);
    });

    it("生成的助记词应该都是小写", async () => {
      const mnemonic = await WalletService.generateMnemonic();
      expect(mnemonic).toBe(mnemonic.toLowerCase());
    });

    it("生成的助记词单词之间应该用单个空格分隔", async () => {
      const mnemonic = await WalletService.generateMnemonic();
      expect(mnemonic).not.toMatch(/\s{2,}/); // 不应该有多个连续空格
      expect(mnemonic.trim()).toBe(mnemonic); // 首尾不应该有空格
    });
  });
});

describe("WalletService - 钱包创建", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createWallet", () => {
    it("应该成功创建钱包", async () => {
      const mnemonic = await WalletService.generateMnemonic();
      const wallet = await WalletService.createWallet({
        name: "测试钱包",
        mnemonic,
      });

      expect(wallet).toBeDefined();
      expect(wallet.id).toBeDefined();
      expect(wallet.name).toBe("测试钱包");
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(wallet.type).toBe(WalletType.MNEMONIC);
      expect(wallet.createdAt).toBeDefined();
      expect(wallet.updatedAt).toBeDefined();
    });

    it("应该正确保存助记词", async () => {
      const mnemonic = await WalletService.generateMnemonic();
      await WalletService.createWallet({
        name: "测试钱包",
        mnemonic,
      });

      expect(StorageService.setSecure).toHaveBeenCalled();
    });

    it("无效助记词应该抛出错误", async () => {
      await expect(
        WalletService.createWallet({
          name: "测试钱包",
          mnemonic: "invalid mnemonic phrase",
        }),
      ).rejects.toThrow();
    });

    it("空助记词应该抛出错误", async () => {
      await expect(
        WalletService.createWallet({
          name: "测试钱包",
          mnemonic: "",
        }),
      ).rejects.toThrow();
    });

    it("相同助记词应该生成相同地址", async () => {
      const mnemonic = await WalletService.generateMnemonic();

      const wallet1 = await WalletService.createWallet({
        name: "钱包1",
        mnemonic,
      });

      const wallet2 = await WalletService.createWallet({
        name: "钱包2",
        mnemonic,
      });

      expect(wallet1.address).toBe(wallet2.address);
    });

    it("不同助记词应该生成不同地址", async () => {
      const mnemonic1 = await WalletService.generateMnemonic();
      const mnemonic2 = await WalletService.generateMnemonic();

      const wallet1 = await WalletService.createWallet({
        name: "钱包1",
        mnemonic: mnemonic1,
      });

      const wallet2 = await WalletService.createWallet({
        name: "钱包2",
        mnemonic: mnemonic2,
      });

      expect(wallet1.address).not.toBe(wallet2.address);
    });
  });
});

describe("WalletService - 钱包导入", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("importWallet - 助记词导入", () => {
    it("应该成功导入助记词钱包", async () => {
      const mnemonic = await WalletService.generateMnemonic();
      const wallet = await WalletService.importWallet({
        name: "导入的钱包",
        mnemonic,
      });

      expect(wallet).toBeDefined();
      expect(wallet.name).toBe("导入的钱包");
      expect(wallet.type).toBe(WalletType.MNEMONIC);
      expect(isValidAddress(wallet.address)).toBe(true);
    });

    it("导入的钱包地址应该与创建的钱包地址一致", async () => {
      const mnemonic = await WalletService.generateMnemonic();

      const createdWallet = await WalletService.createWallet({
        name: "创建的钱包",
        mnemonic,
      });

      const importedWallet = await WalletService.importWallet({
        name: "导入的钱包",
        mnemonic,
      });

      expect(importedWallet.address).toBe(createdWallet.address);
    });
  });

  describe("importWallet - 私钥导入", () => {
    it("应该成功导入私钥钱包", async () => {
      // 使用一个已知的私钥进行测试
      const testPrivateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      const importedWallet = await WalletService.importWallet({
        name: "导入的钱包",
        privateKey: testPrivateKey,
      });

      expect(importedWallet).toBeDefined();
      expect(importedWallet.type).toBe(WalletType.PRIVATE_KEY);
      expect(isValidAddress(importedWallet.address)).toBe(true);
    });

    it("无效私钥应该抛出错误", async () => {
      await expect(
        WalletService.importWallet({
          name: "测试钱包",
          privateKey: "0xinvalidprivatekey",
        }),
      ).rejects.toThrow();
    });
  });

  describe("importWallet - 参数验证", () => {
    it("既没有助记词也没有私钥应该抛出错误", async () => {
      await expect(
        WalletService.importWallet({
          name: "测试钱包",
        }),
      ).rejects.toThrow();
    });

    it("同时提供助记词和私钥应该优先使用助记词", async () => {
      const mnemonic = await WalletService.generateMnemonic();
      const wallet = await WalletService.importWallet({
        name: "测试钱包",
        mnemonic,
        privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      });

      expect(wallet.type).toBe(WalletType.MNEMONIC);
    });
  });
});

describe("WalletService - 钱包导出", () => {
  describe("exportMnemonic", () => {
    it("应该在钱包不存在时抛出错误", async () => {
      (StorageService.getSecure as jest.Mock).mockResolvedValue(JSON.stringify([]));

      await expect(
        WalletService.exportMnemonic("non-existent-id"),
      ).rejects.toThrow();
    });
  });

  describe("exportPrivateKey", () => {
    it("应该在钱包不存在时抛出错误", async () => {
      (StorageService.getSecure as jest.Mock).mockResolvedValue(JSON.stringify([]));

      await expect(
        WalletService.exportPrivateKey("non-existent-id"),
      ).rejects.toThrow();
    });
  });
});

describe("WalletService - 边界情况", () => {
  it("应该处理特殊字符的钱包名称", async () => {
    const mnemonic = await WalletService.generateMnemonic();
    const wallet = await WalletService.createWallet({
      name: "测试钱包 🚀 #1",
      mnemonic,
    });

    expect(wallet.name).toBe("测试钱包 🚀 #1");
  });

  it("应该处理很长的钱包名称", async () => {
    const mnemonic = await WalletService.generateMnemonic();
    const longName = "A".repeat(100);
    const wallet = await WalletService.createWallet({
      name: longName,
      mnemonic,
    });

    expect(wallet.name).toBe(longName);
  });
});

describe("WalletService - 性能测试", () => {
  it("生成助记词应该在合理时间内完成", async () => {
    const startTime = Date.now();
    await WalletService.generateMnemonic();
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000); // 应该在 1 秒内完成
  });

  it("创建钱包应该在合理时间内完成", async () => {
    const mnemonic = await WalletService.generateMnemonic();
    const startTime = Date.now();
    await WalletService.createWallet({
      name: "测试钱包",
      mnemonic,
    });
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(2000); // 应该在 2 秒内完成
  });
});
