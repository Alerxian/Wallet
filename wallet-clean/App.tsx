/**
 * 应用入口
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';

// 导入 polyfills（ethers.js 需要）
import 'react-native-get-random-values';

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}
