/**
 * 主页面 - 参考 Rabby Wallet 设计
 * 显示钱包余额、资产列表、快捷操作
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { MainScreenNavigationProp } from "@/types/navigation.types";
import { colors, typography, spacing } from "@/theme";
import { Card } from "@components/common/Card";
import { Button } from "@components/common/Button";
import { AddressDisplay } from "@components/wallet/AddressDisplay";
import { useWalletStore } from "@store/walletStore";
import { useNetworkStore } from "@store/networkStore";
import { useTokenStore } from "@store/tokenStore";
import { formatBalance } from "@utils/format";
import { TokenService } from "@/services/TokenService";
import { PriceService } from "@/services/PriceService";
import { ChainId } from "@/types/network.types";

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp<"Home">>();
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
  const [balance, setBalance] = useState("0");
  const [balanceFormatted, setBalanceFormatted] = useState("0.00");
  const [loading, setLoading] = useState(false);
  const [nativePrice, setNativePrice] = useState(0);
  const [nativePriceChange, setNativePriceChange] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  // 加载余额和代币
  const loadData = useCallback(async () => {
    if (!currentWallet) return;

    try {
      setLoading(true);

      // 加载原生代币余额
      const nativeBalance = await TokenService.getNativeBalance(
        currentWallet.address,
        currentNetwork.chainId as any
      );
      setBalance(nativeBalance.balance || "0");
      setBalanceFormatted(nativeBalance.balanceFormatted || "0.00");

      // 加载原生代币价格
      const price = await PriceService.getPrice(currentNetwork.symbol);
      if (price) {
        setNativePrice(price.usd);
        setNativePriceChange(price.usd_24h_change);
      }

      // 加载代币列表
      await loadTokens(currentNetwork.chainId as any);
      await loadBalances(currentWallet.address, currentNetwork.chainId as any);

      // 加载代币价格
      const tokenSymbols = tokens.map(t => t.symbol);
      await loadPrices([currentNetwork.symbol, ...tokenSymbols]);

      // 计算总价值
      let total = price
        ? PriceService.calculateValue(nativeBalance.balanceFormatted || "0", price.usd)
        : 0;

      tokens.forEach(token => {
        const tokenBalance = balances[token.address.toLowerCase()];
        const tokenPrice = prices[token.symbol];
        if (tokenBalance && tokenPrice) {
          total += PriceService.calculateValue(
            tokenBalance.balanceFormatted,
            tokenPrice
          );
        }
      });

      setTotalValue(total);
    } catch (error) {
      console.error("加载数据失败:", error);
      Alert.alert("错误", "加载数据失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  }, [currentWallet, currentNetwork, tokens, balances, prices]);

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

  if (!currentWallet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无钱包</Text>
          <Text style={styles.emptySubtext}>请先创建或导入钱包</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 过滤隐藏的代币
  const visibleTokens = tokens.filter(
    t => !hiddenTokens.includes(t.address.toLowerCase())
  );

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
        {/* 钱包信息卡片 */}
        <Card style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletName}>{currentWallet.name}</Text>
            <TouchableOpacity
              style={styles.networkBadge}
              onPress={() => navigation.navigate("Networks")}
            >
              <View style={styles.networkDot} />
              <Text style={styles.networkText}>{currentNetwork.name}</Text>
            </TouchableOpacity>
          </View>

          <AddressDisplay
            address={currentWallet.address}
          />

          {/* 余额显示 */}
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>总资产</Text>
            <Text style={styles.balanceAmount}>
              ${loading ? "0.00" : totalValue.toFixed(2)}
            </Text>
            {nativePriceChange !== 0 && (
              <Text
                style={[
                  styles.priceChange,
                  { color: PriceService.getPriceChangeColor(nativePriceChange) },
                ]}
              >
                {PriceService.formatPriceChange(nativePriceChange)}
              </Text>
            )}
          </View>

          {/* 快捷操作 */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Receive")}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.status.success }]}>
                <Text style={styles.actionIconText}>↓</Text>
              </View>
              <Text style={styles.actionText}>接收</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Send", {})}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                <Text style={styles.actionIconText}>↑</Text>
              </View>
              <Text style={styles.actionText}>发送</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Swap")}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.accent }]}>
                <Text style={styles.actionIconText}>⇄</Text>
              </View>
              <Text style={styles.actionText}>兑换</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("NFTList")}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.secondary }]}>
                <Text style={styles.actionIconText}>🖼</Text>
              </View>
              <Text style={styles.actionText}>NFT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("DeFi")}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.warning }]}>
                <Text style={styles.actionIconText}>💰</Text>
              </View>
              <Text style={styles.actionText}>DeFi</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* 资产列表 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>资产</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Tokens")}>
              <Text style={styles.sectionLink}>管理</Text>
            </TouchableOpacity>
          </View>

          {/* 原生代币 */}
          <Card style={styles.assetCard}>
            <View style={styles.assetItem}>
              <View style={styles.assetIcon}>
                <Text style={styles.assetIconText}>
                  {currentNetwork.symbol.substring(0, 1)}
                </Text>
              </View>
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>{currentNetwork.name}</Text>
                <Text style={styles.assetSymbol}>{currentNetwork.symbol}</Text>
                {nativePrice > 0 && (
                  <Text style={styles.assetPrice}>
                    ${PriceService.formatPrice(nativePrice)}
                  </Text>
                )}
              </View>
              <View style={styles.assetBalance}>
                <Text style={styles.assetAmount}>
                  {loading ? "..." : parseFloat(balanceFormatted).toFixed(4)}
                </Text>
                {nativePrice > 0 && (
                  <Text style={styles.assetValue}>
                    ${(parseFloat(balanceFormatted) * nativePrice).toFixed(2)}
                  </Text>
                )}
              </View>
            </View>

            {/* ERC-20 代币 */}
            {visibleTokens.slice(0, 3).map(token => {
              const tokenBalance = balances[token.address.toLowerCase()];
              const tokenPrice = prices[token.symbol];
              const value =
                tokenBalance && tokenPrice
                  ? parseFloat(tokenBalance.balanceFormatted) * tokenPrice
                  : 0;

              return (
                <View key={token.address} style={styles.assetItem}>
                  <View style={styles.assetIcon}>
                    <Text style={styles.assetIconText}>
                      {token.symbol.substring(0, 1)}
                    </Text>
                  </View>
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetName}>{token.name}</Text>
                    <Text style={styles.assetSymbol}>{token.symbol}</Text>
                    {tokenPrice && (
                      <Text style={styles.assetPrice}>
                        ${PriceService.formatPrice(tokenPrice)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.assetBalance}>
                    <Text style={styles.assetAmount}>
                      {tokenBalance ? tokenBalance.balanceFormatted : "0.00"}
                    </Text>
                    {value > 0 && (
                      <Text style={styles.assetValue}>${value.toFixed(2)}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </Card>
        </View>

        {/* 最近交易 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近交易</Text>
            <TouchableOpacity onPress={() => navigation.navigate("TransactionHistory")}>
              <Text style={styles.sectionLink}>查看全部</Text>
            </TouchableOpacity>
          </View>
          <Card style={styles.transactionCard}>
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyTransactionsText}>暂无交易记录</Text>
            </View>
          </Card>
        </View>

        {/* 更多功能 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>更多功能</Text>
          <Card style={styles.moreCard}>
            <TouchableOpacity
              style={styles.moreItem}
              onPress={() => navigation.navigate("Portfolio")}
            >
              <Text style={styles.moreIcon}>📊</Text>
              <Text style={styles.moreText}>投资组合</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreItem}
              onPress={() => navigation.navigate("DAppConnections")}
            >
              <Text style={styles.moreIcon}>🔗</Text>
              <Text style={styles.moreText}>dApp 连接</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreItem}
              onPress={() => navigation.navigate("HardwareWallet")}
            >
              <Text style={styles.moreIcon}>🔐</Text>
              <Text style={styles.moreText}>硬件钱包</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreItem}
              onPress={() => navigation.navigate("Settings")}
            >
              <Text style={styles.moreIcon}>⚙️</Text>
              <Text style={styles.moreText}>设置</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.secondary,
  },
  walletCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  walletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  walletName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  networkBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.status.success,
    marginRight: spacing.xs,
  },
  networkText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  address: {
    marginBottom: spacing.lg,
  },
  balanceContainer: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  balanceUsd: {
    ...typography.body,
    color: colors.text.secondary,
  },
  priceChange: {
    ...typography.caption,
    marginTop: spacing.xs,
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    alignItems: "center",
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  actionIconText: {
    fontSize: 24,
    color: colors.text.primary,
  },
  actionText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  sectionLink: {
    ...typography.caption,
    color: colors.primary,
  },
  assetCard: {
    padding: spacing.md,
  },
  assetItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  assetIconText: {
    fontSize: 20,
    color: colors.text.primary,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: 2,
  },
  assetSymbol: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  assetPrice: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  assetBalance: {
    alignItems: "flex-end",
  },
  assetAmount: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: 2,
  },
  assetValue: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  transactionCard: {
    padding: spacing.lg,
  },
  emptyTransactions: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  emptyTransactionsText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  moreCard: {
    padding: spacing.md,
  },
  moreItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  moreIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  moreText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  arrow: {
    ...typography.h4,
    color: colors.text.secondary,
  },
});
