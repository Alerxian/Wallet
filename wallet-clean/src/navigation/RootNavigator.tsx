/**
 * 根导航
 */

import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthNavigator } from "./AuthNavigator";
import { MainNavigator } from "./MainNavigator";
import { useWalletStore } from "@store/walletStore";
import { Loading } from "@components/common/Loading";
import { useTheme } from "@/theme/ThemeContext";

const Stack = createStackNavigator();

export const RootNavigator: React.FC = () => {
  const { currentWallet, loadWallets } = useWalletStore();
  const { theme: colors } = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadWallets();
      setIsReady(true);
    };
    init();
  }, []);

  if (!isReady) {
    return <Loading text="加载中..." />;
  }

  const navigationTheme = {
    dark: true,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text.primary,
      border: colors.border,
      notification: colors.accent,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '800' as const },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme as any}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!currentWallet ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
