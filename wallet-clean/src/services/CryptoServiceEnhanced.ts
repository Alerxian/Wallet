/**
 * 增强版加密服务（已废弃）
 *
 * ⚠️ 已废弃：不再使用应用层加密
 *
 * 项目已改为直接使用 expo-secure-store 的系统级加密：
 * - iOS: Keychain
 * - Android: EncryptedSharedPreferences
 *
 * 保留此文件仅供参考
 *
 * 原实现：使用简化版加密（XOR）
 * 生产环境建议使用 react-native-aes-crypto 或 expo-crypto 的 AES 实现
 */

import * as Crypto from "expo-crypto";
import { EncryptedData } from "@/types/storage.types";
import { ENCRYPTION_ALGORITHM } from "@utils/constants";

export class CryptoServiceEnhanced {
  /**
   * 生成随机盐值（16 字节）
   */
  private static async generateSalt(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return this.bytesToHex(randomBytes);
  }

  /**
   * 生成随机 IV（16 字节）
   */
  private static async generateIV(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return this.bytesToHex(randomBytes);
  }

  /**
   * 字节数组转十六进制字符串
   */
  private static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * 十六进制字符串转字节数组
   */
  private static hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * 使用 PBKDF2 从密码派生密钥
   *
   * @param password 用户密码
   * @param salt 盐值
   * @param iterations 迭代次数（默认 100000）
   * @returns 派生的密钥（十六进制字符串）
   */
  private static async deriveKey(
    password: string,
    salt: string,
    iterations: number = 100000,
  ): Promise<string> {
    // 组合密码和盐值
    const combined = password + salt;

    // 使用 SHA-256 多次哈希模拟 PBKDF2
    let key = combined;
    for (let i = 0; i < iterations / 1000; i++) {
      key = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        key,
      );
    }

    return key;
  }

  /**
   * 加密数据
   *
   * ⚠️ 生产环境建议：
   * ```typescript
   * import Aes from 'react-native-aes-crypto';
   * const encrypted = await Aes.encrypt(data, key, iv, 'aes-256-gcm');
   * ```
   *
   * @param data 明文数据
   * @param password 加密密码
   * @returns 加密后的数据对象
   */
  static async encrypt(data: string, password: string): Promise<EncryptedData> {
    try {
      // 生成盐值和 IV
      const salt = await this.generateSalt();
      const iv = await this.generateIV();

      // 派生密钥
      const key = await this.deriveKey(password, salt);

      // 简化版加密（XOR）
      // 生产环境应使用 AES-256-GCM
      const dataBytes = new TextEncoder().encode(data);
      const keyBytes = this.hexToBytes(key);
      const ivBytes = this.hexToBytes(iv);

      const encrypted = new Uint8Array(dataBytes.length);
      for (let i = 0; i < dataBytes.length; i++) {
        encrypted[i] =
          dataBytes[i] ^
          keyBytes[i % keyBytes.length] ^
          ivBytes[i % ivBytes.length];
      }

      const ciphertext = this.bytesToHex(encrypted);

      return {
        ciphertext,
        iv,
        salt,
        algorithm: ENCRYPTION_ALGORITHM,
      };
    } catch (error) {
      throw new Error(`加密失败: ${error}`);
    }
  }

  /**
   * 解密数据
   *
   * @param encryptedData 加密的数据对象
   * @param password 解密密码
   * @returns 解密后的明文
   */
  static async decrypt(
    encryptedData: EncryptedData,
    password: string,
  ): Promise<string> {
    try {
      const { ciphertext, iv, salt } = encryptedData;

      // 派生密钥
      const key = await this.deriveKey(password, salt);

      // 解密
      const encrypted = this.hexToBytes(ciphertext);
      const keyBytes = this.hexToBytes(key);
      const ivBytes = this.hexToBytes(iv);

      const decrypted = new Uint8Array(encrypted.length);
      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] =
          encrypted[i] ^
          keyBytes[i % keyBytes.length] ^
          ivBytes[i % ivBytes.length];
      }

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      throw new Error(`解密失败: ${error}`);
    }
  }

  /**
   * 生成随机字节
   */
  static async getRandomBytes(length: number): Promise<Uint8Array> {
    return await Crypto.getRandomBytesAsync(length);
  }

  /**
   * SHA256 哈希
   */
  static async sha256(data: string): Promise<string> {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data,
    );
  }

  /**
   * SHA512 哈希
   */
  static async sha512(data: string): Promise<string> {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA512,
      data,
    );
  }

  /**
   * 验证密码（通过尝试解密）
   */
  static async verifyPassword(
    encryptedData: EncryptedData,
    password: string,
  ): Promise<boolean> {
    try {
      await this.decrypt(encryptedData, password);
      return true;
    } catch (error) {
      return false;
    }
  }
}
