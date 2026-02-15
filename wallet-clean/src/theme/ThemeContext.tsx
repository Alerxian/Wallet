/**
 * 主题上下文
 * 管理应用主题状态
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { ThemeColors, ThemeName, getTheme } from './themes';
import { useSettingsStore } from '@/store/settingsStore';

interface ThemeContextType {
  theme: ThemeColors;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme: settingsTheme } = useSettingsStore();
  const [themeName, setThemeName] = useState<ThemeName>('dark');
  const [theme, setThemeColors] = useState<ThemeColors>(getTheme('dark'));

  useEffect(() => {
    // 根据设置更新主题
    let newThemeName: ThemeName = 'dark';

    if (settingsTheme === 'light') {
      newThemeName = 'blue'; // 使用蓝色主题作为浅色主题
    } else if (settingsTheme === 'dark') {
      newThemeName = 'dark';
    } else if (settingsTheme === 'auto') {
      newThemeName = Appearance.getColorScheme() === 'light' ? 'blue' : 'dark';
    }

    setThemeName(newThemeName);
    setThemeColors(getTheme(newThemeName));
  }, [settingsTheme]);

  const handleSetTheme = (newThemeName: ThemeName) => {
    setThemeName(newThemeName);
    setThemeColors(getTheme(newThemeName));
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
