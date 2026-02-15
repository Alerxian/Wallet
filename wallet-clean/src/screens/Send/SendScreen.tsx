/**
 * 发送界面（重设计）
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { MainScreenNavigationProp } from '@/types/navigation.types';
import { typography, spacing, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Atmosphere } from '@components/common/Atmosphere';
import { ReviewSheet } from '@components/common/ReviewSheet';
import { useWalletStore } from '@store/walletStore';
import { TransactionService } from '@/services/TransactionService';
import { TokenService } from '@/services/TokenService';
import { useNetworkStore } from '@/store/networkStore';
import { isValidAddress } from '@utils/validation';
import { ethers } from 'ethers';

export const SendScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp<'Send'>>();
  const { currentWallet } = useWalletStore();
  const { currentNetwork } = useNetworkStore();
  const { theme: colors } = useTheme();
  const styles = createStyles(colors);

  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<any>(null);
  const [balance, setBalance] = useState('0');
  const [reviewVisible, setReviewVisible] = useState(false);

  useEffect(() => {
    if (currentWallet) {
      TokenService.getNativeBalance(currentWallet.address, currentNetwork.chainId as any)
        .then((b) => setBalance(b.balanceFormatted || '0'))
        .catch(() => setBalance('0'));
    }
  }, [currentWallet?.id, currentNetwork.chainId]);

  const handleEstimateGas = async () => {
    if (!currentWallet || !toAddress || !amount) return;
    if (!isValidAddress(toAddress)) return;

    try {
      setEstimating(true);
      const valueWei = ethers.parseEther(amount).toString();
      const estimate = await TransactionService.estimateGas(
        {
          from: currentWallet.address,
          to: toAddress,
          value: valueWei,
        },
        currentNetwork.chainId as any
      );
      setGasEstimate(estimate);
    } catch (error) {
      console.error('估算 Gas 失败:', error);
      setGasEstimate(null);
    } finally {
      setEstimating(false);
    }
  };

  useEffect(() => {
    if (toAddress && amount && isValidAddress(toAddress)) {
      const timer = setTimeout(() => {
        handleEstimateGas();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [toAddress, amount]);

  const submitSend = async () => {
    if (!currentWallet) return;
    try {
      setLoading(true);
      const txHash = await TransactionService.sendTransaction(
        {
          from: currentWallet.address,
          to: toAddress,
          value: ethers.parseEther(amount).toString(),
        },
        currentWallet.id,
        currentNetwork.chainId as any
      );

      setReviewVisible(false);
      Alert.alert('交易已发送', `交易哈希: ${txHash.slice(0, 10)}...`, [
        { text: '好的', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('错误', error?.message || '发送交易失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!currentWallet) {
      Alert.alert('错误', '请先创建或导入钱包');
      return;
    }

    if (!toAddress || !amount) {
      Alert.alert('错误', '请填写完整信息');
      return;
    }

    if (!isValidAddress(toAddress)) {
      Alert.alert('错误', '接收地址格式不正确');
      return;
    }

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      Alert.alert('错误', '金额必须大于 0');
      return;
    }

    if (amountNum > Number(balance)) {
      Alert.alert('错误', '余额不足');
      return;
    }

    setReviewVisible(true);
  };

  const handleSetMax = () => {
    const b = Number(balance);
    if (!Number.isFinite(b) || b <= 0) return;
    if (gasEstimate?.estimatedFee) {
      const max = Math.max(0, b - Number(gasEstimate.estimatedFee));
      setAmount(max.toFixed(6));
      return;
    }
    setAmount(String(b));
  };

  if (!currentWallet) {
    return (
      <SafeAreaView style={styles.container}>
        <Atmosphere />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>暂无钱包</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Atmosphere />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>发送资产</Text>
          <Text style={styles.heroSubtitle}>链上转账不可撤销，请在发送前核对地址和网络。</Text>
        </View>

        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>可用余额</Text>
          <Text style={styles.balanceAmount}>{Number(balance).toFixed(6)} {currentNetwork.symbol}</Text>
        </Card>

        <Card style={styles.formCard}>
          <Input
            label="接收地址"
            placeholder="0x..."
            value={toAddress}
            onChangeText={setToAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>发送金额</Text>
            <Button title="最大" size="small" variant="secondary" onPress={handleSetMax} />
          </View>

          <Input
            placeholder="0.0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          {estimating && (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.inlineLoadingText}>正在估算网络费用...</Text>
            </View>
          )}
        </Card>

        {gasEstimate && (
          <Card style={styles.feeCard}>
            <Text style={styles.feeTitle}>费用预览</Text>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Gas 限制</Text>
              <Text style={styles.feeValue}>{gasEstimate.gasLimit}</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>优先费</Text>
              <Text style={styles.feeValue}>{Number(ethers.formatUnits(gasEstimate.maxPriorityFeePerGas, 'gwei')).toFixed(2)} Gwei</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>预估总费</Text>
              <Text style={styles.feeValueStrong}>{Number(gasEstimate.estimatedFee).toFixed(6)} {currentNetwork.symbol}</Text>
            </View>
          </Card>
        )}

        <Button
          title={loading ? '发送中...' : '预览并发送'}
          onPress={handleSend}
          disabled={loading || estimating || !amount || !toAddress}
          style={styles.sendButton}
        />
      </ScrollView>

      <ReviewSheet
        visible={reviewVisible}
        title="确认发送交易"
        subtitle="请在链上广播前再次核对关键信息"
        rows={[
          { label: '网络', value: currentNetwork.name },
          { label: '金额', value: `${amount || '0'} ${currentNetwork.symbol}` },
          { label: '接收地址', value: `${toAddress.slice(0, 8)}...${toAddress.slice(-6)}` },
          {
            label: '预计 Gas',
            value: `${Number(gasEstimate?.estimatedFee || 0).toFixed(6)} ${currentNetwork.symbol}`,
            tone: 'warning',
          },
          {
            label: '总扣减',
            value: `${(Number(amount || 0) + Number(gasEstimate?.estimatedFee || 0)).toFixed(6)} ${currentNetwork.symbol}`,
          },
        ]}
        confirmText="确认发送"
        onCancel={() => setReviewVisible(false)}
        onConfirm={submitSend}
        loading={loading}
      />
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
      gap: spacing.md,
    },
    hero: {
      marginTop: spacing.xs,
    },
    heroTitle: {
      ...typography.h2,
      color: colors.text.primary,
      marginBottom: 2,
    },
    heroSubtitle: {
      ...typography.body,
      color: colors.text.secondary,
    },
    balanceCard: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    balanceLabel: {
      ...typography.caption,
      color: colors.text.secondary,
      marginBottom: 6,
    },
    balanceAmount: {
      ...typography.h3,
      color: colors.text.primary,
    },
    formCard: {
      padding: spacing.md,
    },
    amountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    amountLabel: {
      ...typography.bodyBold,
      color: colors.text.primary,
    },
    inlineLoading: {
      marginTop: spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    inlineLoadingText: {
      ...typography.caption,
      color: colors.text.secondary,
    },
    feeCard: {
      padding: spacing.md,
    },
    feeTitle: {
      ...typography.bodyBold,
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    feeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    feeLabel: {
      ...typography.caption,
      color: colors.text.secondary,
    },
    feeValue: {
      ...typography.captionMedium,
      color: colors.text.primary,
    },
    feeValueStrong: {
      ...typography.bodyBold,
      color: colors.primary,
    },
    sendButton: {
      marginTop: spacing.xs,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      ...typography.h3,
      color: colors.text.primary,
    },
  });
