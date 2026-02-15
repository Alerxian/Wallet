/**
 * 投资组合服务
 * 追踪资产价值、收益和历史数据
 */

import { StorageService } from './StorageService';
import { PriceService } from './PriceService';
import { TokenService } from './TokenService';
import { ChainId } from '@/types/network.types';
import { Token } from '@/types/token.types';

// 资产快照
export interface AssetSnapshot {
  timestamp: number;
  totalValue: number;
  assets: {
    symbol: string;
    balance: string;
    price: number;
    value: number;
    chainId: ChainId;
  }[];
}

// 投资组合统计
export interface PortfolioStats {
  totalValue: number;
  totalChange24h: number;
  totalChangePercent24h: number;
  topAssets: {
    symbol: string;
    value: number;
    percentage: number;
  }[];
  assetDistribution: {
    label: string;
    value: number;
    color: string;
  }[];
}

// 收益数据
export interface ProfitData {
  totalProfit: number;
  totalProfitPercent: number;
  realizedProfit: number;
  unrealizedProfit: number;
  transactions: {
    type: 'buy' | 'sell';
    symbol: string;
    amount: string;
    price: number;
    value: number;
    timestamp: number;
  }[];
}

const STORAGE_KEY_SNAPSHOTS = 'portfolio_snapshots';
const STORAGE_KEY_TRANSACTIONS = 'portfolio_transactions';

export class PortfolioService {
  /**
   * 创建资产快照
   */
  static async createSnapshot(
    address: string,
    chainId: ChainId,
    tokens: Token[]
  ): Promise<AssetSnapshot> {
    try {
      const assets: AssetSnapshot['assets'] = [];

      // 获取原生代币余额
      const nativeBalance = await TokenService.getNativeBalance(address, chainId);
      const nativePrice = await PriceService.getPrice('ETH'); // 简化处理

      if (nativePrice && nativeBalance.balanceFormatted) {
        assets.push({
          symbol: 'ETH',
          balance: nativeBalance.balanceFormatted,
          price: nativePrice.usd,
          value: parseFloat(nativeBalance.balanceFormatted) * nativePrice.usd,
          chainId,
        });
      }

      // 获取代币余额
      for (const token of tokens) {
        try {
          const balance = await TokenService.getTokenBalance(address, token);
          const price = await PriceService.getPrice(token.symbol);

          if (price) {
            assets.push({
              symbol: token.symbol,
              balance: balance.balanceFormatted,
              price: price.usd,
              value: parseFloat(balance.balanceFormatted) * price.usd,
              chainId: token.chainId,
            });
          }
        } catch (error) {
          console.error(`获取代币 ${token.symbol} 余额失败:`, error);
        }
      }

      const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

      const snapshot: AssetSnapshot = {
        timestamp: Date.now(),
        totalValue,
        assets,
      };

      // 保存快照
      await this.saveSnapshot(snapshot);

      return snapshot;
    } catch (error) {
      throw new Error(`创建快照失败: ${error}`);
    }
  }

  /**
   * 保存快照
   */
  private static async saveSnapshot(snapshot: AssetSnapshot): Promise<void> {
    try {
      const snapshotsStr = await StorageService.getSecure(STORAGE_KEY_SNAPSHOTS);
      const snapshots: AssetSnapshot[] = snapshotsStr
        ? JSON.parse(snapshotsStr)
        : [];

      // 添加新快照
      snapshots.push(snapshot);

      // 只保留最近 90 天的快照
      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const filteredSnapshots = snapshots.filter(
        s => s.timestamp > ninetyDaysAgo
      );

      await StorageService.setSecure(
        STORAGE_KEY_SNAPSHOTS,
        JSON.stringify(filteredSnapshots)
      );
    } catch (error) {
      console.error('保存快照失败:', error);
    }
  }

  /**
   * 获取历史快照
   */
  static async getSnapshots(days: number = 30): Promise<AssetSnapshot[]> {
    try {
      const snapshotsStr = await StorageService.getSecure(STORAGE_KEY_SNAPSHOTS);
      if (!snapshotsStr) return [];

      const snapshots: AssetSnapshot[] = JSON.parse(snapshotsStr);
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

      return snapshots.filter(s => s.timestamp > cutoffTime);
    } catch (error) {
      console.error('获取快照失败:', error);
      return [];
    }
  }

