/**
 * 认证流程导航
 */

import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthStackParamList } from "@/types/navigation.types";
import { colors } from "@/theme";
// 导入页面
import { WelcomeScreen } from "@screens/Auth/WelcomeScreen";
import { GenerateMnemonicScreen } from "@screens/CreateWallet/GenerateMnemonicScreen";
import { BackupMnemonicScreen } from "@screens/CreateWallet/BackupMnemonicScreen";
import { VerifyMnemonicScreen } from "@screens/CreateWallet/VerifyMnemonicScreen";
import { SetPasswordScreen } from "@screens/CreateWallet/SetPasswordScreen";
import { ImportWalletScreen } from "@screens/ImportWallet/ImportWalletScreen";

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
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
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GenerateMnemonic"
        component={GenerateMnemonicScreen}
        options={{ title: "生成助记词" }}
      />
      <Stack.Screen
        name="BackupMnemonic"
        component={BackupMnemonicScreen}
        options={{ title: "备份助记词" }}
      />
      <Stack.Screen
        name="VerifyMnemonic"
        component={VerifyMnemonicScreen}
        options={{ title: "验证助记词" }}
      />
      <Stack.Screen
        name="SetPassword"
        component={SetPasswordScreen}
        options={{ title: "创建钱包" }}
      />
      <Stack.Screen
        name="ImportWallet"
        component={ImportWalletScreen}
        options={{ title: "导入钱包" }}
      />
    </Stack.Navigator>
  );
};
