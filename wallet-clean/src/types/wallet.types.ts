/**
 * 钱包相关类型定义
 */

/**
 * 钱包类型
 */
export interface Wallet {
  id: string;                    // 钱包唯一标识
  name: string;                  // 钱包名称
  address: string;               // 钱包地址
  type: WalletType;              // 钱包类型
  createdAt: number;             // 创建时间戳
  updatedAt: number;             // 更新时间戳
}

/**
 * 钱包类型枚举
 */
export enum WalletType {
  MNEMONIC = 'mnemonic',         // 助记词钱包
  PRIVATE_KEY = 'private_key',   // 私钥钱包
  WATCH_ONLY = 'watch_only',     // 观察钱包
}

/**
 * 助记词长度
 */
export enum MnemonicLength {
  TWELVE = 12,
  TWENTY_FOUR = 24,
}

/**
 * 助记词单词
 */
export interface MnemonicWord {
  index: number;                 // 原始索引（0-11 或 0-23）
  word: string;                  // 单词内容
  selected: boolean;             // 是否已选中（用于验证）
}

/**
 * 钱包创建参数
 */
export interface CreateWalletParams {
  name: string;                  // 钱包名称
  password: string;              // 加密密码
  mnemonic: string;              // 助记词
  mnemonicLength?: MnemonicLength; // 助记词长度
}

/**
 * 钱包导入参数
 */
export interface ImportWalletParams {
  name: string;                  // 钱包名称
  password: string;              // 加密密码
  mnemonic?: string;             // 助记词（可选）
  privateKey?: string;           // 私钥（可选）
}

/**
 * 钱包解锁参数
 */
export interface UnlockWalletParams {
  walletId: string;              // 钱包 ID
  password: string;              // 密码
}

/**
 * 钱包余额
 */
export interface WalletBalance {
  address: string;               // 钱包地址
  balance: string;               // 余额（Wei）
  balanceFormatted: string;      // 格式化余额（ETH）
  usdValue?: string;             // USD 价值
}

/**
 * Token 信息
 */
export interface Token {
  address: string;               // Token 合约地址
  symbol: string;                // Token 符号
  name: string;                  // Token 名称
  decimals: number;              // 小数位数
  balance: string;               // 余额
  balanceFormatted: string;      // 格式化余额
  usdValue?: string;             // USD 价值
  logoUrl?: string;              // Logo URL
}

/**
 * 链信息
 */
export interface Chain {
  id: number;                    // 链 ID
  name: string;                  // 链名称
  symbol: string;                // 原生代币符号
  rpcUrl: string;                // RPC 节点地址
  explorerUrl: string;           // 区块浏览器地址
  logoUrl?: string;              // Logo URL
}

/**
 * 常用链配置
 */
export const CHAINS: Record<string, Chain> = {
  ETH: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
  },
  BSC: {
    id: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
  },
  POLYGON: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
  },
};
