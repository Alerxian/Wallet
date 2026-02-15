/**
 * 存储相关类型定义
 */

/**
 * 安全存储的键名
 */
export enum SecureStoreKey {
  ENCRYPTED_MNEMONIC = 'encrypted_mnemonic',     // 助记词（系统级加密）
  ENCRYPTED_PRIVATE_KEY = 'encrypted_private_key', // 私钥（系统级加密）
  WALLET_LIST = 'wallet_list',                   // 钱包列表
  CURRENT_WALLET_ID = 'current_wallet_id',       // 当前钱包 ID
  BIOMETRIC_ENABLED = 'biometric_enabled',       // 生物识别是否启用
}

/**
 * 加密数据结构（已废弃，不再使用应用层加密）
 */
export interface EncryptedData {
  ciphertext: string;            // 密文
  iv: string;                    // 初始化向量
  salt: string;                  // 盐值
  algorithm: string;             // 加密算法
}

/**
 * 存储选项（已废弃）
 */
export interface StorageOptions {
  secure?: boolean;              // 是否使用安全存储
  encrypt?: boolean;             // 是否加密
}
