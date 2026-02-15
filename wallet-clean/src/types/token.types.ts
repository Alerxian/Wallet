/**
 * 代币相关类型定义
 */

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance?: string;
  balanceFormatted?: string;
  price?: number;
  value?: number;
  chainId: number;
  logoURI?: string;
}

export interface TokenBalance {
  token: Token;
  balance: string;
  balanceFormatted: string;
  value: number;
}

export interface NativeToken {
  symbol: string;
  name: string;
  decimals: number;
  balance?: string;
  balanceFormatted?: string;
  price?: number;
  value?: number;
}
