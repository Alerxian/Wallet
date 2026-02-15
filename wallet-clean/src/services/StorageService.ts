/**
 * 安全存储服务
 * 使用 expo-secure-store 存储敏感数据
 *
 * expo-secure-store 提供系统级加密：
 * - iOS: 使用 Keychain
 * - Android: 使用 EncryptedSharedPreferences
 *
 * 注意：不再使用应用层加密，直接依赖系统级加密
 */

import * as SecureStore from "expo-secure-store";
import { SecureStoreKey } from "@/types/storage.types";
import { STORAGE_PREFIX } from "@utils/constants";

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
  static async setSecure(
    key: SecureStoreKey | string,
    value: string,
  ): Promise<void> {
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
    await Promise.all(keys.map((key) => this.deleteSecure(key)));
  }
}
