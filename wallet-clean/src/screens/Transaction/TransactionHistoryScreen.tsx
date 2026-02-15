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
import { typography, spacing } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import { Card } from "@components/common/Card";
import { useWalletStore } from "@store/walletStore";
import { EtherscanService } from "@/services/EtherscanService";
import { ChainId } from "@/types/network.types";
import { Transaction, TransactionType, TransactionStatus } from "@/types/transaction.types";
import { ethers } from "ethers";

export const TransactionHistoryScreen: React.FC = () => {
  const { currentWallet } = useWalletStore();
  const { theme: colors } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const styles = createStyles(colors);

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

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.SEND:
        return "↑";
      case TransactionType.RECEIVE:
        return "↓";
      case TransactionType.CONTRACT:
        return "⚙";
      case TransactionType.APPROVE:
        return "⇄";
      default:
        return "•";
    }
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.SEND:
        return colors.status.error;
      case TransactionType.RECEIVE:
        return colors.status.success;
      case TransactionType.CONTRACT:
        return colors.warning;
      case TransactionType.APPROVE:
        return colors.primary;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.CONFIRMED:
        return colors.status.success;
      case TransactionStatus.PENDING:
        return colors.warning;
      case TransactionStatus.FAILED:
        return colors.status.error;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusText = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.CONFIRMED:
        return "已确认";
      case TransactionStatus.PENDING:
        return "待确认";
      case TransactionStatus.FAILED:
        return "失败";
      default:
        return "未知";
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isOutgoing = item.type === TransactionType.SEND;
    const amount = ethers.formatEther(item.value);
    const amountColor = isOutgoing ? colors.status.error : colors.status.success;
    const amountPrefix = isOutgoing ? "-" : "+";

    return (
      <TouchableOpacity
        onPress={() => {
          // TODO: 打开交易详情
        }}
      >
        <Card style={styles.transactionCard}>
          <View
            style={[
              styles.transactionIcon,
              { backgroundColor: getTransactionColor(item.type) + "20" },
            ]}
          >
            <Text
              style={[
                styles.transactionIconText,
                { color: getTransactionColor(item.type) },
              ]}
            >
              {getTransactionIcon(item.type)}
            </Text>
          </View>

          <View style={styles.transactionInfo}>
            <Text style={styles.transactionType}>
              {item.type === TransactionType.SEND && "发送"}
              {item.type === TransactionType.RECEIVE && "接收"}
              {item.type === TransactionType.CONTRACT && "合约交互"}
              {item.type === TransactionType.APPROVE && "授权"}
            </Text>
            <Text style={styles.transactionAddress} numberOfLines={1}>
              {isOutgoing ? `到: ${item.to}` : `从: ${item.from}`}
            </Text>
            <Text style={styles.transactionTime}>
              {formatDate(item.timestamp)}
            </Text>
          </View>

          <View style={styles.transactionRight}>
            <Text style={[styles.transactionAmount, { color: amountColor }]}>
              {amountPrefix}
              {amount} ETH
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
        </Card>
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

  if (loading && transactions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.hash}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无交易记录</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    marginBottom: spacing.md,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
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
});
