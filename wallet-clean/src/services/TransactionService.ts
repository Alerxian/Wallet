/**
 * 交易服务
 * 负责交易构建、签名、广播和追踪
 */

import { ethers } from 'ethers';
import { ChainId } from '@/types/network.types';
import {
  TransactionParams,
  Transaction,
  TransactionType,
  TransactionStatus,
  GasEstimate,
} from '@/types/transaction.types';
import { RPCService } from './RPCService';
import { WalletService } from './WalletService';
import { StorageService } from './StorageService';

interface TransactionIndexRecord {
  address: string;
  txHash: string;
  chainId: ChainId;
  createdAt: number;
}

export class TransactionService {
  private static getTransactionStorageKey(address: string): string {
    return `transactions_${address}`;
  }

  private static getTxIndexKey(txHash: string, chainId: ChainId): string {
    return `tx_index_${chainId}_${txHash.toLowerCase()}`;
  }

  private static async saveTxIndex(
    txHash: string,
    address: string,
    chainId: ChainId
  ): Promise<void> {
    const indexKey = this.getTxIndexKey(txHash, chainId);
    const record: TransactionIndexRecord = {
      address,
      txHash: txHash.toLowerCase(),
      chainId,
      createdAt: Date.now(),
    };

    await StorageService.setSecure(indexKey, JSON.stringify(record));
  }

  private static async getTxIndex(
    txHash: string,
    chainId: ChainId
  ): Promise<TransactionIndexRecord | null> {
    const indexKey = this.getTxIndexKey(txHash, chainId);
    const indexStr = await StorageService.getSecure(indexKey);
    return indexStr ? JSON.parse(indexStr) : null;
  }

