/**
 * 代币列表界面
 * 显示所有代币、余额、价格和价值
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { MainScreenNavigationProp } from "@/types/navigation.types";
import { typography, spacing } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import { Card } from "@components/common/Card";
import { Button } from "@components/common/Button";
import { useTokenStore } from "@store/tokenStore";
import { useNetworkStore } from "@store/networkStore";
import { useWalletStore } from "@store/walletStore";
import { formatBalance } from "@utils/format";
import { PriceService } from "@/services/PriceService";

export const TokensScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp<"Home">>();
  const { currentWallet } = useWalletStore();
  const { currentNetwork } = useNetworkStore();
  const {
    tokens,
    balances,
    prices,
    hiddenTokens,
    loadTokens,
    loadBalances,
    loadPrices,
    refreshAll,
    hideToken,
    showToken,
  } = useTokenStore();
  const { theme: colors } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const styles = createStyles(colors);

  useEffect(() => {
    if (currentWallet) {
      loadData();
    }
  }, [currentWallet, currentNetwork]);

  const loadData = async () => {
    if (!currentWallet) return;

    try {
      await loadTokens(currentNetwork.chainId as any);
      await loadBalances(currentWallet.address, currentNetwork.chainId as any);

      const symbols = tokens.map(t => t.symbol);
      await loadPrices(symbols);
    } catch (error) {
      console.error("加载代币数据失败:", error);
    }
  };

  const handleRefresh = async () => {
    if (!currentWallet) return;

    try {
      setRefreshing(true);
      await refreshAll(currentWallet.address, currentNetwork.chainId as any);
    } catch (error) {
      Alert.alert("错误", "刷新失败");
    } finally {
      setRefreshing(false);
    }
  };

  const handleHideToken = async (address: string) => {
    Alert.alert("隐藏代币", "确定要隐藏这个代币吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "隐藏",
        onPress: async () => {
          try {
            await hideToken(address);
          } catch (error) {
            Alert.alert("错误", "隐藏代币失败");
          }
        },
      },
    ]);
  };

  const handleShowToken = async (address: string) => {
    try {
      await showToken(address);
    } catch (error) {
      Alert.alert("错误", "显示代币失败");
    }
  };

  const visibleTokens = tokens.filter(
    t => !hiddenTokens.includes(t.address.toLowerCase())
  );

  const hiddenTokensList = tokens.filter(t =>
    hiddenTokens.includes(t.address.toLowerCase())
  );

  const displayTokens = showHidden ? hiddenTokensList : visibleTokens;

  const renderToken = ({ item }: { item: any }) => {
    const balance = balances[item.address.toLowerCase()];
    const price = prices[item.symbol];
    const value = balance && price
      ? parseFloat(balance.balanceFormatted) * price
      : 0;

    return (
      <TouchableOpacity
        style={styles.tokenItem}
        onLongPress={() =>
          showHidden
            ? handleShowToken(item.address)
            : handleHideToken(item.address)
        }
      >
        <View style={styles.tokenLeft}>
          <View style={styles.tokenIcon}>
            <Text style={styles.tokenIconText}>
              {item.symbol.substring(0, 1)}
            </Text>
          </View>
          <View style={styles.tokenInfo}>
            <Text style={styles.tokenName}>{item.name}</Text>
            <Text style={styles.tokenSymbol}>{item.symbol}</Text>
            {price && (
              <Text style={styles.tokenPrice}>
                ${PriceService.formatPrice(price)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.tokenRight}>
          <Text style={styles.tokenBalance}>
            {balance ? balance.balanceFormatted : "0.00"}
          </Text>
          {value > 0 && (
            <Text style={styles.tokenValue}>
              ${value.toFixed(2)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {showHidden ? "隐藏的代币" : "我的代币"}
          </Text>
          <TouchableOpacity onPress={() => setShowHidden(!showHidden)}>
            <Text style={styles.toggleText}>
              {showHidden ? "显示全部" : "显示隐藏"}
            </Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.tokenList}>
          <FlatList
            data={displayTokens}
            renderItem={renderToken}
            keyExtractor={item => `${item.chainId}-${item.address}`}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {showHidden ? "没有隐藏的代币" : "没有代币"}
                </Text>
              </View>
            }
          />
        </Card>

        <Button
          title="添加自定义代币"
          onPress={() => (navigation as any).navigate("AddToken")}
          variant="secondary"
          style={styles.addButton}
        />

        <Text style={styles.hint}>
          长按代币可以隐藏/显示
        </Text>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  toggleText: {
    ...typography.body,
    color: colors.primary,
  },
  tokenList: {
    flex: 1,
    padding: 0,
    marginBottom: spacing.md,
  },
  tokenItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tokenLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  tokenIconText: {
    ...typography.h4,
    color: colors.primary,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    ...typography.bodyBold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  tokenSymbol: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  tokenPrice: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  tokenRight: {
    alignItems: "flex-end",
  },
  tokenBalance: {
    ...typography.bodyBold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  tokenValue: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  addButton: {
    marginBottom: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: "center",
  },
});