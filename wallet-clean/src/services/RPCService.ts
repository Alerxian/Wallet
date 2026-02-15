/**
 * RPC 服务
 * 负责与区块链节点通信
 */

import { ethers } from 'ethers';
import { ChainId } from '@/types/network.types';
import { getNetwork } from '@/config/networks';

export class RPCService {
  private static providers: Map<ChainId, ethers.JsonRpcProvider> = new Map();

  /**
   * 获取 Provider
   */
  static getProvider(chainId: ChainId = ChainId.ETHEREUM): ethers.JsonRpcProvider {
    if (!this.providers.has(chainId)) {
      const network = getNetwork(chainId);
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      this.providers.set(chainId, provider);
    }
    return this.providers.get(chainId)!;
  }

  /**
   * 获取 ETH 余额
   * @param address 钱包地址
   * @param chainId 链 ID
   * @returns 余额（Wei）
   */
  static async getBalance(
    address: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<string> {
    try {
      const provider = this.getProvider(chainId);
      const balance = await provider.getBalance(address);
      return balance.toString();
    } catch (error) {
      throw new Error(`获取余额失败: ${error}`);
    }
  }

  /**
   * 获取 ERC-20 代币余额
   * @param address 钱包地址
   * @param tokenAddress 代币合约地址
   * @param chainId 链 ID
   * @returns 余额（最小单位）
   */
  static async getTokenBalance(
    address: string,
    tokenAddress: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<string> {
    try {
      const provider = this.getProvider(chainId);

      // ERC-20 balanceOf ABI
      const abi = ['function balanceOf(address) view returns (uint256)'];
      const contract = new ethers.Contract(tokenAddress, abi, provider);

      const balance = await contract.balanceOf(address);
      return balance.toString();
    } catch (error) {
      throw new Error(`获取代币余额失败: ${error}`);
    }
  }

  /**
   * 获取代币信息
   * @param tokenAddress 代币合约地址
   * @param chainId 链 ID
   */
  static async getTokenInfo(
    tokenAddress: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<{ name: string; symbol: string; decimals: number }> {
    try {
      const provider = this.getProvider(chainId);

      const abi = [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
      ];
      const contract = new ethers.Contract(tokenAddress, abi, provider);

      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);

      return { name, symbol, decimals: Number(decimals) };
    } catch (error) {
      throw new Error(`获取代币信息失败: ${error}`);
    }
  }

  /**
   * 获取当前 Gas 价格
   */
  static async getGasPrice(chainId: ChainId = ChainId.ETHEREUM): Promise<string> {
    try {
      const provider = this.getProvider(chainId);
      const feeData = await provider.getFeeData();
      return feeData.gasPrice?.toString() || '0';
    } catch (error) {
      throw new Error(`获取 Gas 价格失败: ${error}`);
    }
  }

  /**
   * 获取 EIP-1559 费用数据
   */
  static async getFeeData(chainId: ChainId = ChainId.ETHEREUM) {
    try {
      const provider = this.getProvider(chainId);
      const feeData = await provider.getFeeData();

      return {
        gasPrice: feeData.gasPrice?.toString() || '0',
        maxFeePerGas: feeData.maxFeePerGas?.toString() || '0',
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || '0',
      };
    } catch (error) {
      throw new Error(`获取费用数据失败: ${error}`);
    }
  }

  /**
   * 估算 Gas 限制
   */
  static async estimateGas(
    transaction: {
      from: string;
      to: string;
      value?: string;
      data?: string;
    },
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<string> {
    try {
      const provider = this.getProvider(chainId);
      const gasLimit = await provider.estimateGas(transaction);
      return gasLimit.toString();
    } catch (error) {
      throw new Error(`估算 Gas 失败: ${error}`);
    }
  }

  /**
   * 获取交易数量（nonce）
   */
  static async getTransactionCount(
    address: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<number> {
    try {
      const provider = this.getProvider(chainId);
      return await provider.getTransactionCount(address, 'latest');
    } catch (error) {
      throw new Error(`获取 nonce 失败: ${error}`);
    }
  }

  /**
   * 发送原始交易
   */
  static async sendRawTransaction(
    signedTx: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<string> {
    try {
      const provider = this.getProvider(chainId);
      const tx = await provider.broadcastTransaction(signedTx);
      return tx.hash;
    } catch (error) {
      throw new Error(`发送交易失败: ${error}`);
    }
  }

  /**
   * 获取交易回执
   */
  static async getTransactionReceipt(
    txHash: string,
    chainId: ChainId = ChainId.ETHEREUM
  ) {
    try {
      const provider = this.getProvider(chainId);
      return await provider.getTransactionReceipt(txHash);
    } catch (error) {
      throw new Error(`获取交易回执失败: ${error}`);
    }
  }

  /**
   * 等待交易确认
   */
  static async waitForTransaction(
    txHash: string,
    confirmations: number = 1,
    chainId: ChainId = ChainId.ETHEREUM
  ) {
    try {
      const provider = this.getProvider(chainId);
      return await provider.waitForTransaction(txHash, confirmations);
    } catch (error) {
      throw new Error(`等待交易确认失败: ${error}`);
    }
  }

  /**
   * 获取当前区块号
   */
  static async getBlockNumber(chainId: ChainId = ChainId.ETHEREUM): Promise<number> {
    try {
      const provider = this.getProvider(chainId);
      return await provider.getBlockNumber();
    } catch (error) {
      throw new Error(`获取区块号失败: ${error}`);
    }
  }
}
