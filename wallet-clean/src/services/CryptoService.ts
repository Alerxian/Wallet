/**
 * 加密解密服务（已废弃）
 *
 * ⚠️ 已废弃：不再使用应用层加密
 *
 * 项目已改为直接使用 expo-secure-store 的系统级加密：
 * - iOS: Keychain
 * - Android: EncryptedSharedPreferences
 *
 * 保留此文件仅供参考，如需其他加密功能可以使用此类中的工具方法
 *
 * 原实现：使用 AES-256-GCM 提供安全加密
 * 双层加密：应用层 AES + 系统层 SecureStore
 */

import * as Crypto from "expo-crypto";
import { gcm } from "@noble/ciphers/aes.js";
import { pbkdf2 } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { EncryptedData } from "@/types/storage.types";

export class CryptoService {
  // PBKDF2 迭代次数（推荐 100,000+）
  private static readonly PBKDF2_ITERATIONS = 100000;
  // 盐值长度（字节）
  private static readonly SALT_LENGTH = 32;
  // IV/Nonce 长度（字节）
  private static readonly NONCE_LENGTH = 12;
  // AES-256 密钥长度（字节）
  private static readonly KEY_LENGTH = 32;

  /**
   * 生成随机盐值
   */
  private static async generateSalt(): Promise<Uint8Array> {
    return await Crypto.getRandomBytesAsync(this.SALT_LENGTH);
  }

  /**
   * 生成随机 Nonce
   */
  private static async generateNonce(): Promise<Uint8Array> {
    return await Crypto.getRandomBytesAsync(this.NONCE_LENGTH);
  }

  /**
   * 从密码派生密钥（PBKDF2-SHA256）
   */
  private static deriveKey(password: string, salt: Uint8Array): Uint8Array {
    const passwordBytes = new TextEncoder().encode(password);
    return pbkdf2(sha256, passwordBytes, salt, {
      c: this.PBKDF2_ITERATIONS,
      dkLen: this.KEY_LENGTH,
    });
  }

  /**
   * 将 Uint8Array 转换为 Base64
   */
  private static toBase64(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString("base64");
  }

  /**
   * 将 Base64 转换为 Uint8Array
   */
  private static fromBase64(base64: string): Uint8Array {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }

  /**
   * 加密数据（AES-256-GCM）
   * @param data 明文数据
   * @param password 加密密码
   * @returns 加密后的数据对象
   */
  static async encrypt(data: string, password: string): Promise<EncryptedData> {
    try {
      // 生成盐值和 nonce
      const salt = await this.generateSalt();
      const nonce = await this.generateNonce();

      // 从密码派生密钥
      const key = this.deriveKey(password, salt);

      // 加密数据（AES-256-GCM）
      const dataBytes = new TextEncoder().encode(data);
      const cipher = gcm(key, nonce);
      const ciphertext = cipher.encrypt(dataBytes);

      return {
        ciphertext: this.toBase64(ciphertext),
        iv: this.toBase64(nonce),
        salt: this.toBase64(salt),
        algorithm: "AES-256-GCM",
      };
    } catch (error) {
      throw new Error(`加密失败: ${error}`);
    }
  }

  /**
   * 解密数据（AES-256-GCM）
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

      // 解析数据
      const ciphertextBytes = this.fromBase64(ciphertext);
      const nonce = this.fromBase64(iv);
      const saltBytes = this.fromBase64(salt);

      // 从密码派生密钥
      const key = this.deriveKey(password, saltBytes);

      // 解密数据（AES-256-GCM）
      const decipher = gcm(key, nonce);
      const decrypted = decipher.decrypt(ciphertextBytes);

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
  static async sha256Hash(data: string): Promise<string> {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data,
    );
  }
}
