/**
 * DeFi 服务
 * 集成主流 DeFi 协议（Uniswap、Aave、Compound）
 */

import { ethers } from 'ethers';
import { ChainId } from '@/types/network.types';

// Uniswap V3 Router 地址
const UNISWAP_V3_ROUTER: Record<number, string> = {
  1: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Ethereum
  137: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Polygon
  42161: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Arbitrum
  10: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Optimism
};

// Aave V3 Pool 地址
const AAVE_V3_POOL: Record<number, string> = {
  1: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', // Ethereum
  137: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // Polygon
  42161: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // Arbitrum
  10: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // Optimism
};

export interface LiquidityPosition {
  protocol: 'Uniswap' | 'SushiSwap' | 'PancakeSwap';
  poolAddress: string;
  token0: string;
  token1: string;
  liquidity: string;
  token0Amount: string;
  token1Amount: string;
  uncollectedFees0: string;
  uncollectedFees1: string;
}

export interface LendingPosition {
  protocol: 'Aave' | 'Compound';
  asset: string;
  supplied: string;
  borrowed: string;
  supplyAPY: number;
  borrowAPY: number;
  healthFactor?: number;
}

export interface DeFiProtocol {
  name: string;
  type: 'DEX' | 'Lending' | 'Yield';
  tvl: string;
  apy: number;
  url: string;
}

export class DeFiService {
  /**
   * 获取流动性挖矿仓位
   */
  static async getLiquidityPositions(
    address: string,
    chainId: ChainId
  ): Promise<LiquidityPosition[]> {
    try {
      // TODO: 实现流动性仓位查询
      // 需要集成 Uniswap V3 Subgraph 或使用 Alchemy/Moralis API
      console.log('获取流动性仓位:', address, chainId);
      return [];
    } catch (error) {
      throw new Error(`获取流动性仓位失败: ${error}`);
    }
  }

  /**
   * 获取借贷仓位
   */
  static async getLendingPositions(
    address: string,
    chainId: ChainId
  ): Promise<LendingPosition[]> {
    try {
      // TODO: 实现借贷仓位查询
      // 需要集成 Aave/Compound API
      console.log('获取借贷仓位:', address, chainId);
      return [];
    } catch (error) {
      throw new Error(`获取借贷仓位失败: ${error}`);
    }
  }

  /**
   * 获取支持的 DeFi 协议列表
   */
  static async getSupportedProtocols(chainId: ChainId): Promise<DeFiProtocol[]> {
    const protocols: DeFiProtocol[] = [];

    // Uniswap
    if (UNISWAP_V3_ROUTER[chainId]) {
      protocols.push({
        name: 'Uniswap V3',
        type: 'DEX',
        tvl: '0',
        apy: 0,
        url: 'https://app.uniswap.org',
      });
    }

    // Aave
    if (AAVE_V3_POOL[chainId]) {
      protocols.push({
        name: 'Aave V3',
        type: 'Lending',
        tvl: '0',
        apy: 0,
        url: 'https://app.aave.com',
      });
    }

    return protocols;
  }

  /**
   * 添加流动性（Uniswap V3）
   */
  static async addLiquidity(
    token0: string,
    token1: string,
    amount0: string,
    amount1: string,
    fee: number, // 500, 3000, 10000
    chainId: ChainId
  ): Promise<{ to: string; data: string; value: string }> {
    try {
      const routerAddress = UNISWAP_V3_ROUTER[chainId];
      if (!routerAddress) {
        throw new Error('不支持的网络');
      }

      // TODO: 实现添加流动性交易构建
      // 需要使用 Uniswap V3 SDK
      throw new Error('添加流动性功能待实现');
    } catch (error) {
      throw new Error(`添加流动性失败: ${error}`);
    }
  }

  /**
   * 移除流动性（Uniswap V3）
   */
  static async removeLiquidity(
    tokenId: string,
    liquidity: string,
    chainId: ChainId
  ): Promise<{ to: string; data: string; value: string }> {
    try {
      const routerAddress = UNISWAP_V3_ROUTER[chainId];
      if (!routerAddress) {
        throw new Error('不支持的网络');
      }

      // TODO: 实现移除流动性交易构建
      throw new Error('移除流动性功能待实现');
    } catch (error) {
      throw new Error(`移除流动性失败: ${error}`);
    }
  }

