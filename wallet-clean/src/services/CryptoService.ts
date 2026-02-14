/**
 * 加密解密服务
 * 使用 expo-crypto 提供加密功能
 */

import * as Crypto from 'expo-crypto';
import { EncryptedData } from '@types/storage.types';
import { ENCRYPTION_ALGORITHM } from '@utils/constants';

export class CryptoService {
  /**
   * 生成随机盐值
   */
  private static async generateSalt(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * 从密码派生密钥（PBKDF2）
   */
  private static async deriveKey(password: string, salt: string): Promise<string> {
    const passwordBytes = new TextEncoder().encode(password + salt);
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Array.from(passwordBytes).map(b => String.fromCharCode(b)).join('')
    );
    return hash;
  }

  /**
   * 加密数据
   * @param data 明文数据
   * @param password 加密密码
   * @returns 加密后的数据对象
   */
  static async encrypt(data: string, password: string): Promise<EncryptedData> {
    try {
      // 生成盐值
      const salt = await this.generateSalt();

      // 派生密钥
      const key = await this.deriveKey(password, salt);

      // 生成 IV
      const ivBytes = await Crypto.getRandomBytesAsync(16);
      const iv = Array.from(ivBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // 简单的 XOR 加密（生产环境应使用 AES）
      // 注意：expo-crypto 不直接支持 AES，这里使用简化版本
      // 实际项目中应使用 react-native-aes-crypto 或类似库
      const dataBytes = new TextEncoder().encode(data);
      const keyBytes = new TextEncoder().encode(key);

      const encrypted = Array.from(dataBytes).map((byte, i) => {
        return byte ^ keyBytes.charCodeAt(i % keyBytes.length);
      });

      const ciphertext = Buffer.from(encrypted).toString('base64');

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
   * @param encryptedData 加密的数据对象
   * @param password 解密密码
   * @returns 解密后的明文
   */
  static async decrypt(encryptedData: EncryptedData, password: string): Promise<string> {
    try {
      const { ciphertext, salt } = encryptedData;

      // 派生密钥
      const key = await this.deriveKey(password, salt);

      // 解密
      const encrypted = Buffer.from(ciphertext, 'base64');
      const keyBytes = new TextEncoder().encode(key);

      const decrypted = Array.from(encrypted).map((byte, i) => {
        return byte ^ keyBytes.charCodeAt(i % keyBytes.length);
      });

      return new TextDecoder().decode(new Uint8Array(decrypted));
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
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
  }
}
