/**
 * 截屏保护 Hook
 * 在敏感页面自动启用截屏保护
 */

import { useEffect } from 'react';

export const useScreenProtection = (enabled: boolean = true) => {
  useEffect(() => {
    // 暂时禁用截屏保护功能
    // TODO: 需要安装 expo-screen-capture 才能使用
  }, [enabled]);
};
