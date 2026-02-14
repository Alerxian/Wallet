/**
 * 安全存储服务
 * 使用 expo-secure-store 存储敏感数据
 */

import * as SecureStore from 'expo-secure-store';
import { SecureStoreKey, EncryptedData, StorageOptions } from '@types/storage.types';
import { CryptoService } from './CryptoService';
import { STORAGE_PREFIX } from '@utils/constants';

export class StorageService {
  /**
   * 获取完整的存储键名
   */
  private static getKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  /**
   * 保存数据到安全存储
   */
  static async setSecure(key: SecureStoreKey | string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.getKey(key), value);
    } catch (error) {
      throw new Error(`保存数据失败: ${error}`);
    }
  }

  /**
   * 从安全存储获取数据
   */
  static async getSecure(key: SecureStoreKey | string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.getKey(key));
    } catch (error) {
      throw new Error(`获取数据失败: ${error}`);
    }
  }

  /**
   * 从安全存储删除数据
   */
  static async deleteSecure(key: SecureStoreKey | string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.getKey(key));
    } catch (error) {
      throw new Error(`删除数据失败: ${error}`);
    }
  }

  /**
   * 保存加密数据
   */
  static async setEncrypted(
    key: SecureStoreKey | string,
    data: string,
    password: string
  ): Promise<void> {
    try {
      const encrypted = await CryptoService.encrypt(data, password);
      await this.setSecure(key, JSON.stringify(encrypted));
    } catch (error) {
      throw new Error(`保存加密数据失败: ${error}`);
    }
  }

  /**
   * 获取并解密数据
   */
  static async getDecrypted(
    key: SecureStoreKey | string,
    password: string
  ): Promise<string | null> {
    try {
      const encryptedStr = await this.getSecure(key);
      if (!encryptedStr) return null;

      const encrypted: EncryptedData = JSON.parse(encryptedStr);
      return await CryptoService.decrypt(encrypted, password);
    } catch (error) {
      throw new Error(`获取解密数据失败: ${error}`);
    }
  }

  /**
   * 检查键是否存在
   */
  static async hasKey(key: SecureStoreKey | string): Promise<boolean> {
    const value = await this.getSecure(key);
    return value !== null;
  }

  /**
   * 清空所有数据（危险操作）
   */
  static async clearAll(): Promise<void> {
    const keys = Object.values(SecureStoreKey);
    await Promise.all(keys.map(key => this.deleteSecure(key)));
  }
}
