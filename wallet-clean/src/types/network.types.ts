/**
 * 网络相关类型定义
 */

export interface Network {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet?: boolean;
}

export interface NetworkConfig {
  [key: string]: Network;
}

export enum ChainId {
  ETHEREUM = 1,
  GOERLI = 5,
  BSC = 56,
  POLYGON = 137,
  ARBITRUM = 42161,
  OPTIMISM = 10,
  AVALANCHE = 43114,
}
