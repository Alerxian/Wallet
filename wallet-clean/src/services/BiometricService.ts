/**
 * 生物识别服务
 * 支持 Face ID / Touch ID / 指纹识别
 */

import * as LocalAuthentication from "expo-local-authentication";
import { StorageService } from "./StorageService";
import { SecureStoreKey } from "@/types/storage.types";

export class BiometricService {
  /**
   * 检查设备是否支持生物识别
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error("检查生物识别失败:", error);
      return false;
    }
  }

  /**
   * 获取支持的生物识别类型
   */
  static async getSupportedTypes(): Promise<string[]> {
    try {
      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types.map((type) => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return "指纹识别";
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return "Face ID";
          case LocalAuthentication.AuthenticationType.IRIS:
            return "虹膜识别";
          default:
            return "生物识别";
        }
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * 执行生物识别认证
   */
  static async authenticate(reason?: string): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || "验证身份以继续",
        cancelLabel: "取消",
        fallbackLabel: "使用密码",
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error("生物识别认证失败:", error);
      return false;
    }
  }

  /**
   * 检查是否启用了生物识别
   */
  static async isEnabled(): Promise<boolean> {
    try {
      const enabled = await StorageService.getSecure(
        SecureStoreKey.BIOMETRIC_ENABLED,
      );
      return enabled === "true";
    } catch (error) {
      return false;
    }
  }

  /**
   * 启用生物识别
   */
  static async enable(): Promise<void> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error("设备不支持生物识别或未设置");
    }

    // 先验证一次
    const authenticated = await this.authenticate("启用生物识别");
    if (!authenticated) {
      throw new Error("生物识别验证失败");
    }

    await StorageService.setSecure(SecureStoreKey.BIOMETRIC_ENABLED, "true");
  }

  /**
   * 禁用生物识别
   */
  static async disable(): Promise<void> {
    await StorageService.deleteSecure(SecureStoreKey.BIOMETRIC_ENABLED);
  }

  /**
   * 使用生物识别解锁钱包
   */
  static async unlockWallet(): Promise<boolean> {
    const enabled = await this.isEnabled();
    if (!enabled) {
      return false;
    }

    return await this.authenticate("解锁钱包");
  }
}
