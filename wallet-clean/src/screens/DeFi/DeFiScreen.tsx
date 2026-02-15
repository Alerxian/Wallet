/**
 * DeFi 协议界面
 * 展示支持的 DeFi 协议和用户仓位
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { MainScreenNavigationProp } from '@/types/navigation.types';
import { typography, spacing, ThemeColors } from '@/theme';
import { Card } from '@components/common/Card';
import { useWalletStore } from '@store/walletStore';
import { useNetworkStore } from '@store/networkStore';
import { useTheme } from '@/theme/ThemeContext';
import {
  DeFiService,
  DeFiProtocol,
  LiquidityPosition,
  LendingPosition,
} from '@/services/DeFiService';

export const DeFiScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp<'DeFi'>>();
  const { theme: colors } = useTheme();
  const styles = createStyles(colors);
  const { currentWallet } = useWalletStore();
  const { currentNetwork } = useNetworkStore();

  const [protocols, setProtocols] = useState<DeFiProtocol[]>([]);
  const [liquidityPositions, setLiquidityPositions] = useState<LiquidityPosition[]>([]);
  const [lendingPositions, setLendingPositions] = useState<LendingPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 加载 DeFi 数据
  const loadDeFiData = async () => {
    if (!currentWallet) return;

    try {
      setLoading(true);

      // 加载支持的协议
      const protocolList = await DeFiService.getSupportedProtocols(
        currentNetwork.chainId as any
      );
      setProtocols(protocolList);

      // 加载流动性仓位
      const liquidityList = await DeFiService.getLiquidityPositions(
        currentWallet.address,
        currentNetwork.chainId as any
      );
      setLiquidityPositions(liquidityList);

      // 加载借贷仓位
      const lendingList = await DeFiService.getLendingPositions(
        currentWallet.address,
        currentNetwork.chainId as any
      );
      setLendingPositions(lendingList);
    } catch (error: any) {
      console.error('加载 DeFi 数据失败:', error);
      Alert.alert('错误', error.message || '加载 DeFi 数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeFiData();
  }, [currentWallet, currentNetwork]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDeFiData();
    setRefreshing(false);
  };

  // 打开协议
  const handleOpenProtocol = (url: string) => {
    Linking.openURL(url);
  };

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
        {/* 支持的协议 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>支持的协议</Text>
          {protocols.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>当前网络暂无支持的 DeFi 协议</Text>
            </Card>
          ) : (
            protocols.map((protocol, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleOpenProtocol(protocol.url)}
              >
                <Card style={styles.protocolCard}>
                  <View style={styles.protocolHeader}>
                    <View>
                      <Text style={styles.protocolName}>{protocol.name}</Text>
                      <Text style={styles.protocolType}>{protocol.type}</Text>
                    </View>
                    <Text style={styles.arrow}>→</Text>
                  </View>
                  <View style={styles.protocolStats}>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>TVL</Text>
                      <Text style={styles.statValue}>
                        {DeFiService.formatTVL(protocol.tvl)}
                      </Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>APY</Text>
                      <Text style={styles.statValue}>
                        {DeFiService.formatAPY(protocol.apy)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 流动性挖矿仓位 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>流动性挖矿</Text>
          {liquidityPositions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>暂无流动性仓位</Text>
              <Text style={styles.emptySubtext}>
                在 Uniswap 等 DEX 上添加流动性后，仓位将显示在这里
              </Text>
            </Card>
          ) : (
            liquidityPositions.map((position, index) => (
              <Card key={index} style={styles.positionCard}>
                <View style={styles.positionHeader}>
                  <Text style={styles.positionProtocol}>{position.protocol}</Text>
                  <Text style={styles.positionPair}>
                    {position.token0}/{position.token1}
                  </Text>
                </View>
                <View style={styles.positionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>流动性</Text>
                    <Text style={styles.detailValue}>{position.liquidity}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>未收取手续费</Text>
                    <Text style={styles.detailValue}>
                      {position.uncollectedFees0} / {position.uncollectedFees1}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* 借贷仓位 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>借贷</Text>
          {lendingPositions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>暂无借贷仓位</Text>
              <Text style={styles.emptySubtext}>
                在 Aave 等借贷协议上存款或借款后，仓位将显示在这里
              </Text>
            </Card>
          ) : (
            lendingPositions.map((position, index) => (
              <Card key={index} style={styles.positionCard}>
                <View style={styles.positionHeader}>
                  <Text style={styles.positionProtocol}>{position.protocol}</Text>
                  <Text style={styles.positionAsset}>{position.asset}</Text>
                </View>
                <View style={styles.positionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>存款</Text>
                    <Text style={styles.detailValue}>
                      {position.supplied} ({DeFiService.formatAPY(position.supplyAPY)})
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>借款</Text>
                    <Text style={styles.detailValue}>
                      {position.borrowed} ({DeFiService.formatAPY(position.borrowAPY)})
                    </Text>
                  </View>
                  {position.healthFactor && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>健康因子</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          {
                            color:
                              position.healthFactor < 1.2
                                ? colors.status.error
                                : position.healthFactor < 1.5
                                ? colors.warning
                                : colors.status.success,
                          },
                        ]}
                      >
                        {position.healthFactor.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            ))
          )}
        </View>
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  protocolCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  protocolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  protocolName: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 4,
  },
  protocolType: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  arrow: {
    ...typography.h4,
    color: colors.text.secondary,
  },
  protocolStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  positionCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  positionProtocol: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  positionPair: {
    ...typography.h4,
    color: colors.text.primary,
  },
  positionAsset: {
    ...typography.h4,
    color: colors.text.primary,
  },
  positionDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  });
