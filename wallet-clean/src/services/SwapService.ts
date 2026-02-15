/**
 * 代币兑换服务
 * 链上直连 V2 Router（Uniswap/Pancake/QuickSwap）
 */

import { ethers } from 'ethers';
import { ChainId } from '@/types/network.types';
import { Token } from '@/types/token.types';
import { RPCService } from './RPCService';
import { TransactionService } from './TransactionService';

const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const DEFAULT_DEADLINE_SECONDS = 20 * 60;

const ROUTER_CONFIG: Partial<
  Record<
    ChainId,
    {
      router: string;
      wrappedNative: string;
      name: string;
    }
  >
> = {
  [ChainId.ETHEREUM]: {
    router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    wrappedNative: '0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2',
    name: 'Uniswap V2',
  },
  [ChainId.BSC]: {
    router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    wrappedNative: '0xBB4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    name: 'PancakeSwap V2',
  },
  [ChainId.POLYGON]: {
    router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    wrappedNative: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    name: 'QuickSwap V2',
  },
};

const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
];

const ERC20_ABI = [
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
];

export interface SwapQuote {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  minToAmount: string;
  estimatedGas: string;
  path: string[];
  router: string;
  dexName: string;
}

export interface SwapParams {
  fromToken: Token;
  toToken: Token;
  amount: string;
  fromAddress: string;
  slippage: number;
}

export class SwapService {
  private static getConfig(chainId: ChainId) {
    const cfg = ROUTER_CONFIG[chainId];
    if (!cfg) {
      throw new Error('当前网络暂不支持链上兑换');
    }
    return cfg;
  }

  static isNativeToken(token: Token): boolean {
    return token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();
  }

  static getNativeTokenAddress(): string {
    return NATIVE_TOKEN_ADDRESS;
  }

  static isSupportedChain(chainId: ChainId): boolean {
    return !!ROUTER_CONFIG[chainId];
  }

  static getDexName(chainId: ChainId): string {
    return this.getConfig(chainId).name;
  }

  static getSpender(chainId: ChainId): string {
    return this.getConfig(chainId).router;
  }

  private static async getRouterContract(chainId: ChainId): Promise<ethers.Contract> {
    const { router } = this.getConfig(chainId);
    const provider = RPCService.getProvider(chainId);
    return new ethers.Contract(router, ROUTER_ABI, provider);
  }

  private static async resolvePath(
    chainId: ChainId,
    fromToken: Token,
    toToken: Token,
    amountIn: string
  ): Promise<{ path: string[]; amountOut: bigint }> {
    const router = await this.getRouterContract(chainId);
    const { wrappedNative } = this.getConfig(chainId);
    const isFromNative = this.isNativeToken(fromToken);
    const isToNative = this.isNativeToken(toToken);

    if (isFromNative && isToNative) {
      throw new Error('不能兑换为同一种原生代币');
    }

    if (isFromNative) {
      const path = [wrappedNative, toToken.address];
      const amounts = await router.getAmountsOut(amountIn, path);
      return { path, amountOut: BigInt(amounts[amounts.length - 1].toString()) };
    }

    if (isToNative) {
      const path = [fromToken.address, wrappedNative];
      const amounts = await router.getAmountsOut(amountIn, path);
      return { path, amountOut: BigInt(amounts[amounts.length - 1].toString()) };
    }

    const directPath = [fromToken.address, toToken.address];
    try {
      const directAmounts = await router.getAmountsOut(amountIn, directPath);
      return {
        path: directPath,
        amountOut: BigInt(directAmounts[directAmounts.length - 1].toString()),
      };
    } catch {
      const routedPath = [fromToken.address, wrappedNative, toToken.address];
      const routedAmounts = await router.getAmountsOut(amountIn, routedPath);
      return {
        path: routedPath,
        amountOut: BigInt(routedAmounts[routedAmounts.length - 1].toString()),
      };
    }
  }

  private static calculateMinAmountOut(amountOut: string, slippage: number): string {
    const basisPoints = BigInt(Math.floor(slippage * 100));
    const amountOutBig = BigInt(amountOut);
    const minAmount = (amountOutBig * (10000n - basisPoints)) / 10000n;
    return minAmount.toString();
  }

