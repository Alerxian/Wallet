/**
 * 格式化工具函数
 */

import { ethers } from 'ethers';

/**
 * 格式化地址（显示前6位和后4位）
 * @example 0x1234...5678
 */
export const formatAddress = (address: string, startLength = 6, endLength = 4): string => {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

/**
 * 格式化余额
 * @param balance Wei 单位的余额
 * @param decimals 小数位数
 * @param maxDecimals 最多显示的小数位
 */
export const formatBalance = (
  balance: string,
  decimals: number = 18,
  maxDecimals: number = 4
): string => {
  try {
    const formatted = ethers.formatUnits(balance, decimals);
    const num = parseFloat(formatted);

    // 如果是整数，不显示小数
    if (num % 1 === 0) {
      return num.toLocaleString();
    }

    // 保留指定小数位
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
    });
  } catch (error) {
    return '0';
  }
};

/**
 * 格式化 USD 价格
 */
export const formatUSD = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * 格式化时间戳
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 1分钟内
  if (diff < 60 * 1000) {
    return '刚刚';
  }

  // 1小时内
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes} 分钟前`;
  }

  // 1天内
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} 小时前`;
  }

  // 7天内
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days} 天前`;
  }

  // 超过7天，显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * 格式化交易哈希
 */
export const formatTxHash = (hash: string): string => {
  return formatAddress(hash, 10, 8);
};

/**
 * 格式化 Gas 费用
 */
export const formatGas = (gasUsed: string, gasPrice: string): string => {
  try {
    const gas = ethers.getBigInt(gasUsed);
    const price = ethers.getBigInt(gasPrice);
    const total = gas * price;

    return formatBalance(total.toString(), 18, 6);
  } catch (error) {
    return '0';
  }
};

/**
 * 格式化百分比
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * 格式化大数字（K, M, B）
 */
export const formatLargeNumber = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(2);
};