  /**
   * 计算投资组合统计
   */
  static async calculateStats(
    currentSnapshot: AssetSnapshot
  ): Promise<PortfolioStats> {
    try {
      // 获取 24 小时前的快照
      const snapshots = await this.getSnapshots(1);
      const previousSnapshot = snapshots.length > 0 ? snapshots[0] : null;

      // 计算 24 小时变化
      let totalChange24h = 0;
      let totalChangePercent24h = 0;

      if (previousSnapshot) {
        totalChange24h = currentSnapshot.totalValue - previousSnapshot.totalValue;
        totalChangePercent24h =
          (totalChange24h / previousSnapshot.totalValue) * 100;
      }

      // 计算资产分布
      const sortedAssets = [...currentSnapshot.assets].sort(
        (a, b) => b.value - a.value
      );

      const topAssets = sortedAssets.slice(0, 5).map(asset => ({
        symbol: asset.symbol,
        value: asset.value,
        percentage: (asset.value / currentSnapshot.totalValue) * 100,
      }));

      // 生成饼图数据
      const colors = [
        '#1E3A8A',
        '#3B82F6',
        '#60A5FA',
        '#93C5FD',
        '#DBEAFE',
      ];

      const assetDistribution = topAssets.map((asset, index) => ({
        label: asset.symbol,
        value: asset.value,
        color: colors[index % colors.length],
      }));

      return {
        totalValue: currentSnapshot.totalValue,
        totalChange24h,
        totalChangePercent24h,
        topAssets,
        assetDistribution,
      };
    } catch (error) {
      throw new Error(`计算统计失败: ${error}`);
    }
  }

  /**
   * 记录交易
   */
  static async recordTransaction(transaction: ProfitData['transactions'][0]): Promise<void> {
    try {
      const transactionsStr = await StorageService.getSecure(
        STORAGE_KEY_TRANSACTIONS
      );
      const transactions: ProfitData['transactions'] = transactionsStr
        ? JSON.parse(transactionsStr)
        : [];

      transactions.push(transaction);

      await StorageService.setSecure(
        STORAGE_KEY_TRANSACTIONS,
        JSON.stringify(transactions)
      );
    } catch (error) {
      console.error('记录交易失败:', error);
    }
  }

  /**
   * 计算收益
   */
  static async calculateProfit(
    currentSnapshot?: AssetSnapshot
  ): Promise<ProfitData> {
    try {
      const transactionsStr = await StorageService.getSecure(
        STORAGE_KEY_TRANSACTIONS
      );
      const transactions: ProfitData['transactions'] = transactionsStr
        ? JSON.parse(transactionsStr)
        : [];

      // 计算总投入
      const totalInvested = transactions
        .filter(t => t.type === 'buy')
        .reduce((sum, t) => sum + t.value, 0);

      // 计算总卖出
      const totalSold = transactions
        .filter(t => t.type === 'sell')
        .reduce((sum, t) => sum + t.value, 0);

      // 已实现收益
      const realizedProfit = totalSold - totalInvested;

      // 未实现收益
      const unrealizedProfit = currentSnapshot
        ? currentSnapshot.totalValue - totalInvested
        : 0;

      // 总收益
      const totalProfit = realizedProfit + unrealizedProfit;
      const totalProfitPercent =
        totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

      return {
        totalProfit,
        totalProfitPercent,
        realizedProfit,
        unrealizedProfit,
        transactions,
      };
    } catch (error) {
      throw new Error(`计算收益失败: ${error}`);
    }
  }

  /**
   * 格式化价值
   */
  static formatValue(value: number): string {
    if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  }

  /**
   * 格式化变化百分比
   */
  static formatChangePercent(percent: number): string {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  }

  /**
   * 获取变化颜色
   */
  static getChangeColor(change: number): string {
    if (change > 0) return '#10B981'; // green
    if (change < 0) return '#EF4444'; // red
    return '#A0A0A0'; // gray
  }

  /**
   * 生成图表数据
   */
  static async generateChartData(
    days: number = 30
  ): Promise<{
    labels: string[];
    data: number[];
  }> {
    try {
      const snapshots = await this.getSnapshots(days);

      if (snapshots.length === 0) {
        return { labels: [], data: [] };
      }

      // 按天分组
      const dailyData = new Map<string, number>();

      snapshots.forEach(snapshot => {
        const date = new Date(snapshot.timestamp);
        const dateKey = `${date.getMonth() + 1}/${date.getDate()}`;

        // 使用每天的最后一个快照
        dailyData.set(dateKey, snapshot.totalValue);
      });

      const labels = Array.from(dailyData.keys());
      const data = Array.from(dailyData.values());

      return { labels, data };
    } catch (error) {
      console.error('生成图表数据失败:', error);
      return { labels: [], data: [] };
    }
  }
}
