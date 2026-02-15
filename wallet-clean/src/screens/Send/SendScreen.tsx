/**
 * 发送交易界面
 * 支持发送 ETH 和 ERC-20 代币
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { MainScreenNavigationProp } from "@/types/navigation.types";
import { colors, typography, spacing } from "@/theme";
import { Card } from "@components/common/Card";
import { Button } from "@components/common/Button";
import { Input } from "@components/common/Input";
import { useWalletStore } from "@store/walletStore";
import { TransactionService } from "@/services/TransactionService";
import { TokenService } from "@/services/TokenService";
import { ChainId } from "@/types/network.types";
import { isValidAddress } from "@utils/validation";
import { ethers } from "ethers";

export const SendScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp<"Send">>();
  const { currentWallet } = useWalletStore();

  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<any>(null);
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    if (!currentWallet) return;

    try {
      const nativeBalance = await TokenService.getNativeBalance(
        currentWallet.address,
        ChainId.ETHEREUM
      );
      setBalance(nativeBalance.balanceFormatted || "0");
    } catch (error) {
      console.error("加载余额失败:", error);
    }
  };

  const handleEstimateGas = async () => {
    if (!currentWallet || !toAddress || !amount) return;

    if (!isValidAddress(toAddress)) {
      Alert.alert("错误", "接收地址格式不正确");
      return;
    }

    try {
      setEstimating(true);
      const valueWei = ethers.parseEther(amount).toString();

      const estimate = await TransactionService.estimateGas(
        {
          from: currentWallet.address,
          to: toAddress,
          value: valueWei,
        },
        ChainId.ETHEREUM
      );

      setGasEstimate(estimate);
    } catch (error) {
      console.error("估算 Gas 失败:", error);
      Alert.alert("错误", "估算 Gas 费用失败");
    } finally {
      setEstimating(false);
    }
  };

  useEffect(() => {
    if (toAddress && amount && isValidAddress(toAddress)) {
      handleEstimateGas();
    }
  }, [toAddress, amount]);

  const handleSend = async () => {
    if (!currentWallet) {
      Alert.alert("错误", "请先创建或导入钱包");
      return;
    }

    if (!toAddress || !amount) {
      Alert.alert("错误", "请填写完整信息");
      return;
    }

    if (!isValidAddress(toAddress)) {
      Alert.alert("错误", "接收地址格式不正确");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("错误", "金额必须大于 0");
      return;
    }

    if (amountNum > parseFloat(balance)) {
      Alert.alert("错误", "余额不足");
      return;
    }

    Alert.alert(
      "确认发送",
      `发送 ${amount} ETH 到\n${toAddress}\n\nGas 费用: ${gasEstimate?.estimatedFee || "未知"} ETH`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "确认",
          onPress: async () => {
            try {
              setLoading(true);
              const valueWei = ethers.parseEther(amount).toString();

              const txHash = await TransactionService.sendTransaction(
                {
                  from: currentWallet.address,
                  to: toAddress,
                  value: valueWei,
                },
                currentWallet.id,
                ChainId.ETHEREUM
              );

              Alert.alert(
                "交易已发送",
                `交易哈希: ${txHash.substring(0, 10)}...`,
                [
                  {
                    text: "确定",
                    onPress: () => navigation.goBack(),
                  },
                ]
              );

              // 在后台等待确认
              TransactionService.waitForTransaction(txHash, 1, ChainId.ETHEREUM)
                .then(() => {
                  console.log("交易已确认");
                })
                .catch((error) => {
                  console.error("交易确认失败:", error);
                });
            } catch (error: any) {
              Alert.alert("错误", error.message || "发送交易失败");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSetMax = () => {
    if (gasEstimate) {
      const maxAmount = Math.max(
        0,
        parseFloat(balance) - parseFloat(gasEstimate.estimatedFee)
      );
      setAmount(maxAmount.toFixed(6));
    } else {
      setAmount(balance);
    }
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
      <ScrollView contentContainerStyle={styles.content}>
        {/* 余额显示 */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>可用余额</Text>
          <Text style={styles.balanceAmount}>{balance} ETH</Text>
        </Card>

        {/* 接收地址 */}
        <View style={styles.section}>
          <Text style={styles.label}>接收地址</Text>
          <Input
            placeholder="0x..."
            value={toAddress}
            onChangeText={setToAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* 金额 */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>金额</Text>
            <Button
              title="最大"
              onPress={handleSetMax}
              variant="secondary"
              style={styles.maxButton}
            />
          </View>
          <Input
            placeholder="0.0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Gas 费用 */}
        {gasEstimate && (
          <Card style={styles.gasCard}>
            <View style={styles.gasRow}>
              <Text style={styles.gasLabel}>Gas 限制</Text>
              <Text style={styles.gasValue}>{gasEstimate.gasLimit}</Text>
            </View>
            <View style={styles.gasRow}>
              <Text style={styles.gasLabel}>最大费用</Text>
              <Text style={styles.gasValue}>
                {parseFloat(
                  ethers.formatUnits(gasEstimate.maxFeePerGas, "gwei")
                ).toFixed(2)}{" "}
                Gwei
              </Text>
            </View>
            <View style={styles.gasRow}>
              <Text style={styles.gasLabel}>优先费用</Text>
              <Text style={styles.gasValue}>
                {parseFloat(
                  ethers.formatUnits(gasEstimate.maxPriorityFeePerGas, "gwei")
                ).toFixed(2)}{" "}
                Gwei
              </Text>
            </View>
            <View style={[styles.gasRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>预估总费用</Text>
              <Text style={styles.totalValue}>
                {parseFloat(gasEstimate.estimatedFee).toFixed(6)} ETH
              </Text>
            </View>
          </Card>
        )}

        {estimating && (
          <View style={styles.estimatingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.estimatingText}>估算 Gas 费用中...</Text>
          </View>
        )}

        {/* 发送按钮 */}
        <Button
          title={loading ? "发送中..." : "发送"}
          onPress={handleSend}
          disabled={loading || estimating || !gasEstimate}
          style={styles.sendButton}
        />

        {/* 提示信息 */}
        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ 注意事项</Text>
          <Text style={styles.warningText}>
            • 请仔细核对接收地址，交易一旦发送无法撤回
          </Text>
          <Text style={styles.warningText}>
            • 确保接收地址支持 Ethereum 网络
          </Text>
          <Text style={styles.warningText}>
            • Gas 费用会从您的余额中扣除
          </Text>
        </Card>
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
    padding: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.secondary,
  },
  balanceCard: {
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    ...typography.h2,
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodyBold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  maxButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  gasCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  gasRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  gasLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  gasValue: {
    ...typography.body,
    color: colors.text.primary,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  totalValue: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  estimatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  estimatingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  sendButton: {
    marginBottom: spacing.lg,
  },
  warningCard: {
    padding: spacing.lg,
    backgroundColor: colors.warning + "10",
    borderColor: colors.warning + "30",
    borderWidth: 1,
  },
  warningTitle: {
    ...typography.bodyBold,
    color: colors.warning,
    marginBottom: spacing.sm,
  },
  warningText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
});
