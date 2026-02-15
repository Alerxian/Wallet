/**
 * 交易服务
 * 负责交易构建、签名、广播和追踪
 */

import { ethers } from 'ethers';
import * as secp from '@noble/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { ChainId } from '@/types/network.types';
import {
  TransactionParams,
  Transaction,
  TransactionStatus,
  GasEstimate,
} from '@/types/transaction.types';
import { RPCService } from './RPCService';
import { WalletService } from './WalletService';
import { StorageService } from './StorageService';

export class TransactionService {
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
    walletId: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<ethers.Transaction> {
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
      const tx = ethers.Transaction.from({
        to: params.to,
        value: params.value,
        data: params.data || '0x',
        nonce,
        gasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas,
        chainId,
        type: 2, // EIP-1559
      });

      return tx;
    } catch (error) {
      throw new Error(`构建交易失败: ${error}`);
    }
  }

  /**
   * 签名交易
   */
  private static async signTransaction(
    tx: ethers.Transaction,
    walletId: string
  ): Promise<string> {
    try {
      // 获取私钥
      const privateKey = await WalletService.getWalletPrivateKey(walletId);

      // 获取交易的签名哈希
      const txHash = keccak_256(tx.unsignedSerialized);

      // 使用 secp256k1 签名
      const signature = await secp.signAsync(txHash, privateKey);

      // 计算 v 值
      const v = signature.recovery! + 27 + (tx.chainId * 2 + 8);

      // 设置签名
      tx.signature = ethers.Signature.from({
        r: '0x' + Buffer.from(signature.r).toString('hex'),
        s: '0x' + Buffer.from(signature.s).toString('hex'),
        v,
      });

      // 返回签名后的交易
      return tx.serialized;
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
      const tx = await this.buildTransaction(params, walletId, chainId);

      // 签名交易
      const signedTx = await this.signTransaction(tx, walletId);

      // 广播交易
      const txHash = await RPCService.sendRawTransaction(signedTx, chainId);

      // 保存交易记录
      await this.saveTransaction({
        hash: txHash,
        from: params.from,
        to: params.to,
        value: params.value,
        type: params.to === params.from ? 'receive' : 'send',
        status: TransactionStatus.PENDING,
        timestamp: Date.now(),
        gasPrice: params.maxFeePerGas,
        gasLimit: params.gasLimit,
      } as any);

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
      await this.updateTransactionStatus(txHash, TransactionStatus.CONFIRMED);
    } catch (error) {
      await this.updateTransactionStatus(txHash, TransactionStatus.FAILED);
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
  private static async saveTransaction(tx: Transaction): Promise<void> {
    try {
      const key = `transactions_${tx.from}`;
      const txsStr = await StorageService.getSecure(key);
      const txs: Transaction[] = txsStr ? JSON.parse(txsStr) : [];

      txs.unshift(tx);

      // 只保留最近 100 条交易
      if (txs.length > 100) {
        txs.splice(100);
      }

      await StorageService.setSecure(key, JSON.stringify(txs));
    } catch (error) {
      console.error('保存交易记录失败:', error);
    }
  }

  /**
   * 获取交易记录
   */
  static async getTransactions(address: string): Promise<Transaction[]> {
    try {
      const key = `transactions_${address}`;
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
    status: TransactionStatus
  ): Promise<void> {
    try {
      // 这里需要遍历所有地址的交易记录来更新
      // 简化实现，实际应该有更好的索引方式
      console.log(`更新交易状态: ${txHash} -> ${status}`);
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
