/**
 * 常量定义
 */

// 助记词相关
export const MNEMONIC_LENGTHS = [12, 24] as const;
export const DEFAULT_MNEMONIC_LENGTH = 12;

// 密码相关
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 20;

// 存储键名前缀
export const STORAGE_PREFIX = '@wallet:';

// 加密算法
export const ENCRYPTION_ALGORITHM = 'AES-256-GCM';

// 派生路径（BIP44）
export const DERIVATION_PATH = "m/44'/60'/0'/0/0"; // 以太坊默认路径

// 网络请求超时
export const REQUEST_TIMEOUT = 30000; // 30秒

// Gas 相关
export const DEFAULT_GAS_LIMIT = '21000'; // ETH 转账默认 Gas
export const TOKEN_TRANSFER_GAS_LIMIT = '65000'; // Token 转账默认 Gas

// 确认数
export const REQUIRED_CONFIRMATIONS = 12;

// 缓存时间
export const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

// 重试配置
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // 1秒

// 正则表达式
export const REGEX = {
  // 以太坊地址
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  // 私钥
  PRIVATE_KEY: /^0x[a-fA-F0-9]{64}$/,
  // 交易哈希
  TX_HASH: /^0x[a-fA-F0-9]{64}$/,
} as const;
