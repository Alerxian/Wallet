/**
 * 代币兑换服务
 * 集成 1inch API 实现代币兑换功能
 */

import { ethers } from 'ethers';
import { ChainId } from '@/types/network.types';
import { Token } from '@/types/token.types';

// 1inch API 基础 URL
const ONEINCH_API_BASE = 'https://api.1inch.dev/swap/v6.0';

// 1inch 支持的链 ID 映射
const CHAIN_ID_MAP: Record<ChainId, number> = {
  [ChainId.ETHEREUM]: 1,
  [ChainId.BSC]: 56,
  [ChainId.POLYGON]: 137,
  [ChainId.ARBITRUM]: 42161,
  [ChainId.OPTIMISM]: 10,
  [ChainId.AVALANCHE]: 43114,
  [ChainId.GOERLI]: 5,
};

export interface SwapQuote {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  estimatedGas: string;
  protocols: string[][];
  tx?: {
    from: string;
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
  };
}

export interface SwapParams {
  fromToken: Token;
  toToken: Token;
  amount: string;
  fromAddress: string;
  slippage: number; // 0.1 = 0.1%
}

export class SwapService {
  private static apiKey: string = ''; // 需要配置 1inch API Key

  /**
   * 设置 1inch API Key
   */
  static setApiKey(key: string) {
    this.apiKey = key;
  }

  /**
   * 获取代币兑换报价
   */
  static async getQuote(params: SwapParams): Promise<SwapQuote> {
    try {
      const { fromToken, toToken, amount, fromAddress, slippage } = params;
      const chainId = CHAIN_ID_MAP[fromToken.chainId as ChainId];

      if (!chainId) {
        throw new Error('不支持的网络');
      }

      // 将金额转换为最小单位
      const fromAmount = ethers.parseUnits(amount, fromToken.decimals).toString();

      // 构建请求 URL
      const url = `${ONEINCH_API_BASE}/${chainId}/quote`;
      const queryParams = new URLSearchParams({
        src: fromToken.address,
        dst: toToken.address,
        amount: fromAmount,
      });

      const response = await fetch(`${url}?${queryParams}`, {
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      });

      if (!response.ok) {
        throw new Error(`获取报价失败: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        fromToken,
        toToken,
        fromAmount,
        toAmount: data.toAmount,
        estimatedGas: data.estimatedGas || '0',
        protocols: data.protocols || [],
      };
    } catch (error) {
      throw new Error(`获取兑换报价失败: ${error}`);
    }
  }

  /**
   * 获取兑换交易数据
   */
  static async getSwapTransaction(params: SwapParams): Promise<SwapQuote> {
    try {
      const { fromToken, toToken, amount, fromAddress, slippage } = params;
      const chainId = CHAIN_ID_MAP[fromToken.chainId as ChainId];

      if (!chainId) {
        throw new Error('不支持的网络');
      }

      // 将金额转换为最小单位
      const fromAmount = ethers.parseUnits(amount, fromToken.decimals).toString();

      // 构建请求 URL
      const url = `${ONEINCH_API_BASE}/${chainId}/swap`;
      const queryParams = new URLSearchParams({
        src: fromToken.address,
        dst: toToken.address,
        amount: fromAmount,
        from: fromAddress,
        slippage: slippage.toString(),
        disableEstimate: 'true',
      });

      const response = await fetch(`${url}?${queryParams}`, {
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      });

      if (!response.ok) {
        throw new Error(`获取交易数据失败: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        fromToken,
        toToken,
        fromAmount,
        toAmount: data.toAmount,
        estimatedGas: data.tx.gas || '0',
        protocols: data.protocols || [],
        tx: {
          from: data.tx.from,
          to: data.tx.to,
          data: data.tx.data,
          value: data.tx.value,
          gas: data.tx.gas,
          gasPrice: data.tx.gasPrice,
        },
      };
    } catch (error) {
      throw new Error(`获取兑换交易失败: ${error}`);
    }
  }

  /**
   * 执行代币兑换
   */
  static async executeSwap(
    quote: SwapQuote,
    privateKey: string
  ): Promise<string> {
    try {
      if (!quote.tx) {
        throw new Error('缺少交易数据');
      }

      // 创建钱包实例
      const wallet = new ethers.Wallet(privateKey);

      // 发送交易
      const tx = await wallet.sendTransaction({
        to: quote.tx.to,
        data: quote.tx.data,
        value: quote.tx.value,
        gasLimit: quote.tx.gas,
        gasPrice: quote.tx.gasPrice,
      });

      return tx.hash;
    } catch (error) {
      throw new Error(`执行兑换失败: ${error}`);
    }
  }

  /**
   * 格式化兑换金额
   */
  static formatSwapAmount(amount: string, decimals: number): string {
    return ethers.formatUnits(amount, decimals);
  }

  /**
   * 计算价格影响
   */
  static calculatePriceImpact(
    fromAmount: string,
    toAmount: string,
    fromPrice: number,
    toPrice: number,
    fromDecimals: number,
    toDecimals: number
  ): number {
    try {
      const fromValue = parseFloat(ethers.formatUnits(fromAmount, fromDecimals)) * fromPrice;
      const toValue = parseFloat(ethers.formatUnits(toAmount, toDecimals)) * toPrice;

      if (fromValue === 0) return 0;

      return ((toValue - fromValue) / fromValue) * 100;
    } catch (error) {
      console.error('计算价格影响失败:', error);
      return 0;
    }
  }

  /**
   * 计算最小接收数量（考虑滑点）
   */
  static calculateMinReceived(
    toAmount: string,
    slippage: number,
    decimals: number
  ): string {
    try {
      const amount = ethers.parseUnits(
        ethers.formatUnits(toAmount, decimals),
        decimals
      );
      const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
      const minAmount = (amount * slippageMultiplier) / BigInt(10000);

      return minAmount.toString();
    } catch (error) {
      console.error('计算最小接收数量失败:', error);
      return toAmount;
    }
  }
}
