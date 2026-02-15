/**
 * 交易历史界面
 * 显示钱包的所有交易记录
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing } from "@/theme";
import { Card } from "@components/common/Card";
import { useWalletStore } from "@store/walletStore";
import { EtherscanService } from "@/services/EtherscanService";
import { ChainId } from "@/types/network.types";
import { Transaction, TransactionType, TransactionStatus } from "@/types/transaction.types";
import { ethers } from "ethers";

export const TransactionHistoryScreen: React.FC = () => {
  const { currentWallet } = useWalletStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    if (!currentWallet) return;

    try {
      setLoading(true);
      const txs = await EtherscanService.getAllTransactions(
        currentWallet.address,
        ChainId.ETHEREUM,
        1,
        50
      );
      setTransactions(txs);
    } catch (error) {
      console.error("加载交易历史失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} 分钟前`;
      }
      return `${hours} 小时前`;
    } else if (days === 1) {
      return "昨天";
    } else if (days < 7) {
      return `${days} 天前`;
    } else {
      return date.toLocaleDateString("zh-CN");
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isReceive = item.type === TransactionType.RECEIVE;
    const amount = ethers.formatEther(item.value);
    const address = isReceive ? item.from : item.to;

    return (
      <TouchableOpacity style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.transactionIcon,
              {
                backgroundColor: isReceive
                  ? colors.status.success + "20"
                  : colors.primary + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.transactionIconText,
                {
                  color: isReceive ? colors.status.success : colors.primary,
                },
              ]}
            >
              {isReceive ? "↓" : "↑"}
            </Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionType}>
              {isReceive ? "接收" : "发送"}
            </Text>
            <Text style={styles.transactionAddress} numberOfLines={1}>
              {address.substring(0, 10)}...{address.substring(address.length - 8)}
            </Text>
            <Text style={styles.transactionTime}>{formatDate(item.timestamp)}</Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text
            style={[
              styles.transactionAmount,
              {
                color: isReceive ? colors.status.success : colors.text.primary,
              },
            ]}
          >
            {isReceive ? "+" : "-"}{parseFloat(amount).toFixed(4)} ETH
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === TransactionStatus.CONFIRMED
                    ? colors.status.success + "20"
                    : item.status === TransactionStatus.PENDING
                    ? colors.warning + "20"
                    : colors.status.error + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    item.status === TransactionStatus.CONFIRMED
                      ? colors.status.success
                      : item.status === TransactionStatus.PENDING
                      ? colors.warning
                      : colors.status.error,
                },
              ]}
            >
              {item.status === TransactionStatus.CONFIRMED
                ? "已确认"
                : item.status === TransactionStatus.PENDING
                ? "待确认"
                : "失败"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
      {loading && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>加载交易历史...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无交易记录</Text>
          <Text style={styles.emptySubtext}>
            发送或接收资产后，交易记录将显示在这里
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.hash}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: "center",
  },
  list: {
    padding: spacing.md,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  transactionIconText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    ...typography.bodyBold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  transactionAddress: {
    ...typography.caption,
    color: colors.text.secondary,
    fontFamily: "monospace",
    marginBottom: 2,
  },
  transactionTime: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    ...typography.bodyBold,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    ...typography.caption,
    fontSize: 10,
  },
});
