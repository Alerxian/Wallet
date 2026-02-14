/**
 * 根导航
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthNavigator } from './AuthNavigator';
import { useWalletStore } from '@store/walletStore';
import { Loading } from '@components/common/Loading';

const Stack = createStackNavigator();

export const RootNavigator: React.FC = () => {
  const { currentWallet } = useWalletStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 暂时跳过加载，直接进入
    setIsReady(true);
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
          <Stack.Screen name="Main" component={MainPlaceholder} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// 临时占位组件
const MainPlaceholder: React.FC = () => {
  const { currentWallet } = useWalletStore();

  return (
    <Loading
      text={`钱包已创建\n地址: ${currentWallet?.address.slice(0, 10)}...`}
    />
  );
};
