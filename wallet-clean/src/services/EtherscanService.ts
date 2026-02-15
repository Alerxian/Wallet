/**
 * Etherscan API 服务
 * 用于查询交易历史和合约信息
 */

import axios from 'axios';
import { ChainId } from '@/types/network.types';
import { Transaction, TransactionStatus, TransactionType } from '@/types/transaction.types';

// Etherscan API 端点
const ETHERSCAN_ENDPOINTS: Record<ChainId, string> = {
  [ChainId.ETHEREUM]: 'https://api.etherscan.io/api',
  [ChainId.SEPOLIA]: 'https://api-sepolia.etherscan.io/api',
  [ChainId.BSC]: 'https://api.bscscan.com/api',
  [ChainId.POLYGON]: 'https://api.polygonscan.com/api',
  [ChainId.ARBITRUM]: 'https://api.arbiscan.io/api',
  [ChainId.OPTIMISM]: 'https://api-optimistic.etherscan.io/api',
  [ChainId.AVALANCHE]: 'https://api.snowtrace.io/api',
};

// 注意：这里使用免费的 API Key，生产环境应该使用自己的 Key
const API_KEY = 'YourApiKeyToken';

export class EtherscanService {
  /**
   * 获取普通交易列表
   */
  static async getTransactions(
    address: string,
    chainId: ChainId = ChainId.ETHEREUM,
    page: number = 1,
    offset: number = 20
  ): Promise<Transaction[]> {
    try {
      const endpoint = ETHERSCAN_ENDPOINTS[chainId];
      const response = await axios.get(endpoint, {
        params: {
          module: 'account',
          action: 'txlist',
          address,
          startblock: 0,
          endblock: 99999999,
          page,
          offset,
          sort: 'desc',
          apikey: API_KEY,
        },
      });

      if (response.data.status !== '1') {
        throw new Error(response.data.message || '获取交易失败');
      }

      return response.data.result.map((tx: any) => this.parseTransaction(tx, address));
    } catch (error: any) {
      console.error('获取交易列表失败:', error);
      // 如果 API 失败，返回空数组而不是抛出错误
      return [];
    }
  }

  /**
   * 获取 ERC-20 代币交易列表
   */
  static async getTokenTransactions(
    address: string,
    chainId: ChainId = ChainId.ETHEREUM,
    contractAddress?: string,
    page: number = 1,
    offset: number = 20
  ): Promise<Transaction[]> {
    try {
      const endpoint = ETHERSCAN_ENDPOINTS[chainId];
      const params: any = {
        module: 'account',
        action: 'tokentx',
        address,
        startblock: 0,
        endblock: 99999999,
        page,
        offset,
        sort: 'desc',
        apikey: API_KEY,
      };

      if (contractAddress) {
        params.contractaddress = contractAddress;
      }

      const response = await axios.get(endpoint, { params });

      if (response.data.status !== '1') {
        throw new Error(response.data.message || '获取代币交易失败');
      }

      return response.data.result.map((tx: any) =>
        this.parseTokenTransaction(tx, address)
      );
    } catch (error: any) {
      console.error('获取代币交易列表失败:', error);
      return [];
    }
  }

  /**
   * 获取所有交易（普通 + 代币）
   */
  static async getAllTransactions(
    address: string,
    chainId: ChainId = ChainId.ETHEREUM,
    page: number = 1,
    offset: number = 20
  ): Promise<Transaction[]> {
    try {
      const [normalTxs, tokenTxs] = await Promise.all([
        this.getTransactions(address, chainId, page, offset),
        this.getTokenTransactions(address, chainId, undefined, page, offset),
      ]);

      // 合并并按时间排序
      const allTxs = [...normalTxs, ...tokenTxs];
      allTxs.sort((a, b) => b.timestamp - a.timestamp);

      return allTxs;
    } catch (error) {
      console.error('获取所有交易失败:', error);
      return [];
    }
  }

  /**
   * 解析普通交易
   */
  private static parseTransaction(tx: any, userAddress: string): Transaction {
    const isReceive = tx.to.toLowerCase() === userAddress.toLowerCase();

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      type: isReceive ? TransactionType.RECEIVE : TransactionType.SEND,
      status:
        tx.isError === '0'
          ? TransactionStatus.CONFIRMED
          : TransactionStatus.FAILED,
      timestamp: parseInt(tx.timeStamp) * 1000,
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      blockNumber: parseInt(tx.blockNumber),
      confirmations: parseInt(tx.confirmations),
    };
  }

  /**
   * 解析代币交易
   */
  private static parseTokenTransaction(tx: any, userAddress: string): Transaction {
    const isReceive = tx.to.toLowerCase() === userAddress.toLowerCase();

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      type: isReceive ? TransactionType.RECEIVE : TransactionType.SEND,
      status: TransactionStatus.CONFIRMED,
      timestamp: parseInt(tx.timeStamp) * 1000,
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      blockNumber: parseInt(tx.blockNumber),
      confirmations: parseInt(tx.confirmations),
    };
  }

  /**
   * 获取合约 ABI
   */
  static async getContractABI(
    contractAddress: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<any> {
    try {
      const endpoint = ETHERSCAN_ENDPOINTS[chainId];
      const response = await axios.get(endpoint, {
        params: {
          module: 'contract',
          action: 'getabi',
          address: contractAddress,
          apikey: API_KEY,
        },
      });

      if (response.data.status !== '1') {
        throw new Error(response.data.message || '获取 ABI 失败');
      }

      return JSON.parse(response.data.result);
    } catch (error) {
      throw new Error(`获取合约 ABI 失败: ${error}`);
    }
  }

  /**
   * 获取合约源代码
   */
  static async getContractSource(
    contractAddress: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<any> {
    try {
      const endpoint = ETHERSCAN_ENDPOINTS[chainId];
      const response = await axios.get(endpoint, {
        params: {
          module: 'contract',
          action: 'getsourcecode',
          address: contractAddress,
          apikey: API_KEY,
        },
      });

      if (response.data.status !== '1') {
        throw new Error(response.data.message || '获取源代码失败');
      }

      return response.data.result[0];
    } catch (error) {
      throw new Error(`获取合约源代码失败: ${error}`);
    }
  }

  /**
   * 获取账户余额（历史）
   */
  static async getBalanceHistory(
    address: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<string> {
    try {
      const endpoint = ETHERSCAN_ENDPOINTS[chainId];
      const response = await axios.get(endpoint, {
        params: {
          module: 'account',
          action: 'balance',
          address,
          tag: 'latest',
          apikey: API_KEY,
        },
      });

      if (response.data.status !== '1') {
        throw new Error(response.data.message || '获取余额失败');
      }

      return response.data.result;
    } catch (error) {
      throw new Error(`获取余额失败: ${error}`);
    }
  }
}
