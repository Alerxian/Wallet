/**
 * 设置状态管理
 * 管理应用设置（主题、语言、通知等）
 */

import { create } from 'zustand';
import { StorageService } from '@/services/StorageService';

export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'zh' | 'en';

interface SettingsState {
  theme: Theme;
  language: Language;
  notificationsEnabled: boolean;
  biometricEnabled: boolean;
  autoLockMinutes: number;
  currency: string;

  // Actions
  setTheme: (theme: Theme) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setAutoLockMinutes: (minutes: number) => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
  init: () => Promise<void>;
}

const STORAGE_KEY = 'app_settings';

const defaultSettings = {
  theme: 'dark' as Theme,
  language: 'zh' as Language,
  notificationsEnabled: true,
  biometricEnabled: false,
  autoLockMinutes: 5,
  currency: 'USD',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,

  setTheme: async (theme: Theme) => {
    set({ theme });
    await saveSettings(get());
  },

  setLanguage: async (language: Language) => {
    set({ language });
    await saveSettings(get());
  },

  setNotificationsEnabled: async (enabled: boolean) => {
    set({ notificationsEnabled: enabled });
    await saveSettings(get());
  },

  setBiometricEnabled: async (enabled: boolean) => {
    set({ biometricEnabled: enabled });
    await saveSettings(get());
  },

  setAutoLockMinutes: async (minutes: number) => {
    set({ autoLockMinutes: minutes });
    await saveSettings(get());
  },

  setCurrency: async (currency: string) => {
    set({ currency });
    await saveSettings(get());
  },

  init: async () => {
    try {
      const settingsStr = await StorageService.getSecure(STORAGE_KEY);
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        set({ ...defaultSettings, ...settings });
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  },
}));

async function saveSettings(state: SettingsState): Promise<void> {
  try {
    const settings = {
      theme: state.theme,
      language: state.language,
      notificationsEnabled: state.notificationsEnabled,
      biometricEnabled: state.biometricEnabled,
      autoLockMinutes: state.autoLockMinutes,
      currency: state.currency,
    };
    await StorageService.setSecure(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('保存设置失败:', error);
  }
}
