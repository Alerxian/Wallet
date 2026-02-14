/**
 * 导航相关类型定义
 */

import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

/**
 * 认证流程导航参数
 */
export type AuthStackParamList = {
  Welcome: undefined;
  CreateWallet: undefined;
  GenerateMnemonic: { mnemonicLength: 12 | 24 };
  BackupMnemonic: { mnemonic: string };
  VerifyMnemonic: { mnemonic: string };
  SetPassword: { mnemonic: string };
  ImportWallet: undefined;
  ImportMnemonic: undefined;
};

/**
 * 主应用导航参数
 */
export type MainStackParamList = {
  Home: undefined;
  Send: { token?: string };
  Receive: undefined;
  TransactionHistory: undefined;
  Settings: undefined;
  Security: undefined;
  About: undefined;
};

/**
 * 根导航参数
 */
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Unlock: undefined;
};

/**
 * 导航 Props 类型辅助
 */
export type AuthScreenNavigationProp<T extends keyof AuthStackParamList> = StackNavigationProp<
  AuthStackParamList,
  T
>;

export type AuthScreenRouteProp<T extends keyof AuthStackParamList> = RouteProp<
  AuthStackParamList,
  T
>;

export type MainScreenNavigationProp<T extends keyof MainStackParamList> = StackNavigationProp<
  MainStackParamList,
  T
>;

export type MainScreenRouteProp<T extends keyof MainStackParamList> = RouteProp<
  MainStackParamList,
  T
>;
