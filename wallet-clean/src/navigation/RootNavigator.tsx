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

const Stack = createStackNavigator();

export const RootNavigator: React.FC = () => {
  const { currentWallet, loadWallets } = useWalletStore();
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

  return (
    <NavigationContainer>
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
