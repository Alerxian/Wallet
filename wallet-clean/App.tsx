/**
 * 应用入口
 */

import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import { useSettingsStore } from "./src/store/settingsStore";

// 导入 polyfills（ethers.js 需要）
import "react-native-get-random-values";
import { View, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WalletConnectService } from "./src/services/WalletConnectService";
import { WALLETCONNECT_PROJECT_ID } from "./src/config/walletconnect";

function AppContent() {
  const { theme: colors, themeName } = useTheme();
  const { init } = useSettingsStore();

  useEffect(() => {
    // 初始化设置
    init();

    WalletConnectService.init(WALLETCONNECT_PROJECT_ID).catch(() => undefined);

    const handleUrl = async ({ url }: { url: string }) => {
      if (!url.startsWith("wc:")) return;

      try {
        await WalletConnectService.init(WALLETCONNECT_PROJECT_ID);
        await WalletConnectService.pair(url);
        Alert.alert("WalletConnect", "已接收连接请求，请到 dApp 连接页查看会话");
      } catch (error: any) {
        Alert.alert("WalletConnect", error?.message || "处理连接请求失败");
      }
    };

    const sub = Linking.addEventListener("url", handleUrl);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl({ url });
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        style={themeName === "blue" ? "dark" : "light"}
        backgroundColor={colors.background}
        translucent={false}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <RootNavigator />
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
