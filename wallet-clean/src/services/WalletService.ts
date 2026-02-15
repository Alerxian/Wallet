/**
 * 钱包核心服务
 * 负责助记词生成、钱包创建、导入等核心功能
 */

import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { HDKey } from "@scure/bip32";
import { keccak_256 } from "@noble/hashes/sha3.js";
import * as secp from "@noble/secp256k1";
import * as Crypto from "expo-crypto";
import {
  Wallet,
  WalletType,
  MnemonicLength,
  CreateWalletParams,
  ImportWalletParams,
} from "@/types/wallet.types";
import { StorageService } from "./StorageService";
import { SecureStoreKey } from "@/types/storage.types";
import { DERIVATION_PATH } from "@utils/constants";
import {
  isValidMnemonic,
  isValidPrivateKey,
  isValidAddress,
} from "@utils/validation";
import { generateId } from "@utils/helpers";

export class WalletService {
  /**
   * 生成助记词
   * @param length 助记词长度（12 或 24）
   * @returns 助记词字符串
   */
  static async generateMnemonic(
    length: MnemonicLength = MnemonicLength.TWELVE,
  ): Promise<string> {
    try {
      // 12 词需要 128 位熵，24 词需要 256 位熵
      const entropyLength = length === MnemonicLength.TWELVE ? 16 : 32;
      const entropy = await Crypto.getRandomBytesAsync(entropyLength);
      const mnemonic = bip39.entropyToMnemonic(entropy, wordlist);

      return mnemonic;
    } catch (error) {
      throw new Error(`生成助记词失败: ${error}`);
    }
  }

