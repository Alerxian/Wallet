/**
 * 代币服务
 * 负责代币余额查询和管理
 */

import { ethers } from 'ethers';
import { Token, TokenBalance, NativeToken } from '@/types/token.types';
import { ChainId } from '@/types/network.types';
import { RPCService } from './RPCService';
import { getNetwork } from '@/config/networks';

export class TokenService {
  /**
   * 获取原生代币余额（ETH/BNB/MATIC 等）
   */
  static async getNativeBalance(
    address: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<NativeToken> {
    try {
      const network = getNetwork(chainId);
      const balanceWei = await RPCService.getBalance(address, chainId);
      const balanceFormatted = ethers.formatEther(balanceWei);

      return {
        symbol: network.symbol,
        name: network.name,
        decimals: 18,
        balance: balanceWei,
        balanceFormatted,
      };
    } catch (error) {
      throw new Error(`获取原生代币余额失败: ${error}`);
    }
  }

  /**
   * 获取 ERC-20 代币余额
   */
  static async getTokenBalance(
    address: string,
    token: Token
  ): Promise<TokenBalance> {
    try {
      const balance = await RPCService.getTokenBalance(
        address,
        token.address,
        token.chainId as ChainId
      );

      const balanceFormatted = ethers.formatUnits(balance, token.decimals);

      return {
        token,
        balance,
        balanceFormatted,
        value: 0, // 需要价格 API 才能计算
      };
    } catch (error) {
      throw new Error(`获取代币余额失败: ${error}`);
    }
  }

  /**
   * 批量获取代币余额
   */
  static async getMultipleTokenBalances(
    address: string,
    tokens: Token[]
  ): Promise<TokenBalance[]> {
    try {
      const balances = await Promise.allSettled(
        tokens.map(token => this.getTokenBalance(address, token))
      );

      return balances
        .filter((result): result is PromiseFulfilledResult<TokenBalance> =>
          result.status === 'fulfilled'
        )
        .map(result => result.value);
    } catch (error) {
      throw new Error(`批量获取代币余额失败: ${error}`);
    }
  }

  /**
   * 获取代币信息
   */
  static async getTokenInfo(
    tokenAddress: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<{ symbol: string; name: string; decimals: number }> {
    try {
      return await RPCService.getTokenInfo(tokenAddress, chainId);
    } catch (error) {
      throw new Error(`获取代币信息失败: ${error}`);
    }
  }

  /**
   * 添加自定义代币
   */
  static async addCustomToken(
    tokenAddress: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<Token> {
    try {
      const tokenInfo = await RPCService.getTokenInfo(tokenAddress, chainId);

      return {
        address: tokenAddress,
        symbol: tokenInfo.symbol,
        name: tokenInfo.name,
        decimals: tokenInfo.decimals,
        chainId,
      };
    } catch (error) {
      throw new Error(`添加自定义代币失败: ${error}`);
    }
  }

  /**
   * 格式化代币余额
   */
  static formatBalance(balance: string, decimals: number): string {
    return ethers.formatUnits(balance, decimals);
  }

  /**
   * 解析代币金额（用户输入转为最小单位）
   */
  static parseAmount(amount: string, decimals: number): string {
    try {
      return ethers.parseUnits(amount, decimals).toString();
    } catch (error) {
      throw new Error(`解析金额失败: ${error}`);
    }
  }
}
