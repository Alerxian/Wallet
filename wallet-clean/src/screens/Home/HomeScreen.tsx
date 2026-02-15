/**
 * 全新首页
 * Portfolio-first 信息架构 + 更强视觉层级
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { MainScreenNavigationProp } from '@/types/navigation.types';
import { typography, spacing, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { Card } from '@components/common/Card';
import { Atmosphere } from '@components/common/Atmosphere';
import { AddressDisplay } from '@components/wallet/AddressDisplay';
import { useWalletStore } from '@store/walletStore';
import { useNetworkStore } from '@store/networkStore';
import { useTokenStore } from '@store/tokenStore';
import { TokenService } from '@/services/TokenService';
import { PriceService } from '@/services/PriceService';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp<'Home'>>();
  const { theme: colors } = useTheme();
  const styles = createStyles(colors);

  const { currentWallet, loadWallets } = useWalletStore();
  const { currentNetwork, init: initNetwork } = useNetworkStore();
  const {
    tokens,
    balances,
    prices,
    hiddenTokens,
    loadTokens,
    loadBalances,
    loadPrices,
    init: initTokens,
  } = useTokenStore();

  const [refreshing, setRefreshing] = useState(false);
  const [nativeBalanceFormatted, setNativeBalanceFormatted] = useState('0.00');
  const [nativePrice, setNativePrice] = useState(0);
  const [nativePriceChange, setNativePriceChange] = useState(0);
  const [loading, setLoading] = useState(false);

  const visibleTokens = useMemo(
    () => tokens.filter((t) => !hiddenTokens.includes(t.address.toLowerCase())),
    [tokens, hiddenTokens]
  );

  const totalValue = useMemo(() => {
    const nativeValue = PriceService.calculateValue(nativeBalanceFormatted, nativePrice);
    const tokenValue = visibleTokens.reduce((sum, token) => {
      const tokenBalance = balances[token.address.toLowerCase()];
      const tokenPrice = prices[token.symbol];
      if (!tokenBalance || !tokenPrice) return sum;
      return sum + PriceService.calculateValue(tokenBalance.balanceFormatted, tokenPrice);
    }, 0);
    return nativeValue + tokenValue;
  }, [nativeBalanceFormatted, nativePrice, visibleTokens, balances, prices]);

  const loadData = useCallback(async () => {
    if (!currentWallet) return;

    try {
      setLoading(true);

      const [nativeBalance, nativeTokenPrice] = await Promise.all([
        TokenService.getNativeBalance(currentWallet.address, currentNetwork.chainId as any),
        PriceService.getPrice(currentNetwork.symbol),
      ]);

      setNativeBalanceFormatted(nativeBalance.balanceFormatted || '0.00');
      setNativePrice(nativeTokenPrice?.usd || 0);
      setNativePriceChange(nativeTokenPrice?.usd_24h_change || 0);

      await loadTokens(currentNetwork.chainId as any);
      await loadBalances(currentWallet.address, currentNetwork.chainId as any);
      await loadPrices(tokens.map((t) => t.symbol));
    } catch (error) {
      console.error('加载数据失败:', error);
      Alert.alert('错误', '加载资产失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [currentWallet, currentNetwork, tokens]);

  useEffect(() => {
    loadWallets();
    initNetwork();
    initTokens();
  }, []);

  useEffect(() => {
    if (currentWallet) {
      loadData();
    }
  }, [currentWallet, currentNetwork]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallets();
    await loadData();
    setRefreshing(false);
  };

  const quickActions = [
    { label: '接收', icon: '↓', route: 'Receive' as const },
    { label: '发送', icon: '↑', route: 'Send' as const },
    { label: '兑换', icon: '⇄', route: 'Swap' as const },
    { label: '资产', icon: '◉', route: 'Tokens' as const },
    { label: 'dApp', icon: '⧉', route: 'DAppConnections' as const },
    { label: '设置', icon: '⚙', route: 'Settings' as const },
  ];

  if (!currentWallet) {
    return (
      <SafeAreaView style={styles.container}>
        <Atmosphere />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>没有可用钱包</Text>
          <Text style={styles.emptySubtext}>请先创建或导入钱包，然后回来查看资产总览。</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Atmosphere />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Card style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.overline}>Portfolio</Text>
              <Text style={styles.walletName}>{currentWallet.name}</Text>
            </View>
            <TouchableOpacity style={styles.networkPill} onPress={() => navigation.navigate('Networks')}>
              <View style={styles.networkDot} />
              <Text style={styles.networkText}>{currentNetwork.name}</Text>
            </TouchableOpacity>
          </View>

          <AddressDisplay address={currentWallet.address} />

          <View style={styles.totalWrap}>
            <Text style={styles.totalLabel}>总资产估值</Text>
            <Text style={styles.totalValue}>${loading ? '0.00' : totalValue.toFixed(2)}</Text>
            <Text
              style={[
                styles.changeText,
                { color: PriceService.getPriceChangeColor(nativePriceChange) },
              ]}
            >
              {nativePriceChange ? `今日 ${PriceService.formatPriceChange(nativePriceChange)}` : '今日 --'}
            </Text>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>快速操作</Text>
          <TouchableOpacity onPress={() => navigation.navigate('GlobalSearch')}>
            <Text style={styles.link}>搜索</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionItem}
              onPress={() => navigation.navigate(action.route as any, action.route === 'Send' ? {} : undefined)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>资产概览</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tokens')}>
            <Text style={styles.link}>全部资产</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.assetCard}>
          <View style={styles.assetRow}>
            <View style={styles.assetBadge}><Text style={styles.assetBadgeText}>{currentNetwork.symbol.slice(0, 1)}</Text></View>
            <View style={styles.assetInfo}>
              <Text style={styles.assetName}>{currentNetwork.symbol}</Text>
              <Text style={styles.assetMeta}>主链资产</Text>
            </View>
            <View style={styles.assetRight}>
              <Text style={styles.assetAmount}>{Number(nativeBalanceFormatted).toFixed(4)}</Text>
              <Text style={styles.assetUsd}>${(Number(nativeBalanceFormatted) * nativePrice).toFixed(2)}</Text>
            </View>
          </View>

          {visibleTokens.slice(0, 4).map((token) => {
            const balance = balances[token.address.toLowerCase()];
            const price = prices[token.symbol] || 0;
            const amount = Number(balance?.balanceFormatted || '0');
            const usd = amount * price;
            return (
              <View key={token.address} style={styles.assetRow}>
                <View style={styles.assetBadge}><Text style={styles.assetBadgeText}>{token.symbol.slice(0, 1)}</Text></View>
                <View style={styles.assetInfo}>
                  <Text style={styles.assetName}>{token.symbol}</Text>
                  <Text style={styles.assetMeta}>{token.name}</Text>
                </View>
                <View style={styles.assetRight}>
                  <Text style={styles.assetAmount}>{amount.toFixed(4)}</Text>
                  <Text style={styles.assetUsd}>${usd.toFixed(2)}</Text>
                </View>
              </View>
            );
          })}
        </Card>
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
      paddingBottom: spacing.xxl,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    emptyTitle: {
      ...typography.h2,
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    emptySubtext: {
      ...typography.body,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    heroCard: {
      padding: spacing.lg,
      marginBottom: spacing.lg,
      backgroundColor: colors.surface,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    overline: {
      ...typography.overline,
      color: colors.text.secondary,
      marginBottom: 2,
    },
    walletName: {
      ...typography.h3,
      color: colors.text.primary,
    },
    networkPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 100,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      gap: spacing.xs,
    },
    networkDot: {
      width: 7,
      height: 7,
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    networkText: {
      ...typography.caption,
      color: colors.text.secondary,
    },
    totalWrap: {
      marginTop: spacing.md,
    },
    totalLabel: {
      ...typography.caption,
      color: colors.text.secondary,
      marginBottom: 4,
    },
    totalValue: {
      ...typography.h1,
      color: colors.text.primary,
    },
    changeText: {
      ...typography.captionMedium,
      marginTop: 6,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    sectionTitle: {
      ...typography.h4,
      color: colors.text.primary,
    },
    link: {
      ...typography.captionMedium,
      color: colors.primary,
    },
    actionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    actionItem: {
      width: '31%',
      minHeight: 90,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    actionIcon: {
      ...typography.h3,
      color: colors.primary,
    },
    actionLabel: {
      ...typography.captionMedium,
      color: colors.text.primary,
    },
    assetCard: {
      padding: spacing.md,
    },
    assetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    assetBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    assetBadgeText: {
      ...typography.captionMedium,
      color: colors.text.primary,
    },
    assetInfo: {
      flex: 1,
    },
    assetName: {
      ...typography.bodyBold,
      color: colors.text.primary,
    },
    assetMeta: {
      ...typography.caption,
      color: colors.text.secondary,
    },
    assetRight: {
      alignItems: 'flex-end',
    },
    assetAmount: {
      ...typography.bodyMedium,
      color: colors.text.primary,
    },
    assetUsd: {
      ...typography.caption,
      color: colors.text.secondary,
    },
  });