  /**
   * 存款（Aave）
   */
  static async supply(
    asset: string,
    amount: string,
    onBehalfOf: string,
    chainId: ChainId
  ): Promise<{ to: string; data: string; value: string }> {
    try {
      const poolAddress = AAVE_V3_POOL[chainId];
      if (!poolAddress) {
        throw new Error('不支持的网络');
      }

      // Aave V3 Pool ABI
      const POOL_ABI = [
        'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
      ];

      const iface = new ethers.Interface(POOL_ABI);
      const data = iface.encodeFunctionData('supply', [
        asset,
        amount,
        onBehalfOf,
        0, // referralCode
      ]);

      return {
        to: poolAddress,
        data,
        value: '0',
      };
    } catch (error) {
      throw new Error(`构建存款交易失败: ${error}`);
    }
  }

  /**
   * 取款（Aave）
   */
  static async withdraw(
    asset: string,
    amount: string,
    to: string,
    chainId: ChainId
  ): Promise<{ to: string; data: string; value: string }> {
    try {
      const poolAddress = AAVE_V3_POOL[chainId];
      if (!poolAddress) {
        throw new Error('不支持的网络');
      }

      // Aave V3 Pool ABI
      const POOL_ABI = [
        'function withdraw(address asset, uint256 amount, address to)',
      ];

      const iface = new ethers.Interface(POOL_ABI);
      const data = iface.encodeFunctionData('withdraw', [asset, amount, to]);

      return {
        to: poolAddress,
        data,
        value: '0',
      };
    } catch (error) {
      throw new Error(`构建取款交易失败: ${error}`);
    }
  }

  /**
   * 借款（Aave）
   */
  static async borrow(
    asset: string,
    amount: string,
    interestRateMode: number, // 1 = Stable, 2 = Variable
    onBehalfOf: string,
    chainId: ChainId
  ): Promise<{ to: string; data: string; value: string }> {
    try {
      const poolAddress = AAVE_V3_POOL[chainId];
      if (!poolAddress) {
        throw new Error('不支持的网络');
      }

      // Aave V3 Pool ABI
      const POOL_ABI = [
        'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)',
      ];

      const iface = new ethers.Interface(POOL_ABI);
      const data = iface.encodeFunctionData('borrow', [
        asset,
        amount,
        interestRateMode,
        0, // referralCode
        onBehalfOf,
      ]);

      return {
        to: poolAddress,
        data,
        value: '0',
      };
    } catch (error) {
      throw new Error(`构建借款交易失败: ${error}`);
    }
  }

  /**
   * 还款（Aave）
   */
  static async repay(
    asset: string,
    amount: string,
    interestRateMode: number,
    onBehalfOf: string,
    chainId: ChainId
  ): Promise<{ to: string; data: string; value: string }> {
    try {
      const poolAddress = AAVE_V3_POOL[chainId];
      if (!poolAddress) {
        throw new Error('不支持的网络');
      }

      // Aave V3 Pool ABI
      const POOL_ABI = [
        'function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf)',
      ];

      const iface = new ethers.Interface(POOL_ABI);
      const data = iface.encodeFunctionData('repay', [
        asset,
        amount,
        interestRateMode,
        onBehalfOf,
      ]);

      return {
        to: poolAddress,
        data,
        value: '0',
      };
    } catch (error) {
      throw new Error(`构建还款交易失败: ${error}`);
    }
  }

  /**
   * 计算健康因子
   */
  static calculateHealthFactor(
    totalCollateral: number,
    totalDebt: number,
    liquidationThreshold: number
  ): number {
    if (totalDebt === 0) return Infinity;
    return (totalCollateral * liquidationThreshold) / totalDebt;
  }

  /**
   * 格式化 APY
   */
  static formatAPY(apy: number): string {
    return `${apy.toFixed(2)}%`;
  }

  /**
   * 格式化 TVL
   */
  static formatTVL(tvl: string): string {
    const value = parseFloat(tvl);
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  }
}
