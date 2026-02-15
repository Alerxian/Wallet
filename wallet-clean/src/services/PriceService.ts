/**
 * 价格服务
 * 使用 CoinGecko API 获取加密货币价格
 */

import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// 代币 ID 映射（CoinGecko ID）
const TOKEN_IDS: Record<string, string> = {
  ETH: 'ethereum',
  BTC: 'bitcoin',
  BNB: 'binancecoin',
  MATIC: 'matic-network',
  AVAX: 'avalanche-2',
  // 可以添加更多代币
};

export interface TokenPrice {
  usd: number;
  usd_24h_change: number;
  usd_market_cap?: number;
  last_updated_at?: number;
}

export interface PriceData {
  [tokenId: string]: TokenPrice;
}

export class PriceService {
  /**
   * 获取单个代币价格
   */
  static async getPrice(
    symbol: string,
    currency: string = 'usd'
  ): Promise<TokenPrice | null> {
    try {
      const tokenId = TOKEN_IDS[symbol.toUpperCase()];
      if (!tokenId) {
        console.warn(`未找到代币 ${symbol} 的 ID 映射`);
        return null;
      }

      const response = await axios.get(`${COINGECKO_API}/simple/price`, {
        params: {
          ids: tokenId,
          vs_currencies: currency,
          include_24hr_change: true,
          include_market_cap: true,
          include_last_updated_at: true,
        },
      });

      const data = response.data[tokenId];
      if (!data) return null;

      return {
        usd: data[currency],
        usd_24h_change: data[`${currency}_24h_change`] || 0,
        usd_market_cap: data[`${currency}_market_cap`],
        last_updated_at: data.last_updated_at,
      };
    } catch (error) {
      console.error('获取价格失败:', error);
      return null;
    }
  }

  /**
   * 批量获取代币价格
   */
  static async getPrices(
    symbols: string[],
    currency: string = 'usd'
  ): Promise<PriceData> {
    try {
      const tokenIds = symbols
        .map(s => TOKEN_IDS[s.toUpperCase()])
        .filter(Boolean);

      if (tokenIds.length === 0) {
        return {};
      }

      const response = await axios.get(`${COINGECKO_API}/simple/price`, {
        params: {
          ids: tokenIds.join(','),
          vs_currencies: currency,
          include_24hr_change: true,
          include_market_cap: true,
          include_last_updated_at: true,
        },
      });

      const result: PriceData = {};
      Object.entries(response.data).forEach(([tokenId, data]: [string, any]) => {
        result[tokenId] = {
          usd: data[currency],
          usd_24h_change: data[`${currency}_24h_change`] || 0,
          usd_market_cap: data[`${currency}_market_cap`],
          last_updated_at: data.last_updated_at,
        };
      });

      return result;
    } catch (error) {
      console.error('批量获取价格失败:', error);
      return {};
    }
  }

  /**
   * 通过合约地址获取代币价格
   */
  static async getPriceByContract(
    contractAddress: string,
    platform: string = 'ethereum',
    currency: string = 'usd'
  ): Promise<TokenPrice | null> {
    try {
      const response = await axios.get(
        `${COINGECKO_API}/simple/token_price/${platform}`,
        {
          params: {
            contract_addresses: contractAddress,
            vs_currencies: currency,
            include_24hr_change: true,
            include_market_cap: true,
            include_last_updated_at: true,
          },
        }
      );

      const data = response.data[contractAddress.toLowerCase()];
      if (!data) return null;

      return {
        usd: data[currency],
        usd_24h_change: data[`${currency}_24h_change`] || 0,
        usd_market_cap: data[`${currency}_market_cap`],
        last_updated_at: data.last_updated_at,
      };
    } catch (error) {
      console.error('通过合约地址获取价格失败:', error);
      return null;
    }
  }

  /**
   * 获取代币市场数据
   */
  static async getMarketData(
    symbol: string,
    currency: string = 'usd'
  ): Promise<any> {
    try {
      const tokenId = TOKEN_IDS[symbol.toUpperCase()];
      if (!tokenId) return null;

      const response = await axios.get(`${COINGECKO_API}/coins/${tokenId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
        },
      });

      return response.data.market_data;
    } catch (error) {
      console.error('获取市场数据失败:', error);
      return null;
    }
  }

  /**
   * 获取代币历史价格
   */
  static async getHistoricalPrice(
    symbol: string,
    days: number = 7,
    currency: string = 'usd'
  ): Promise<Array<[number, number]>> {
    try {
      const tokenId = TOKEN_IDS[symbol.toUpperCase()];
      if (!tokenId) return [];

      const response = await axios.get(
        `${COINGECKO_API}/coins/${tokenId}/market_chart`,
        {
          params: {
            vs_currency: currency,
            days,
          },
        }
      );

      return response.data.prices || [];
    } catch (error) {
      console.error('获取历史价格失败:', error);
      return [];
    }
  }

  /**
   * 计算代币价值
   */
  static calculateValue(balance: string, price: number): number {
    try {
      const balanceNum = parseFloat(balance);
      if (isNaN(balanceNum)) return 0;
      return balanceNum * price;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 格式化价格
   */
  static formatPrice(price: number): string {
    if (price >= 1) {
      return price.toFixed(2);
    } else if (price >= 0.01) {
      return price.toFixed(4);
    } else {
      return price.toFixed(6);
    }
  }

  /**
   * 格式化价格变化
   */
  static formatPriceChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  /**
   * 获取价格变化颜色
   */
  static getPriceChangeColor(change: number): string {
    return change >= 0 ? '#10B981' : '#EF4444';
  }
}
