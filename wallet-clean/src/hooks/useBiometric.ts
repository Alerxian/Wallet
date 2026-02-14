/**
 * 生物识别 Hook
 */

import { useState, useEffect } from 'react';
import { BiometricService } from '@services/BiometricService';

export const useBiometric = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [supportedTypes, setSupportedTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    setIsLoading(true);
    try {
      const available = await BiometricService.isAvailable();
      const enabled = await BiometricService.isEnabled();
      const types = await BiometricService.getSupportedTypes();

      setIsAvailable(available);
      setIsEnabled(enabled);
      setSupportedTypes(types);
    } catch (error) {
      console.error('检查生物识别失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async (reason?: string): Promise<boolean> => {
    try {
      return await BiometricService.authenticate(reason);
    } catch (error) {
      console.error('生物识别认证失败:', error);
      return false;
    }
  };

  const enable = async (): Promise<boolean> => {
    try {
      await BiometricService.enable();
      setIsEnabled(true);
      return true;
    } catch (error) {
      console.error('启用生物识别失败:', error);
      return false;
    }
  };

  const disable = async (): Promise<boolean> => {
    try {
      await BiometricService.disable();
      setIsEnabled(false);
      return true;
    } catch (error) {
      console.error('禁用生物识别失败:', error);
      return false;
    }
  };

  return {
    isAvailable,
    isEnabled,
    supportedTypes,
    isLoading,
    authenticate,
    enable,
    disable,
    refresh: checkBiometric,
  };
};
