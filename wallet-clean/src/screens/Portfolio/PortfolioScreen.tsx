/**
 * 投资组合界面
 * 显示资产追踪、收益分析和图表
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { typography, spacing, ThemeColors } from '@/theme';
import { Card } from '@components/common/Card';
import { useWalletStore } from '@store/walletStore';
import { useNetworkStore } from '@store/networkStore';
import { useTokenStore } from '@store/tokenStore';
import {
  PortfolioService,
  AssetSnapshot,
  PortfolioStats,
  ProfitData,
} from '@/services/PortfolioService';
import { PriceService } from '@/services/PriceService';
import { useTheme } from '@/theme/ThemeContext';

const screenWidth = Dimensions.get('window').width;

export const PortfolioScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = createStyles(colors);
  const { currentWallet } = useWalletStore();
  const { currentNetwork } = useNetworkStore();
  const { tokens } = useTokenStore();

  const [currentSnapshot, setCurrentSnapshot] = useState<AssetSnapshot | null>(null);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [profitData, setProfitData] = useState<ProfitData | null>(null);
  const [historicalData, setHistoricalData] = useState<AssetSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  // 加载投资组合数据
  const loadPortfolioData = async () => {
    if (!currentWallet) return;

    try {
      setLoading(true);

      // 创建当前快照
      const snapshot = await PortfolioService.createSnapshot(
        currentWallet.address,
        currentNetwork.chainId as any,
        tokens
      );
      setCurrentSnapshot(snapshot);

      // 计算统计数据
      const portfolioStats = await PortfolioService.calculateStats(snapshot);
      setStats(portfolioStats);

      // 获取历史数据
      const snapshots = await PortfolioService.getSnapshots(timeRange);
      setHistoricalData(snapshots);

      // 计算收益
      const profit = await PortfolioService.calculateProfit(snapshot);
      setProfitData(profit);
    } catch (error: any) {
      console.error('加载投资组合失败:', error);
      Alert.alert('错误', error.message || '加载投资组合失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolioData();
  }, [currentWallet, currentNetwork, timeRange]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPortfolioData();
    setRefreshing(false);
  };

  // 准备图表数据
  const chartData = {
    labels: historicalData.map(s => {
      const date = new Date(s.timestamp);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        data: historicalData.map(s => s.totalValue),
        color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const pieChartData =
    stats?.assetDistribution.map(item => ({
      name: item.label,
      value: item.value,
      color: item.color,
      legendFontColor: colors.text.secondary,
      legendFontSize: 12,
    })) || [];

  if (!currentWallet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无钱包</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* 总资产卡片 */}
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>总资产价值</Text>
          <Text style={styles.totalValue}>
            ${stats?.totalValue.toFixed(2) || '0.00'}
          </Text>
          {stats && stats.totalChange24h !== 0 && (
            <View style={styles.changeContainer}>
              <Text
                style={[
                  styles.changeValue,
                  {
                    color: PriceService.getPriceChangeColor(
                      stats.totalChangePercent24h
                    ),
                  },
                ]}
              >
                {PriceService.formatPriceChange(stats.totalChangePercent24h)}
              </Text>
              <Text style={styles.changeLabel}>24小时</Text>
            </View>
          )}
        </Card>

        {/* 收益卡片 */}
        {profitData && (
          <Card style={styles.profitCard}>
            <Text style={styles.sectionTitle}>收益统计</Text>
            <View style={styles.profitRow}>
              <View style={styles.profitItem}>
                <Text style={styles.profitLabel}>总收益</Text>
                <Text
                  style={[
                    styles.profitValue,
                    {
                      color:
                        profitData.totalProfit >= 0
                          ? colors.status.success
                          : colors.status.error,
                    },
                  ]}
                >
                  ${profitData.totalProfit.toFixed(2)}
                </Text>
                <Text style={styles.profitPercent}>
                  {profitData.totalProfitPercent.toFixed(2)}%
                </Text>
              </View>
              <View style={styles.profitItem}>
                <Text style={styles.profitLabel}>已实现收益</Text>
                <Text style={styles.profitValue}>
                  ${profitData.realizedProfit.toFixed(2)}
                </Text>
              </View>
              <View style={styles.profitItem}>
                <Text style={styles.profitLabel}>未实现收益</Text>
                <Text style={styles.profitValue}>
                  ${profitData.unrealizedProfit.toFixed(2)}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* 历史趋势图 */}
        {historicalData.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={styles.sectionTitle}>资产趋势</Text>
            <View style={styles.timeRangeContainer}>
              {[7, 30, 90].map(days => (
                <Text
                  key={days}
                  style={[
                    styles.timeRangeButton,
                    timeRange === days && styles.timeRangeButtonActive,
                  ]}
                  onPress={() => setTimeRange(days as 7 | 30 | 90)}
                >
                  {days}天
                </Text>
              ))}
            </View>
            <LineChart
              data={chartData}
              width={screenWidth - spacing.md * 4}
              height={220}
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(160, 160, 160, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: colors.primary,
                },
              }}
              bezier
              style={styles.chart}
            />
          </Card>
        )}

        {/* 资产分布 */}
        {pieChartData.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={styles.sectionTitle}>资产分布</Text>
            <PieChart
              data={pieChartData}
              width={screenWidth - spacing.md * 4}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
              }}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Card>
        )}

        {/* 资产列表 */}
        {stats && stats.topAssets.length > 0 && (
          <Card style={styles.assetsCard}>
            <Text style={styles.sectionTitle}>主要资产</Text>
            {stats.topAssets.map((asset, index) => (
              <View key={index} style={styles.assetItem}>
                <View style={styles.assetInfo}>
                  <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                  <Text style={styles.assetPercentage}>
                    {asset.percentage.toFixed(2)}%
                  </Text>
                </View>
                <Text style={styles.assetValue}>
                  ${asset.value.toFixed(2)}
                </Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.primary,
  },
  totalCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  totalValue: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  changeValue: {
    ...typography.body,
    fontWeight: '600',
  },
  changeLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  profitCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profitItem: {
    flex: 1,
    alignItems: 'center',
  },
  profitLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  profitValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  profitPercent: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  chartCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  timeRangeButton: {
    ...typography.caption,
    color: colors.text.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  timeRangeButtonActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 16,
  },
  assetsCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  assetInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  assetSymbol: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  assetPercentage: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  assetValue: {
    ...typography.body,
    color: colors.text.primary,
  },
  });
