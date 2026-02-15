/**
 * 价格服务
 * 使用 CoinGecko API 获取加密货币价格
 * 包含缓存、请求间隔控制和重试机制
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

// 缓存接口
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// 请求队列项
interface QueueItem {
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export class PriceService {
  // 缓存配置
  private static cache = new Map<string, CacheEntry<any>>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 分钟缓存
  private static STALE_CACHE_DURATION = 30 * 60 * 1000; // 最长 30 分钟降级缓存

  // 请求去重
  private static pendingRequests = new Map<string, Promise<any>>();

  // 请求间隔控制
  private static lastRequestTime = 0;
  private static MIN_REQUEST_INTERVAL = 2500; // 2.5 秒最小间隔
  private static rateLimitedUntil = 0;

  // 请求队列
  private static requestQueue: QueueItem[] = [];
  private static isProcessingQueue = false;

  // 重试配置
  private static MAX_RETRIES = 3;
  private static RETRY_DELAY = 2000; // 2 秒

  private static getCacheEntry<T>(key: string): CacheEntry<T> | null {
    return (this.cache.get(key) as CacheEntry<T> | undefined) || null;
  }

  /**
   * 获取缓存数据
   */
  private static getCache<T>(key: string): T | null {
    const entry = this.getCacheEntry<T>(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 获取过期缓存（用于限流降级）
   */
  private static getStaleCache<T>(key: string): T | null {
    const entry = this.getCacheEntry<T>(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.STALE_CACHE_DURATION) {
      return null;
    }

    return entry.data;
  }

  /**
   * 设置缓存数据
   */
  private static setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 清除缓存
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * 等待请求间隔
   */
  private static async waitForInterval(): Promise<void> {
    const now = Date.now();
    if (this.rateLimitedUntil > now) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitedUntil - now));
    }

    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * 记录限流窗口
   */
  private static markRateLimited(error: any): number {
    const retryAfterHeader = error?.response?.headers?.['retry-after'];
    const retryAfterSeconds = Number(retryAfterHeader);
    const retryAfterMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? retryAfterSeconds * 1000
      : 0;

    const cooldownMs = Math.max(retryAfterMs, 10_000);
    const until = Date.now() + cooldownMs;
    this.rateLimitedUntil = Math.max(this.rateLimitedUntil, until);
    return cooldownMs;
  }

  /**
   * 同 key 请求去重
   */
  private static dedupeRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.pendingRequests.get(key) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const pending = fn()
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, pending);
    return pending;
  }

  /**
   * 添加请求到队列
   */
  private static async enqueueRequest<T>(
    execute: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ execute, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * 处理请求队列
   */
  private static async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const item = this.requestQueue.shift();
      if (!item) break;

      try {
        await this.waitForInterval();
        const result = await item.execute();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * 带重试的请求
   */
  private static async requestWithRetry<T>(
    fn: () => Promise<T>,
    retries = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      // 如果是 429 错误且还有重试次数
      if (error?.response?.status === 429 && retries > 0) {
        const baseDelay = this.RETRY_DELAY * (this.MAX_RETRIES - retries + 1);
        const cooldownDelay = this.markRateLimited(error);
        const jitter = Math.floor(Math.random() * 800);
        const delay = Math.max(baseDelay, cooldownDelay) + jitter;
        console.log(`遇到 429 错误，${delay}ms 后重试...（剩余 ${retries} 次）`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.requestWithRetry(fn, retries - 1);
      }

      if (error?.response?.status === 429) {
        throw new Error('价格服务限流，请稍后再试');
      }

      throw error;
    }
  }

  /**
   * 获取单个代币价格
   */
  static async getPrice(
    symbol: string,
    currency: string = 'usd'
  ): Promise<TokenPrice | null> {
    const cacheKey = `price_${symbol}_${currency}`;

    // 检查缓存
    const cached = this.getCache<TokenPrice>(cacheKey);
    if (cached) {
      return cached;
    }

    const stale = this.getStaleCache<TokenPrice>(cacheKey);

    try {
      const tokenId = TOKEN_IDS[symbol.toUpperCase()];
      if (!tokenId) {
        console.warn(`未找到代币 ${symbol} 的 ID 映射`);
        return null;
      }

      const result = await this.dedupeRequest(cacheKey, async () => {
        return this.enqueueRequest(async () => {
          return this.requestWithRetry(async () => {
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
          });
        });
      });

      // 缓存结果
      if (result) {
        this.setCache(cacheKey, result);
      }

      return result;
    } catch (error) {
      console.error('获取价格失败:', error);
      if (stale) {
        console.log(`价格接口限流，使用 ${symbol} 的本地缓存价格`);
        return stale;
      }
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
    const uniqueSymbols = [...new Set(symbols.map((s) => s.toUpperCase()))];
    const sortedSymbols = [...uniqueSymbols].sort();
    const cacheKey = `prices_${sortedSymbols.join(',')}_${currency}`;

    // 检查缓存
    const cached = this.getCache<PriceData>(cacheKey);
    if (cached) {
      return cached;
    }

    const stale = this.getStaleCache<PriceData>(cacheKey);

    try {
      const tokenIds = sortedSymbols
        .map(s => TOKEN_IDS[s])
        .filter(Boolean);

      const uniqueTokenIds = [...new Set(tokenIds)];

      if (uniqueTokenIds.length === 0) {
        return {};
      }

      const result = await this.dedupeRequest(cacheKey, async () => {
        return this.enqueueRequest(async () => {
          return this.requestWithRetry(async () => {
            const response = await axios.get(`${COINGECKO_API}/simple/price`, {
              params: {
                ids: uniqueTokenIds.join(','),
                vs_currencies: currency,
                include_24hr_change: true,
                include_market_cap: true,
                include_last_updated_at: true,
              },
            });

            const priceData: PriceData = {};
            Object.entries(response.data).forEach(([tokenId, data]: [string, any]) => {
              priceData[tokenId] = {
                usd: data[currency],
                usd_24h_change: data[`${currency}_24h_change`] || 0,
                usd_market_cap: data[`${currency}_market_cap`],
                last_updated_at: data.last_updated_at,
              };
            });

            return priceData;
          });
        });
      });

      // 缓存结果
      if (result && Object.keys(result).length > 0) {
        this.setCache(cacheKey, result);
      }

      return result;
    } catch (error) {
      console.error('批量获取价格失败:', error);
      if (stale) {
        console.log('价格接口限流，使用本地缓存价格');
        return stale;
      }
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
    const cacheKey = `contract_${contractAddress}_${platform}_${currency}`;

    // 检查缓存
    const cached = this.getCache<TokenPrice>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.enqueueRequest(async () => {
        return this.requestWithRetry(async () => {
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
        });
      });

      // 缓存结果
      if (result) {
        this.setCache(cacheKey, result);
      }

      return result;
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
    const cacheKey = `market_${symbol}_${currency}`;

    // 检查缓存
    const cached = this.getCache<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const tokenId = TOKEN_IDS[symbol.toUpperCase()];
      if (!tokenId) return null;

      const result = await this.enqueueRequest(async () => {
        return this.requestWithRetry(async () => {
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
        });
      });

      // 缓存结果
      if (result) {
        this.setCache(cacheKey, result);
      }

      return result;
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
    const cacheKey = `history_${symbol}_${days}_${currency}`;

    // 检查缓存（历史数据缓存时间更长）
    const cached = this.getCache<Array<[number, number]>>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const tokenId = TOKEN_IDS[symbol.toUpperCase()];
      if (!tokenId) return [];

      const result = await this.enqueueRequest(async () => {
        return this.requestWithRetry(async () => {
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
        });
      });

      // 缓存结果
      if (result && result.length > 0) {
        this.setCache(cacheKey, result);
      }

      return result;
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
