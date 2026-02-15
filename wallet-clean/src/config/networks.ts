/**
 * 网络配置
 * 支持的区块链网络配置
 */

import { Network, ChainId } from "@/types/network.types";

// 注意：这里使用公共 RPC，生产环境应该使用 Infura/Alchemy API Key
export const NETWORKS: Record<ChainId, Network> = {
  [ChainId.ETHEREUM]: {
    chainId: 1,
    name: "Ethereum",
    symbol: "ETH",
    rpcUrl: "https://eth.llamarpc.com",
    explorerUrl: "https://etherscan.io",
    isTestnet: false,
  },
  [ChainId.BSC]: {
    chainId: 56,
    name: "BNB Smart Chain",
    symbol: "BNB",
    rpcUrl: "https://bsc-dataseed.binance.org",
    explorerUrl: "https://bscscan.com",
    isTestnet: false,
  },
  [ChainId.POLYGON]: {
    chainId: 137,
    name: "Polygon",
    symbol: "MATIC",
    rpcUrl: "https://polygon-rpc.com",
    explorerUrl: "https://polygonscan.com",
    isTestnet: false,
  },
  [ChainId.ARBITRUM]: {
    chainId: 42161,
    name: "Arbitrum One",
    symbol: "ETH",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    isTestnet: false,
  },
  [ChainId.OPTIMISM]: {
    chainId: 10,
    name: "Optimism",
    symbol: "ETH",
    rpcUrl: "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
    isTestnet: false,
  },
  [ChainId.AVALANCHE]: {
    chainId: 43114,
    name: "Avalanche C-Chain",
    symbol: "AVAX",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    explorerUrl: "https://snowtrace.io",
    isTestnet: false,
  },
  [ChainId.SEPOLIA]: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    symbol: "ETH",
    rpcUrl: "https://sepolia.infura.io/v3/8ad574d069e94f5c939023a830e6335f",
    explorerUrl: "https://sepolia.etherscan.io",
    isTestnet: true,
  },
};

// 默认网络
export const DEFAULT_NETWORK = NETWORKS[ChainId.ETHEREUM];

// 获取网络配置
export const getNetwork = (chainId: ChainId): Network => {
  return NETWORKS[chainId] || DEFAULT_NETWORK;
};

// 获取所有网络
export const getAllNetworks = (): Network[] => {
  return Object.values(NETWORKS);
};

// 获取主网网络
export const getMainnetNetworks = (): Network[] => {
  return Object.values(NETWORKS).filter((n) => !n.isTestnet);
};

// 获取测试网络
export const getTestnetNetworks = (): Network[] => {
  return Object.values(NETWORKS).filter((n) => n.isTestnet);
};
