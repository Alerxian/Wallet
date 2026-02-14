/**
 * 交易相关类型定义
 */

/**
 * 交易类型
 */
export enum TransactionType {
  SEND = 'send',                 // 发送
  RECEIVE = 'receive',           // 接收
  CONTRACT = 'contract',         // 合约交互
  APPROVE = 'approve',           // 授权
}

/**
 * 交易状态
 */
export enum TransactionStatus {
  PENDING = 'pending',           // 待确认
  CONFIRMED = 'confirmed',       // 已确认
  FAILED = 'failed',             // 失败
}

/**
 * 交易参数
 */
export interface TransactionParams {
  from: string;                  // 发送地址
  to: string;                    // 接收地址
  value: string;                 // 金额（Wei）
  data?: string;                 // 交易数据
  gasLimit?: string;             // Gas 限制
  maxFeePerGas?: string;         // 最大 Gas 费用（EIP-1559）
  maxPriorityFeePerGas?: string; // 最大优先费用（EIP-1559）
  nonce?: number;                // Nonce
  chainId?: number;              // 链 ID
}

/**
 * 交易记录
 */
export interface Transaction {
  hash: string;                  // 交易哈希
  from: string;                  // 发送地址
  to: string;                    // 接收地址
  value: string;                 // 金额
  type: TransactionType;         // 交易类型
  status: TransactionStatus;     // 交易状态
  timestamp: number;             // 时间戳
  gasUsed?: string;              // 使用的 Gas
  gasPrice?: string;             // Gas 价格
  blockNumber?: number;          // 区块号
  confirmations?: number;        // 确认数
}

/**
 * Gas 费用估算
 */
export interface GasEstimate {
  gasLimit: string;              // Gas 限制
  maxFeePerGas: string;          // 最大费用
  maxPriorityFeePerGas: string;  // 优先费用
  estimatedFee: string;          // 预估总费用（ETH）
  estimatedFeeUsd?: string;      // 预估总费用（USD）
}