  static async getQuote(params: SwapParams): Promise<SwapQuote> {
    try {
      const { fromToken, toToken, amount, slippage } = params;
      const chainId = fromToken.chainId as ChainId;

      if (chainId !== (toToken.chainId as ChainId)) {
        throw new Error('暂不支持跨链兑换');
      }

      if (!this.isSupportedChain(chainId)) {
        throw new Error('当前网络暂不支持兑换');
      }

      if (this.isNativeToken(fromToken) && this.isNativeToken(toToken)) {
        throw new Error('不能兑换相同资产');
      }

      const fromAmount = ethers.parseUnits(amount, fromToken.decimals).toString();
      const { path, amountOut } = await this.resolvePath(chainId, fromToken, toToken, fromAmount);
      const toAmount = amountOut.toString();

      const minToAmount = this.calculateMinAmountOut(toAmount, slippage);
      const { router, name } = this.getConfig(chainId);

      return {
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        minToAmount,
        estimatedGas: '250000',
        path,
        router,
        dexName: name,
      };
    } catch (error) {
      throw new Error(`获取兑换报价失败: ${error}`);
    }
  }

  static async getAllowance(
    owner: string,
    token: Token,
    chainId: ChainId
  ): Promise<string> {
    if (this.isNativeToken(token)) {
      return ethers.MaxUint256.toString();
    }

    const spender = this.getSpender(chainId);
    const provider = RPCService.getProvider(chainId);
    const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
    const allowance = await contract.allowance(owner, spender);
    return allowance.toString();
  }

  static async needsApproval(
    owner: string,
    token: Token,
    amount: string,
    chainId: ChainId
  ): Promise<boolean> {
    if (this.isNativeToken(token)) {
      return false;
    }

    const allowance = await this.getAllowance(owner, token, chainId);
    return BigInt(allowance) < BigInt(amount);
  }

  static async approveMax(
    params: {
      owner: string;
      token: Token;
      walletId: string;
      chainId: ChainId;
    }
  ): Promise<string> {
    const { owner, token, walletId, chainId } = params;

    if (this.isNativeToken(token)) {
      throw new Error('原生代币不需要授权');
    }

    const spender = this.getSpender(chainId);
    const iface = new ethers.Interface(ERC20_ABI);
    const data = iface.encodeFunctionData('approve', [spender, ethers.MaxUint256]);

    return TransactionService.sendTransaction(
      {
        from: owner,
        to: token.address,
        value: '0',
        data,
      },
      walletId,
      chainId
    );
  }

  static async executeSwap(
    quote: SwapQuote,
    walletId: string,
    fromAddress: string,
    chainId: ChainId
  ): Promise<string> {
    const iface = new ethers.Interface(ROUTER_ABI);
    const deadline = Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_SECONDS;
    const isFromNative = this.isNativeToken(quote.fromToken);
    const isToNative = this.isNativeToken(quote.toToken);

    let to = quote.router;
    let value = '0';
    let data = '0x';

    if (isFromNative) {
      data = iface.encodeFunctionData('swapExactETHForTokens', [
        quote.minToAmount,
        quote.path,
        fromAddress,
        deadline,
      ]);
      value = quote.fromAmount;
    } else if (isToNative) {
      data = iface.encodeFunctionData('swapExactTokensForETH', [
        quote.fromAmount,
        quote.minToAmount,
        quote.path,
        fromAddress,
        deadline,
      ]);
    } else {
      data = iface.encodeFunctionData('swapExactTokensForTokens', [
        quote.fromAmount,
        quote.minToAmount,
        quote.path,
        fromAddress,
        deadline,
      ]);
    }

    return TransactionService.sendTransaction(
      {
        from: fromAddress,
        to,
        value,
        data,
      },
      walletId,
      chainId
    );
  }

  static formatSwapAmount(amount: string, decimals: number): string {
    return ethers.formatUnits(amount, decimals);
  }

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

  static calculateMinReceived(toAmount: string, slippage: number): string {
    return this.calculateMinAmountOut(toAmount, slippage);
  }
}