  /**
   * 从私钥获取以太坊地址
   */
  private static getAddressFromPrivateKey(privateKey: Uint8Array): string {
    // 获取公钥（未压缩格式，65 字节）
    const publicKey = secp.getPublicKey(privateKey, false);

    // 去掉第一个字节（0x04 前缀）
    const publicKeyHash = keccak_256(publicKey.slice(1));

    // 取后 20 字节作为地址
    const address = publicKeyHash.slice(-20);

    // 转换为十六进制字符串并添加 0x 前缀
    return (
      "0x" +
      Array.from(address)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  }

  /**
   * 从助记词创建钱包
   * @param params 创建钱包参数
   * @returns 钱包对象
   */
  static async createWallet(params: CreateWalletParams): Promise<Wallet> {
    try {
      const { name, mnemonic } = params;

      // 验证助记词
      if (!isValidMnemonic(mnemonic)) {
        throw new Error("无效的助记词");
      }
      // 从助记词生成种子
      const seed = await bip39.mnemonicToSeed(mnemonic);

      // 使用 BIP32 派生密钥
      const hdKey = HDKey.fromMasterSeed(seed);
      const derivedKey = hdKey.derive(DERIVATION_PATH);

      if (!derivedKey.privateKey) {
        throw new Error("派生私钥失败");
      }

      // 获取地址
      const address = this.getAddressFromPrivateKey(derivedKey.privateKey);

      // 创建钱包对象
      const wallet: Wallet = {
        id: generateId(),
        name,
        address,
        type: WalletType.MNEMONIC,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // 保存助记词到安全存储
      await StorageService.setSecure(
        `${SecureStoreKey.ENCRYPTED_MNEMONIC}_${wallet.id}`,
        mnemonic,
      );

      // 保存钱包信息
      await this.saveWallet(wallet);

      // 设置为当前钱包
      await this.setCurrentWallet(wallet.id);

      return wallet;
    } catch (error) {
      throw new Error(`创建钱包失败: ${error}`);
    }
  }

  /**
   * 导入钱包
   * @param params 导入参数
   * @returns 钱包对象
   */
  static async importWallet(params: ImportWalletParams): Promise<Wallet> {
    try {
      const { name, mnemonic, privateKey } = params;

      let address: string;
      let type: WalletType;
      let secretToStore: string;
      let storeKey: string;

      if (mnemonic) {
        // 通过助记词导入
        if (!isValidMnemonic(mnemonic)) {
          throw new Error("无效的助记词");
        }

        // 从助记词生成种子
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const hdKey = HDKey.fromMasterSeed(seed);
        const derivedKey = hdKey.derive(DERIVATION_PATH);

        if (!derivedKey.privateKey) {
          throw new Error("派生私钥失败");
        }

        address = this.getAddressFromPrivateKey(derivedKey.privateKey);
        type = WalletType.MNEMONIC;
        secretToStore = mnemonic;
        storeKey = SecureStoreKey.ENCRYPTED_MNEMONIC;
      } else if (privateKey) {
        // 通过私钥导入
        if (!isValidPrivateKey(privateKey)) {
          throw new Error("无效的私钥");
        }

        // 移除 0x 前缀（如果有）
        const cleanPrivateKey = privateKey.startsWith("0x")
          ? privateKey.slice(2)
          : privateKey;

        // 转换为 Uint8Array
        const privateKeyBytes = new Uint8Array(
          cleanPrivateKey.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
        );

        address = this.getAddressFromPrivateKey(privateKeyBytes);
        type = WalletType.PRIVATE_KEY;
        secretToStore = privateKey;
        storeKey = SecureStoreKey.ENCRYPTED_PRIVATE_KEY;
      } else {
        throw new Error("必须提供助记词或私钥");
      }

      // 创建钱包对象
      const walletObj: Wallet = {
        id: generateId(),
        name,
        address,
        type,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // 保存密钥到安全存储
      await StorageService.setSecure(
        `${storeKey}_${walletObj.id}`,
        secretToStore,
      );

      // 保存钱包信息
      await this.saveWallet(walletObj);

      // 设置为当前钱包
      await this.setCurrentWallet(walletObj.id);

      return walletObj;
    } catch (error) {
      throw new Error(`导入钱包失败: ${error}`);
    }
  }

  /**
   * 获取钱包实例（用于签名）
   * @param walletId 钱包 ID
   * @returns 私钥的 Uint8Array
   */
  static async getWalletPrivateKey(
    walletId: string,
  ): Promise<Uint8Array> {
    try {
      const wallet = await this.getWalletById(walletId);
      if (!wallet) {
        throw new Error("钱包不存在");
      }

      let secret: string | null;

      if (wallet.type === WalletType.MNEMONIC) {
        // 获取助记词
        secret = await StorageService.getSecure(
          `${SecureStoreKey.ENCRYPTED_MNEMONIC}_${walletId}`,
        );

        if (!secret) {
          throw new Error("获取助记词失败");
        }

        // 从助记词派生私钥
        const seed = await bip39.mnemonicToSeed(secret);
        const hdKey = HDKey.fromMasterSeed(seed);
        const derivedKey = hdKey.derive(DERIVATION_PATH);

        if (!derivedKey.privateKey) {
          throw new Error("派生私钥失败");
        }

        return derivedKey.privateKey;
      } else if (wallet.type === WalletType.PRIVATE_KEY) {
        // 获取私钥
        secret = await StorageService.getSecure(
          `${SecureStoreKey.ENCRYPTED_PRIVATE_KEY}_${walletId}`,
        );

        if (!secret) {
          throw new Error("获取私钥失败");
        }

        // 移除 0x 前缀（如果有）
        const cleanPrivateKey = secret.startsWith("0x")
          ? secret.slice(2)
          : secret;

        // 转换为 Uint8Array
        return new Uint8Array(
          cleanPrivateKey.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
        );
      } else {
        throw new Error("不支持的钱包类型");
      }
    } catch (error) {
      throw new Error(`获取钱包私钥失败: ${error}`);
    }
  }

  /**
   * 保存钱包到列表
   */
  private static async saveWallet(wallet: Wallet): Promise<void> {
    const wallets = await this.getAllWallets();
    wallets.push(wallet);
    await StorageService.setSecure(
      SecureStoreKey.WALLET_LIST,
      JSON.stringify(wallets),
    );
  }

  /**
   * 获取所有钱包
   */
  static async getAllWallets(): Promise<Wallet[]> {
    try {
      const walletsStr = await StorageService.getSecure(
        SecureStoreKey.WALLET_LIST,
      );
      if (!walletsStr) return [];
      return JSON.parse(walletsStr);
    } catch (error) {
      return [];
    }
  }

  /**
   * 根据 ID 获取钱包
   */
  static async getWalletById(walletId: string): Promise<Wallet | null> {
    const wallets = await this.getAllWallets();
    return wallets.find((w) => w.id === walletId) || null;
  }

  /**
   * 获取当前钱包
   */
  static async getCurrentWallet(): Promise<Wallet | null> {
    try {
      const currentId = await StorageService.getSecure(
        SecureStoreKey.CURRENT_WALLET_ID,
      );
      if (!currentId) return null;
      return await this.getWalletById(currentId);
    } catch (error) {
      return null;
    }
  }

  /**
   * 设置当前钱包
   */
  static async setCurrentWallet(walletId: string): Promise<void> {
    await StorageService.setSecure(SecureStoreKey.CURRENT_WALLET_ID, walletId);
  }

  /**
   * 删除钱包
   */
  static async deleteWallet(walletId: string): Promise<void> {
    try {

      // 删除密钥
      const wallet = await this.getWalletById(walletId);
      if (wallet) {
        if (wallet.type === WalletType.MNEMONIC) {
          await StorageService.deleteSecure(
            `${SecureStoreKey.ENCRYPTED_MNEMONIC}_${walletId}`,
          );
        } else if (wallet.type === WalletType.PRIVATE_KEY) {
          await StorageService.deleteSecure(
            `${SecureStoreKey.ENCRYPTED_PRIVATE_KEY}_${walletId}`,
          );
        }
      }

      // 从列表中移除
      const wallets = await this.getAllWallets();
      const filtered = wallets.filter((w) => w.id !== walletId);
      await StorageService.setSecure(
        SecureStoreKey.WALLET_LIST,
        JSON.stringify(filtered),
      );

      // 如果删除的是当前钱包，清除当前钱包 ID
      const currentId = await StorageService.getSecure(
        SecureStoreKey.CURRENT_WALLET_ID,
      );
      if (currentId === walletId) {
        await StorageService.deleteSecure(SecureStoreKey.CURRENT_WALLET_ID);
      }
    } catch (error) {
      throw new Error(`删除钱包失败: ${error}`);
    }
  }

  /**
   * 验证密码（已废弃，不再需要密码验证）
   */
  static async verifyPassword(
    walletId: string,
    password: string,
  ): Promise<boolean> {
    // expo-secure-store 已提供系统级加密，不再需要应用层密码验证
    return true;
  }

  /**
   * 导出助记词
   */
  static async exportMnemonic(
    walletId: string,
  ): Promise<string> {
    try {
      const wallet = await this.getWalletById(walletId);
      if (!wallet || wallet.type !== WalletType.MNEMONIC) {
        throw new Error("该钱包不支持导出助记词");
      }

      const mnemonic = await StorageService.getSecure(
        `${SecureStoreKey.ENCRYPTED_MNEMONIC}_${walletId}`,
      );

      if (!mnemonic) {
        throw new Error("导出助记词失败");
      }

      return mnemonic;
    } catch (error) {
      throw new Error(`导出助记词失败: ${error}`);
    }
  }

  /**
   * 导出私钥
   */
  static async exportPrivateKey(
    walletId: string,
  ): Promise<string> {
    try {
      const privateKey = await this.getWalletPrivateKey(walletId);
      // 转换为十六进制字符串并添加 0x 前缀
      return (
        "0x" +
        Array.from(privateKey)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );
    } catch (error) {
      throw new Error(`导出私钥失败: ${error}`);
    }
  }
}