  /**
   * 估算 Gas 费用
   */
  static async estimateGas(
    params: {
      from: string;
      to: string;
      value?: string;
      data?: string;
    },
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<GasEstimate> {
    try {
      // 估算 Gas 限制
      const gasLimit = await RPCService.estimateGas(params, chainId);

      // 获取费用数据
      const feeData = await RPCService.getFeeData(chainId);

      // 计算预估费用（使用 maxFeePerGas）
      const estimatedFee = (
        BigInt(gasLimit) * BigInt(feeData.maxFeePerGas)
      ).toString();

      return {
        gasLimit,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        estimatedFee: ethers.formatEther(estimatedFee),
      };
    } catch (error) {
      throw new Error(`估算 Gas 失败: ${error}`);
    }
  }

  /**
   * 构建交易
   */
  private static async buildTransaction(
    params: TransactionParams,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<ethers.TransactionRequest> {
    try {
      // 获取 nonce
      const nonce =
        params.nonce ?? (await RPCService.getTransactionCount(params.from, chainId));

      // 获取费用数据
      let maxFeePerGas = params.maxFeePerGas;
      let maxPriorityFeePerGas = params.maxPriorityFeePerGas;

      if (!maxFeePerGas || !maxPriorityFeePerGas) {
        const feeData = await RPCService.getFeeData(chainId);
        maxFeePerGas = maxFeePerGas || feeData.maxFeePerGas;
        maxPriorityFeePerGas = maxPriorityFeePerGas || feeData.maxPriorityFeePerGas;
      }

      // 估算 Gas 限制
      let gasLimit = params.gasLimit;
      if (!gasLimit) {
        gasLimit = await RPCService.estimateGas(
          {
            from: params.from,
            to: params.to,
            value: params.value,
            data: params.data,
          },
          chainId
        );
      }

      // 构建交易对象
      const tx: ethers.TransactionRequest = {
        to: params.to,
        value: BigInt(params.value ?? '0'),
        data: params.data || '0x',
        nonce,
        gasLimit: BigInt(gasLimit),
        maxFeePerGas: BigInt(maxFeePerGas || '0'),
        maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas || '0'),
        chainId,
        type: 2, // EIP-1559
      };

      return tx;
    } catch (error) {
      throw new Error(`构建交易失败: ${error}`);
    }
  }

  /**
   * 签名交易
   */
  private static async signTransaction(
    tx: ethers.TransactionRequest,
    walletId: string
  ): Promise<string> {
    try {
      // 获取私钥
      const privateKey = await WalletService.getWalletPrivateKey(walletId);
      const privateKeyHex =
        '0x' + Array.from(privateKey).map((b) => b.toString(16).padStart(2, '0')).join('');
      const signer = new ethers.Wallet(privateKeyHex);

      return await signer.signTransaction(tx);
    } catch (error) {
      throw new Error(`签名交易失败: ${error}`);
    }
  }

  /**
   * 发送交易
   */
  static async sendTransaction(
    params: TransactionParams,
    walletId: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<string> {
    try {
      // 构建交易
      const tx = await this.buildTransaction(params, chainId);

      // 签名交易
      const signedTx = await this.signTransaction(tx, walletId);

      // 广播交易
      const txHash = await RPCService.sendRawTransaction(signedTx, chainId);

      // 保存交易记录
      await this.saveTransaction({
        hash: txHash,
        from: params.from,
        to: params.to,
        value: params.value ?? '0',
        type: params.to === params.from ? TransactionType.RECEIVE : TransactionType.SEND,
        status: TransactionStatus.PENDING,
        timestamp: Date.now(),
        gasPrice: params.maxFeePerGas,
      }, chainId);

      return txHash;
    } catch (error) {
      throw new Error(`发送交易失败: ${error}`);
    }
  }

  /**
   * 发送 ERC-20 代币
   */
  static async sendToken(
    params: {
      from: string;
      to: string;
      tokenAddress: string;
      amount: string;
    },
    walletId: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<string> {
    try {
      // ERC-20 transfer 方法的 ABI 编码
      const iface = new ethers.Interface([
        'function transfer(address to, uint256 amount)',
      ]);
      const data = iface.encodeFunctionData('transfer', [params.to, params.amount]);

      // 发送交易
      return await this.sendTransaction(
        {
          from: params.from,
          to: params.tokenAddress,
          value: '0',
          data,
        },
        walletId,
        chainId
      );
    } catch (error) {
      throw new Error(`发送代币失败: ${error}`);
    }
  }

  /**
   * 等待交易确认
   */
  static async waitForTransaction(
    txHash: string,
    confirmations: number = 1,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<void> {
    try {
      await RPCService.waitForTransaction(txHash, confirmations, chainId);

      // 更新交易状态
      await this.updateTransactionStatus(txHash, TransactionStatus.CONFIRMED, chainId);
    } catch (error) {
      await this.updateTransactionStatus(txHash, TransactionStatus.FAILED, chainId);
      throw new Error(`等待交易确认失败: ${error}`);
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
      return await RPCService.getTransactionReceipt(txHash, chainId);
    } catch (error) {
      throw new Error(`获取交易回执失败: ${error}`);
    }
  }

  /**
   * 保存交易记录
   */
  private static async saveTransaction(
    tx: Transaction,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<void> {
    try {
      const key = this.getTransactionStorageKey(tx.from);
      const txsStr = await StorageService.getSecure(key);
      const txs: Transaction[] = txsStr ? JSON.parse(txsStr) : [];

      txs.unshift(tx);

      // 只保留最近 100 条交易
      if (txs.length > 100) {
        txs.splice(100);
      }

      await StorageService.setSecure(key, JSON.stringify(txs));
      await this.saveTxIndex(tx.hash, tx.from, chainId);
    } catch (error) {
      console.error('保存交易记录失败:', error);
    }
  }

  /**
   * 获取交易记录
   */
  static async getTransactions(address: string): Promise<Transaction[]> {
    try {
      const key = this.getTransactionStorageKey(address);
      const txsStr = await StorageService.getSecure(key);
      return txsStr ? JSON.parse(txsStr) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 更新交易状态
   */
  private static async updateTransactionStatus(
    txHash: string,
    status: TransactionStatus,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<void> {
    try {
      const normalizedHash = txHash.toLowerCase();
      const index = await this.getTxIndex(normalizedHash, chainId);

      if (!index) {
        console.warn(`交易索引不存在: ${txHash} (chainId=${chainId})`);
        return;
      }

      const key = this.getTransactionStorageKey(index.address);
      const txsStr = await StorageService.getSecure(key);
      const txs: Transaction[] = txsStr ? JSON.parse(txsStr) : [];

      const target = txs.find((tx) => tx.hash.toLowerCase() === normalizedHash);
      if (!target) {
        console.warn(`未找到交易记录: ${txHash} (address=${index.address})`);
        return;
      }

      target.status = status;
      await StorageService.setSecure(key, JSON.stringify(txs));
    } catch (error) {
      console.error('更新交易状态失败:', error);
    }
  }

  /**
   * 加速交易（提高 Gas 费）
   */
  static async speedUpTransaction(
    txHash: string,
    walletId: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<string> {
    try {
      // 获取原交易
      const provider = RPCService.getProvider(chainId);
      const originalTx = await provider.getTransaction(txHash);

      if (!originalTx) {
        throw new Error('交易不存在');
      }

      // 提高 Gas 费 10%
      const newMaxFeePerGas = (BigInt(originalTx.maxFeePerGas || 0) * 110n) / 100n;
      const newMaxPriorityFeePerGas =
        (BigInt(originalTx.maxPriorityFeePerGas || 0) * 110n) / 100n;

      // 发送新交易（相同 nonce）
      return await this.sendTransaction(
        {
          from: originalTx.from,
          to: originalTx.to!,
          value: originalTx.value.toString(),
          data: originalTx.data,
          nonce: originalTx.nonce,
          gasLimit: originalTx.gasLimit.toString(),
          maxFeePerGas: newMaxFeePerGas.toString(),
          maxPriorityFeePerGas: newMaxPriorityFeePerGas.toString(),
        },
        walletId,
        chainId
      );
    } catch (error) {
      throw new Error(`加速交易失败: ${error}`);
    }
  }

  /**
   * 取消交易（发送 0 ETH 到自己）
   */
  static async cancelTransaction(
    txHash: string,
    walletId: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<string> {
    try {
      // 获取原交易
      const provider = RPCService.getProvider(chainId);
      const originalTx = await provider.getTransaction(txHash);

      if (!originalTx) {
        throw new Error('交易不存在');
      }

      // 提高 Gas 费 10%
      const newMaxFeePerGas = (BigInt(originalTx.maxFeePerGas || 0) * 110n) / 100n;
      const newMaxPriorityFeePerGas =
        (BigInt(originalTx.maxPriorityFeePerGas || 0) * 110n) / 100n;

      // 发送 0 ETH 到自己（相同 nonce）
      return await this.sendTransaction(
        {
          from: originalTx.from,
          to: originalTx.from,
          value: '0',
          nonce: originalTx.nonce,
          maxFeePerGas: newMaxFeePerGas.toString(),
          maxPriorityFeePerGas: newMaxPriorityFeePerGas.toString(),
        },
        walletId,
        chainId
      );
    } catch (error) {
      throw new Error(`取消交易失败: ${error}`);
    }
  }
}
