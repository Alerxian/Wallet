/**
 * 代币兑换界面
 * 支持代币选择、滑点设置、交易路径展示
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { MainScreenNavigationProp } from '@/types/navigation.types';
import { colors, typography, spacing } from '@/theme';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { useWalletStore } from '@store/walletStore';
import { useNetworkStore } from '@store/networkStore';
import { useTokenStore } from '@store/tokenStore';
import { SwapService, SwapQuote } from '@/services/SwapService';
import { PriceService } from '@/services/PriceService';
import { Token } from '@/types/token.types';
import { ChainId } from '@/types/network.types';

export const SwapScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp<'Swap'>>();
  const { currentWallet } = useWalletStore();
  const { currentNetwork } = useNetworkStore();
  const { tokens, balances, prices } = useTokenStore();

  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5); // 默认 0.5%
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);

  // 获取原生代币作为默认 fromToken
  useEffect(() => {
    if (!fromToken && currentNetwork) {
      const nativeToken: Token = {
        address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // 1inch 原生代币地址
        symbol: currentNetwork.symbol,
        name: currentNetwork.name,
        decimals: 18,
        chainId: currentNetwork.chainId,
      };
      setFromToken(nativeToken);
    }
  }, [currentNetwork]);

  // 获取兑换报价
  const fetchQuote = useCallback(async () => {
    if (!fromToken || !toToken || !fromAmount || !currentWallet) {
      return;
    }

    try {
      setLoading(true);
      const quoteData = await SwapService.getQuote({
        fromToken,
        toToken,
        amount: fromAmount,
        fromAddress: currentWallet.address,
        slippage,
      });

      setQuote(quoteData);
      setToAmount(
        SwapService.formatSwapAmount(quoteData.toAmount, toToken.decimals)
      );
    } catch (error: any) {
      console.error('获取报价失败:', error);
      Alert.alert('错误', error.message || '获取报价失败');
    } finally {
      setLoading(false);
    }
  }, [fromToken, toToken, fromAmount, currentWallet, slippage]);

  // 防抖获取报价
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromAmount && parseFloat(fromAmount) > 0) {
        fetchQuote();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [fromAmount, fromToken, toToken, slippage]);

  // 交换代币位置
  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount('');
    setQuote(null);
  };

  // 执行兑换
  const handleSwap = async () => {
    if (!quote || !currentWallet) {
      Alert.alert('错误', '缺少必要信息');
      return;
    }

    try {
      setLoading(true);

      // 获取完整交易数据
      const swapData = await SwapService.getSwapTransaction({
        fromToken: quote.fromToken,
        toToken: quote.toToken,
        amount: fromAmount,
        fromAddress: currentWallet.address,
        slippage,
      });

      // TODO: 这里需要集成钱包签名功能
      // const txHash = await SwapService.executeSwap(swapData, privateKey);

      Alert.alert('提示', '兑换功能需要集成钱包签名');
    } catch (error: any) {
      console.error('兑换失败:', error);
      Alert.alert('错误', error.message || '兑换失败');
    } finally {
      setLoading(false);
    }
  };

  // 设置最大金额
  const handleSetMax = () => {
    if (!fromToken || !currentWallet) return;

    const balance = balances[fromToken.address.toLowerCase()];
    if (balance) {
      setFromAmount(balance.balanceFormatted);
    }
  };

  // 计算价格影响
  const priceImpact = quote
    ? SwapService.calculatePriceImpact(
        quote.fromAmount,
        quote.toAmount,
        prices[fromToken?.symbol || ''] || 0,
        prices[toToken?.symbol || ''] || 0,
        fromToken?.decimals || 18,
        toToken?.decimals || 18
      )
    : 0;

  // 计算最小接收数量
  const minReceived = quote
    ? SwapService.formatSwapAmount(
        SwapService.calculateMinReceived(
          quote.toAmount,
          slippage,
          toToken?.decimals || 18
        ),
        toToken?.decimals || 18
      )
    : '0';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 兑换卡片 */}
        <Card style={styles.swapCard}>
          {/* From Token */}
          <View style={styles.tokenSection}>
            <Text style={styles.label}>从</Text>
            <View style={styles.tokenInput}>
              <TouchableOpacity
                style={styles.tokenSelector}
                onPress={() => {
                  // TODO: 打开代币选择器
                  Alert.alert('提示', '代币选择功能待实现');
                }}
              >
                <Text style={styles.tokenSymbol}>
                  {fromToken?.symbol || '选择代币'}
                </Text>
                <Text style={styles.arrow}>▼</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.amountInput}
                placeholder="0.0"
                placeholderTextColor={colors.text.secondary}
                keyboardType="decimal-pad"
                value={fromAmount}
                onChangeText={setFromAmount}
              />
            </View>
            <View style={styles.tokenInfo}>
              <Text style={styles.balance}>
                余额:{' '}
                {fromToken && balances[fromToken.address.toLowerCase()]
                  ? balances[fromToken.address.toLowerCase()].balanceFormatted
                  : '0.00'}
              </Text>
              <TouchableOpacity onPress={handleSetMax}>
                <Text style={styles.maxButton}>最大</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 交换按钮 */}
          <TouchableOpacity
            style={styles.swapButton}
            onPress={handleSwapTokens}
          >
            <Text style={styles.swapIcon}>⇅</Text>
          </TouchableOpacity>

          {/* To Token */}
          <View style={styles.tokenSection}>
            <Text style={styles.label}>到</Text>
            <View style={styles.tokenInput}>
              <TouchableOpacity
                style={styles.tokenSelector}
                onPress={() => {
                  // TODO: 打开代币选择器
                  Alert.alert('提示', '代币选择功能待实现');
                }}
              >
                <Text style={styles.tokenSymbol}>
                  {toToken?.symbol || '选择代币'}
                </Text>
                <Text style={styles.arrow}>▼</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.amountInput, styles.amountInputDisabled]}
                placeholder="0.0"
                placeholderTextColor={colors.text.secondary}
                value={toAmount}
                editable={false}
              />
            </View>
            <View style={styles.tokenInfo}>
              <Text style={styles.balance}>
                余额:{' '}
                {toToken && balances[toToken.address.toLowerCase()]
                  ? balances[toToken.address.toLowerCase()].balanceFormatted
                  : '0.00'}
              </Text>
            </View>
          </View>
        </Card>

        {/* 交易详情 */}
        {quote && (
          <Card style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>汇率</Text>
              <Text style={styles.detailValue}>
                1 {fromToken?.symbol} ≈{' '}
                {(
                  parseFloat(toAmount) / parseFloat(fromAmount || '1')
                ).toFixed(6)}{' '}
                {toToken?.symbol}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>价格影响</Text>
              <Text
                style={[
                  styles.detailValue,
                  {
                    color:
                      priceImpact < -1
                        ? colors.status.error
                        : priceImpact < -0.1
                        ? colors.warning
                        : colors.status.success,
                  },
                ]}
              >
                {priceImpact.toFixed(2)}%
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>最小接收</Text>
              <Text style={styles.detailValue}>
                {parseFloat(minReceived).toFixed(6)} {toToken?.symbol}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>预估 Gas</Text>
              <Text style={styles.detailValue}>
                {quote.estimatedGas ? `~${quote.estimatedGas}` : '计算中...'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.slippageRow}
              onPress={() => setShowSlippageSettings(!showSlippageSettings)}
            >
              <Text style={styles.detailLabel}>滑点容差</Text>
              <View style={styles.slippageValue}>
                <Text style={styles.detailValue}>{slippage}%</Text>
                <Text style={styles.arrow}>
                  {showSlippageSettings ? '▲' : '▼'}
                </Text>
              </View>
            </TouchableOpacity>

            {showSlippageSettings && (
              <View style={styles.slippageSettings}>
                <View style={styles.slippagePresets}>
                  {[0.1, 0.5, 1.0, 3.0].map(value => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.slippagePreset,
                        slippage === value && styles.slippagePresetActive,
                      ]}
                      onPress={() => setSlippage(value)}
                    >
                      <Text
                        style={[
                          styles.slippagePresetText,
                          slippage === value &&
                            styles.slippagePresetTextActive,
                        ]}
                      >
                        {value}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.slippageInput}
                  placeholder="自定义"
                  placeholderTextColor={colors.text.secondary}
                  keyboardType="decimal-pad"
                  value={slippage.toString()}
                  onChangeText={text => {
                    const value = parseFloat(text);
                    if (!isNaN(value) && value >= 0 && value <= 50) {
                      setSlippage(value);
                    }
                  }}
                />
              </View>
            )}
          </Card>
        )}

        {/* 兑换按钮 */}
        <Button
          title={loading ? '加载中...' : '兑换'}
          onPress={handleSwap}
          disabled={
            loading ||
            !fromToken ||
            !toToken ||
            !fromAmount ||
            !quote ||
            parseFloat(fromAmount) <= 0
          }
          style={styles.swapActionButton}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>获取最佳报价...</Text>
          </View>
        )}
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
  swapCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  tokenSection: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  tokenInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  tokenSymbol: {
    ...typography.h4,
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  arrow: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  amountInput: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  amountInputDisabled: {
    color: colors.text.secondary,
  },
  tokenInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  balance: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  maxButton: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  swapButton: {
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  swapIcon: {
    fontSize: 20,
    color: colors.text.primary,
  },
  detailsCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.text.primary,
  },
  slippageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  slippageValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slippageSettings: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  slippagePresets: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  slippagePreset: {
    flex: 1,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
  },
  slippagePresetActive: {
    backgroundColor: colors.primary,
  },
  slippagePresetText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  slippagePresetTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  slippageInput: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    textAlign: 'center',
  },
  swapActionButton: {
    marginTop: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  loadingText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
});
