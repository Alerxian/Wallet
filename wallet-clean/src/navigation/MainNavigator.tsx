/**
 * 主应用导航
 */

import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { MainStackParamList } from "@/types/navigation.types";
import { colors } from "@/theme";
import { HomeScreen } from "@screens/Home/HomeScreen";
import { ReceiveScreen } from "@screens/Receive/ReceiveScreen";
import { SendScreen } from "@screens/Send/SendScreen";
import { TransactionHistoryScreen } from "@screens/Transaction/TransactionHistoryScreen";
import { NetworksScreen } from "@screens/Settings/NetworksScreen";
import { AddNetworkScreen } from "@screens/Settings/AddNetworkScreen";
import { TokensScreen } from "@screens/Settings/TokensScreen";
import { AddTokenScreen } from "@screens/Settings/AddTokenScreen";
import { SettingsScreen } from "@screens/Settings/SettingsScreen";
import { SwapScreen } from "@screens/Swap/SwapScreen";
import { NFTListScreen } from "@screens/NFT/NFTListScreen";
import { NFTDetailScreen } from "@screens/NFT/NFTDetailScreen";
import { DeFiScreen } from "@screens/DeFi/DeFiScreen";
import { DAppConnectionsScreen } from "@screens/DApp/DAppConnectionsScreen";
import { PortfolioScreen } from "@screens/Portfolio/PortfolioScreen";
import { HardwareWalletScreen } from "@screens/HardwareWallet/HardwareWalletScreen";

const Stack = createStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: "600",
        },
        cardStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "钱包" }}
      />
      <Stack.Screen
        name="Receive"
        component={ReceiveScreen}
        options={{ title: "接收" }}
      />
      <Stack.Screen
        name="Send"
        component={SendScreen}
        options={{ title: "发送" }}
      />
      <Stack.Screen
        name="TransactionHistory"
        component={TransactionHistoryScreen}
        options={{ title: "交易历史" }}
      />
      <Stack.Screen
        name="Networks"
        component={NetworksScreen}
        options={{ title: "网络管理" }}
      />
      <Stack.Screen
        name="AddNetwork"
        component={AddNetworkScreen}
        options={{ title: "添加网络" }}
      />
      <Stack.Screen
        name="Tokens"
        component={TokensScreen}
        options={{ title: "代币管理" }}
      />
      <Stack.Screen
        name="AddToken"
        component={AddTokenScreen}
        options={{ title: "添加代币" }}
      />
      <Stack.Screen
        name="Swap"
        component={SwapScreen}
        options={{ title: "代币兑换" }}
      />
      <Stack.Screen
        name="NFTList"
        component={NFTListScreen}
        options={{ title: "我的 NFT" }}
      />
      <Stack.Screen
        name="NFTDetail"
        component={NFTDetailScreen}
        options={{ title: "NFT 详情" }}
      />
      <Stack.Screen
        name="DeFi"
        component={DeFiScreen}
        options={{ title: "DeFi" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "设置" }}
      />
      <Stack.Screen
        name="DAppConnections"
        component={DAppConnectionsScreen}
        options={{ title: "dApp 连接" }}
      />
      <Stack.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{ title: "投资组合" }}
      />
      <Stack.Screen
        name="HardwareWallet"
        component={HardwareWalletScreen}
        options={{ title: "硬件钱包" }}
      />
    </Stack.Navigator>
  );
};
