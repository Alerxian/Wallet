/**
 * 代币状态管理
 */

import { create } from 'zustand';
import { Token, TokenBalance } from '@/types/token.types';
import { StorageService } from '@/services/StorageService';
import { TokenService } from '@/services/TokenService';
import { PriceService } from '@/services/PriceService';
import { ChainId } from '@/types/network.types';

interface TokenState {
  tokens: Token[];
  customTokens: Token[];
  hiddenTokens: string[]; // token addresses
  balances: Record<string, TokenBalance>;
  prices: Record<string, number>;
  loading: boolean;

  // Actions
  addCustomToken: (token: Token) => Promise<void>;
  removeCustomToken: (address: string, chainId: number) => Promise<void>;
  hideToken: (address: string) => Promise<void>;
  showToken: (address: string) => Promise<void>;
  loadTokens: (chainId: ChainId) => Promise<void>;
  loadBalances: (address: string, chainId: ChainId) => Promise<void>;
  loadPrices: (symbols: string[]) => Promise<void>;
  refreshAll: (address: string, chainId: ChainId) => Promise<void>;
  init: () => Promise<void>;
}

const STORAGE_KEY_CUSTOM = 'custom_tokens';
const STORAGE_KEY_HIDDEN = 'hidden_tokens';

// 默认代币列表（主流 ERC-20 代币）
const DEFAULT_TOKENS: Record<ChainId, Token[]> = {
  [ChainId.ETHEREUM]: [
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: ChainId.ETHEREUM,
    },
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: ChainId.ETHEREUM,
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      chainId: ChainId.ETHEREUM,
    },
  ],
  [ChainId.BSC]: [
    {
      address: '0x55d398326f99059fF775485246999027B3197955',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 18,
      chainId: ChainId.BSC,
    },
  ],
  [ChainId.POLYGON]: [
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: ChainId.POLYGON,
    },
  ],
  [ChainId.ARBITRUM]: [],
  [ChainId.OPTIMISM]: [],
  [ChainId.AVALANCHE]: [],
  [ChainId.SEPOLIA]: [],
};

export const useTokenStore = create<TokenState>((set, get) => ({
  tokens: [],
  customTokens: [],
  hiddenTokens: [],
  balances: {},
  prices: {},
  loading: false,

  addCustomToken: async (token: Token) => {
    try {
      const { customTokens } = get();
      const exists = customTokens.find(
        t => t.address.toLowerCase() === token.address.toLowerCase() && t.chainId === token.chainId
      );

      if (exists) {
        throw new Error('代币已存在');
      }

      const updated = [...customTokens, token];
      set({ customTokens: updated });

      await StorageService.setSecure(STORAGE_KEY_CUSTOM, JSON.stringify(updated));
    } catch (error) {
      console.error('添加自定义代币失败:', error);
      throw error;
    }
  },

  removeCustomToken: async (address: string, chainId: number) => {
    try {
      const { customTokens } = get();
      const updated = customTokens.filter(
        t => !(t.address.toLowerCase() === address.toLowerCase() && t.chainId === chainId)
      );
      set({ customTokens: updated });

      await StorageService.setSecure(STORAGE_KEY_CUSTOM, JSON.stringify(updated));
    } catch (error) {
      console.error('删除自定义代币失败:', error);
      throw error;
    }
  },

  hideToken: async (address: string) => {
    try {
      const { hiddenTokens } = get();
      if (hiddenTokens.includes(address.toLowerCase())) return;

      const updated = [...hiddenTokens, address.toLowerCase()];
      set({ hiddenTokens: updated });

      await StorageService.setSecure(STORAGE_KEY_HIDDEN, JSON.stringify(updated));
    } catch (error) {
      console.error('隐藏代币失败:', error);
      throw error;
    }
  },

  showToken: async (address: string) => {
    try {
      const { hiddenTokens } = get();
      const updated = hiddenTokens.filter(a => a !== address.toLowerCase());
      set({ hiddenTokens: updated });

      await StorageService.setSecure(STORAGE_KEY_HIDDEN, JSON.stringify(updated));
    } catch (error) {
      console.error('显示代币失败:', error);
      throw error;
    }
  },

  loadTokens: async (chainId: ChainId) => {
    try {
      const { customTokens } = get();
      const defaultTokens = DEFAULT_TOKENS[chainId] || [];
      const chainCustomTokens = customTokens.filter(t => t.chainId === chainId);

      set({ tokens: [...defaultTokens, ...chainCustomTokens] });
    } catch (error) {
      console.error('加载代币列表失败:', error);
    }
  },

  loadBalances: async (address: string, chainId: ChainId) => {
    try {
      set({ loading: true });
      const { tokens } = get();
      const balances: Record<string, TokenBalance> = {};

      // 并行加载所有代币余额
      await Promise.all(
        tokens.map(async token => {
          try {
            const balance = await TokenService.getTokenBalance(
              address,
              token
            );
            balances[token.address.toLowerCase()] = balance;
          } catch (error) {
            console.error(`加载代币 ${token.symbol} 余额失败:`, error);
          }
        })
      );

      set({ balances });
    } catch (error) {
      console.error('加载代币余额失败:', error);
    } finally {
      set({ loading: false });
    }
  },

  loadPrices: async (symbols: string[]) => {
    try {
      const priceData = await PriceService.getPrices(symbols);
      const prices: Record<string, number> = {};

      Object.entries(priceData).forEach(([tokenId, data]) => {
        // 简单映射：根据常见代币符号
        const symbolMap: Record<string, string> = {
          'ethereum': 'ETH',
          'bitcoin': 'BTC',
          'binancecoin': 'BNB',
          'matic-network': 'MATIC',
          'avalanche-2': 'AVAX',
        };

        const symbol = symbolMap[tokenId];
        if (symbol) {
          prices[symbol] = data.usd;
        }
      });

      set({ prices });
    } catch (error) {
      console.error('加载价格失败:', error);
    }
  },

  refreshAll: async (address: string, chainId: ChainId) => {
    try {
      await get().loadTokens(chainId);
      await get().loadBalances(address, chainId);

      const { tokens } = get();
      const symbols = tokens.map(t => t.symbol);
      await get().loadPrices(symbols);
    } catch (error) {
      console.error('刷新数据失败:', error);
    }
  },

  init: async () => {
    try {
      // 加载自定义代币
      const customStr = await StorageService.getSecure(STORAGE_KEY_CUSTOM);
      if (customStr) {
        const customTokens = JSON.parse(customStr);
        set({ customTokens });
      }

      // 加载隐藏代币
      const hiddenStr = await StorageService.getSecure(STORAGE_KEY_HIDDEN);
      if (hiddenStr) {
        const hiddenTokens = JSON.parse(hiddenStr);
        set({ hiddenTokens });
      }
    } catch (error) {
      console.error('初始化代币配置失败:', error);
    }
  },
}));
