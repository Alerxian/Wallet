/**
 * 代币兑换界面（重设计）
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Atmosphere } from '@components/common/Atmosphere';
import { ReviewSheet } from '@components/common/ReviewSheet';
import { useWalletStore } from '@store/walletStore';
import { useNetworkStore } from '@store/networkStore';
import { useTokenStore } from '@store/tokenStore';
import { SwapService, SwapQuote } from '@/services/SwapService';
import { TokenService } from '@/services/TokenService';
import { Token } from '@/types/token.types';
import { ChainId } from '@/types/network.types';

type TokenSelectMode = 'from' | 'to';

const makeNativeToken = (chainId: number, symbol: string, name: string): Token => ({
  address: SwapService.getNativeTokenAddress(),
  symbol,
  name,
  decimals: 18,
  chainId,
});

const toLowerAddr = (addr: string) => addr.toLowerCase();

export const SwapScreen: React.FC = () => {
  const { currentWallet } = useWalletStore();
  const { currentNetwork } = useNetworkStore();
  const { tokens, balances, prices, refreshAll, loadTokens } = useTokenStore();
  const { theme: colors } = useTheme();
  const styles = createStyles(colors);

  const chainId = (currentNetwork?.chainId ?? ChainId.ETHEREUM) as ChainId;
  const supported = SwapService.isSupportedChain(chainId);

  const nativeToken = useMemo(() => makeNativeToken(currentNetwork.chainId, currentNetwork.symbol, currentNetwork.name), [
    currentNetwork.chainId,
    currentNetwork.symbol,
    currentNetwork.name,
  ]);

  const allTokens = useMemo(() => {
    const erc20 = tokens.filter((t) => t.chainId === currentNetwork.chainId);
    const uniq = new Map<string, Token>();
    uniq.set(toLowerAddr(nativeToken.address), nativeToken);
    erc20.forEach((t) => uniq.set(toLowerAddr(t.address), t));
    return Array.from(uniq.values());
  }, [tokens, currentNetwork.chainId, nativeToken]);

  const [fromToken, setFromToken] = useState<Token>(nativeToken);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [selectVisible, setSelectVisible] = useState(false);
  const [selectMode, setSelectMode] = useState<TokenSelectMode>('from');
  const [search, setSearch] = useState('');
  const [needsApprove, setNeedsApprove] = useState(false);
  const [checkingApprove, setCheckingApprove] = useState(false);
  const [nativeBalance, setNativeBalance] = useState('0.00');
  const [reviewVisible, setReviewVisible] = useState(false);

  useEffect(() => {
    setFromToken(nativeToken);
    setToToken(null);
    setFromAmount('');
    setToAmount('');
    setQuote(null);
    setNeedsApprove(false);
  }, [nativeToken.address, currentNetwork.chainId]);

  useEffect(() => {
    loadTokens(chainId).catch(() => undefined);
  }, [chainId]);

  useEffect(() => {
    if (!currentWallet) return;
    refreshAll(currentWallet.address, chainId).catch(() => undefined);
    TokenService.getNativeBalance(currentWallet.address, chainId)
      .then((res) => setNativeBalance(res.balanceFormatted || '0.00'))
      .catch(() => setNativeBalance('0.00'));
  }, [currentWallet?.address, chainId]);

  const fromBalanceFormatted = useMemo(() => {
    if (!currentWallet) return '0.00';
    if (SwapService.isNativeToken(fromToken)) return nativeBalance;
    return balances[toLowerAddr(fromToken.address)]?.balanceFormatted ?? '0.00';
  }, [currentWallet, fromToken, nativeBalance, balances]);

  const validateInputs = useCallback((): string | null => {
    if (!currentWallet) return '暂无钱包';
    if (!supported) return '当前网络暂不支持兑换';
    if (!toToken) return '请选择目标代币';
    if (toLowerAddr(fromToken.address) === toLowerAddr(toToken.address)) return '不能兑换相同代币';
    if (!fromAmount) return '请输入兑换数量';
    const amt = Number(fromAmount);
    if (!Number.isFinite(amt) || amt <= 0) return '兑换数量必须大于 0';
    if (Number(fromAmount) > Number(fromBalanceFormatted || '0')) return '余额不足';
    if (slippage < 0 || slippage > 50) return '滑点范围应为 0 - 50%';
    return null;
  }, [currentWallet, supported, toToken, fromToken.address, fromAmount, fromBalanceFormatted, slippage]);

  const fetchQuote = useCallback(async () => {
    if (!currentWallet || !toToken) return;
    const err = validateInputs();
    if (err) return;

    try {
      setLoading(true);
      const q = await SwapService.getQuote({
        fromToken,
        toToken,
        amount: fromAmount,
        fromAddress: currentWallet.address,
        slippage,
      });
      setQuote(q);
      setToAmount(SwapService.formatSwapAmount(q.toAmount, toToken.decimals));
    } catch {
      setQuote(null);
      setToAmount('');
    } finally {
      setLoading(false);
    }
  }, [currentWallet, toToken, validateInputs, fromToken, fromAmount, slippage]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (fromAmount && Number(fromAmount) > 0 && toToken) {
        fetchQuote();
      }
    }, 420);
    return () => clearTimeout(t);
  }, [fromAmount, toToken, slippage, fetchQuote]);

  const checkApproval = useCallback(async () => {
    if (!currentWallet || !quote || !toToken) return;
    if (SwapService.isNativeToken(fromToken)) {
      setNeedsApprove(false);
      return;
    }

    try {
      setCheckingApprove(true);
      const need = await SwapService.needsApproval(
        currentWallet.address,
        fromToken,
        quote.fromAmount,
        fromToken.chainId as ChainId
      );
      setNeedsApprove(need);
    } catch {
      setNeedsApprove(true);
    } finally {
      setCheckingApprove(false);
    }
  }, [currentWallet, quote, fromToken, toToken]);

  useEffect(() => {
    checkApproval();
  }, [checkApproval]);

  const handleSwapTokens = () => {
    if (!toToken) return;
    const a = fromToken;
    const b = toToken;
    setFromToken(b);
    setToToken(a);
    setFromAmount(toAmount);
    setToAmount('');
    setQuote(null);
    setNeedsApprove(false);
  };

  const openTokenSelector = (mode: TokenSelectMode) => {
    setSelectMode(mode);
    setSearch('');
    setSelectVisible(true);
  };

  const filteredTokens = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return allTokens;
    return allTokens.filter((t) =>
      t.symbol.toLowerCase().includes(s) || t.name.toLowerCase().includes(s) || t.address.toLowerCase().includes(s)
    );
  }, [search, allTokens]);

  const handlePickToken = (token: Token) => {
    setSelectVisible(false);
    if (selectMode === 'from') {
      setFromToken(token);
      if (toToken && toLowerAddr(toToken.address) === toLowerAddr(token.address)) setToToken(null);
    } else {
      setToToken(token);
      if (toLowerAddr(fromToken.address) === toLowerAddr(token.address)) setFromToken(nativeToken);
    }
    setFromAmount('');
    setToAmount('');
    setQuote(null);
    setNeedsApprove(false);
  };

  const handleSetMax = () => {
    setFromAmount(fromBalanceFormatted);
  };

  const minReceived = quote && toToken
    ? SwapService.formatSwapAmount(SwapService.calculateMinReceived(quote.toAmount, slippage), toToken.decimals)
    : '0';

  const priceImpact = quote
    ? SwapService.calculatePriceImpact(
        quote.fromAmount,
        quote.toAmount,
        prices[fromToken.symbol] || 0,
        prices[toToken?.symbol || ''] || 0,
        fromToken.decimals,
        toToken?.decimals || 18
      )
    : 0;

  const handleApprove = async () => {
    if (!currentWallet) return;
    try {
      setLoading(true);
      const txHash = await SwapService.approveMax({
        owner: currentWallet.address,
        token: fromToken,
        walletId: currentWallet.id,
        chainId,
      });
      Alert.alert('授权已发送', `交易哈希: ${txHash.slice(0, 10)}...`);
      setTimeout(() => checkApproval(), 1200);
    } catch (e: any) {
      Alert.alert('错误', e?.message || '授权失败');
    } finally {
      setLoading(false);
    }
  };

  const submitSwap = async () => {
    if (!currentWallet || !toToken || !quote) return;
    try {
      setLoading(true);
      const txHash = await SwapService.executeSwap(quote, currentWallet.id, currentWallet.address, chainId);
      setReviewVisible(false);
      Alert.alert('兑换已发送', `交易哈希: ${txHash.slice(0, 10)}...`);
      refreshAll(currentWallet.address, chainId).catch(() => undefined);
      setFromAmount('');
      setToAmount('');
      setQuote(null);
    } catch (e: any) {
      Alert.alert('错误', e?.message || '兑换失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!currentWallet || !toToken || !quote) {
      Alert.alert('错误', '缺少必要信息');
      return;
    }
    const err = validateInputs();
    if (err) {
      Alert.alert('错误', err);
      return;
    }

    if (needsApprove) {
      Alert.alert('提示', '请先授权后再兑换');
      return;
    }

    setReviewVisible(true);
  };

  const actionLabel = !supported
    ? '当前网络暂不支持'
    : checkingApprove
    ? '检查授权中...'
    : needsApprove
    ? `授权 ${fromToken.symbol}`
    : '确认兑换';

  const actionDisabled =
    loading ||
    !supported ||
    !currentWallet ||
    !toToken ||
    !fromAmount ||
    Number(fromAmount) <= 0 ||
    (!needsApprove && !quote);

  const renderTokenRow = ({ item }: { item: Token }) => {
    const amount = balances[toLowerAddr(item.address)]?.balanceFormatted || '0';
    return (
      <TouchableOpacity style={styles.tokenRow} onPress={() => handlePickToken(item)}>
        <View style={styles.tokenDot}><Text style={styles.tokenDotText}>{item.symbol.slice(0, 1)}</Text></View>
        <View style={styles.tokenMeta}>
          <Text style={styles.tokenName}>{item.name}</Text>
          <Text style={styles.tokenSymbol}>{item.symbol}</Text>
        </View>
        <Text style={styles.tokenAmount}>{Number(amount).toFixed(4)}</Text>
      </TouchableOpacity>
    );
  };

  const onPrimaryAction = () => {
    if (needsApprove) {
      handleApprove();
      return;
    }
    handleSwap();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Atmosphere />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>代币兑换</Text>
          <Text style={styles.heroSubtitle}>链上直连聚合路径，支持授权与滑点控制。</Text>
        </View>

        <Card style={styles.tradeCard}>
          <Text style={styles.blockLabel}>支付</Text>
          <View style={styles.rowInput}>
            <TouchableOpacity style={styles.tokenPicker} onPress={() => openTokenSelector('from')}>
              <Text style={styles.tokenPickerText}>{fromToken.symbol}</Text>
              <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.amountInput}
              placeholder="0.0"
              placeholderTextColor={colors.text.disabled}
              keyboardType="decimal-pad"
              value={fromAmount}
              onChangeText={setFromAmount}
            />
          </View>

          <View style={styles.helperRow}>
            <Text style={styles.helperText}>余额 {Number(fromBalanceFormatted).toFixed(6)}</Text>
            <TouchableOpacity onPress={handleSetMax}><Text style={styles.maxText}>MAX</Text></TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.switchBtn} onPress={handleSwapTokens}>
            <Text style={styles.switchText}>⇅</Text>
          </TouchableOpacity>

          <Text style={styles.blockLabel}>接收</Text>
          <View style={styles.rowInput}>
            <TouchableOpacity style={styles.tokenPicker} onPress={() => openTokenSelector('to')}>
              <Text style={styles.tokenPickerText}>{toToken?.symbol || '选择代币'}</Text>
              <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.amountInput, styles.readonly]}
              value={toAmount}
              editable={false}
              placeholder="0.0"
              placeholderTextColor={colors.text.disabled}
            />
          </View>
        </Card>

        {quote && toToken && (
          <Card style={styles.metaCard}>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>DEX</Text><Text style={styles.metaValue}>{quote.dexName}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>最小接收</Text><Text style={styles.metaValue}>{Number(minReceived).toFixed(6)} {toToken.symbol}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>价格影响</Text><Text style={[styles.metaValue, priceImpact < -1 ? styles.warn : styles.safe]}>{priceImpact.toFixed(2)}%</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>滑点</Text><Text style={styles.metaValue}>{slippage}%</Text></View>

            <View style={styles.slipWrap}>
              {[0.1, 0.5, 1, 3].map((x) => (
                <TouchableOpacity key={x} style={[styles.slipBtn, slippage === x && styles.slipBtnActive]} onPress={() => setSlippage(x)}>
                  <Text style={[styles.slipText, slippage === x && styles.slipTextActive]}>{x}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        <Button title={loading ? '处理中...' : actionLabel} onPress={onPrimaryAction} disabled={actionDisabled} style={styles.actionBtn} />

        {(loading || checkingApprove) && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>{needsApprove ? '等待授权交易广播...' : '正在获取报价...'}</Text>
          </View>
        )}
      </ScrollView>

      <ReviewSheet
        visible={reviewVisible}
        title="确认兑换"
        subtitle="请检查兑换路径和最小接收数量"
        rows={[
          { label: '网络', value: currentNetwork.name },
          { label: 'DEX', value: quote?.dexName || '--' },
          { label: '支付', value: `${fromAmount || '0'} ${fromToken.symbol}` },
          { label: '预计接收', value: `${toAmount || '0'} ${toToken?.symbol || ''}` },
          { label: '最小接收', value: `${Number(minReceived).toFixed(6)} ${toToken?.symbol || ''}` },
          { label: '滑点', value: `${slippage}%`, tone: slippage > 1 ? 'warning' : 'default' },
          {
            label: '价格影响',
            value: `${priceImpact.toFixed(2)}%`,
            tone: priceImpact < -3 ? 'danger' : priceImpact < -1 ? 'warning' : 'success',
          },
        ]}
        confirmText={priceImpact < -3 ? '高风险继续兑换' : '确认兑换'}
        onCancel={() => setReviewVisible(false)}
        onConfirm={submitSwap}
        loading={loading}
      />

      <Modal visible={selectVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>选择代币</Text>
              <TouchableOpacity onPress={() => setSelectVisible(false)}><Text style={styles.close}>关闭</Text></TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="搜索 symbol / name / address"
              placeholderTextColor={colors.text.disabled}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />

            <FlatList data={filteredTokens} renderItem={renderTokenRow} keyExtractor={(i) => `${i.chainId}-${i.address.toLowerCase()}`} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
    hero: { marginTop: spacing.xs },
    heroTitle: { ...typography.h2, color: colors.text.primary, marginBottom: 2 },
    heroSubtitle: { ...typography.body, color: colors.text.secondary },

    tradeCard: { padding: spacing.md },
    blockLabel: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.xs },
    rowInput: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
    tokenPicker: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceLight,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      minWidth: 118,
      justifyContent: 'space-between',
    },
    tokenPickerText: { ...typography.bodyBold, color: colors.text.primary },
    chevron: { ...typography.caption, color: colors.text.secondary },
    amountInput: {
      flex: 1,
      marginLeft: spacing.sm,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...typography.h4,
      color: colors.text.primary,
      textAlign: 'right',
    },
    readonly: { color: colors.text.secondary },
    helperRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    helperText: { ...typography.caption, color: colors.text.secondary },
    maxText: { ...typography.captionMedium, color: colors.primary },
    switchBtn: {
      width: 40,
      height: 40,
      alignSelf: 'center',
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: spacing.sm,
    },
    switchText: { ...typography.h4, color: colors.text.primary },

    metaCard: { padding: spacing.md },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    metaLabel: { ...typography.caption, color: colors.text.secondary },
    metaValue: { ...typography.captionMedium, color: colors.text.primary },
    warn: { color: colors.warning },
    safe: { color: colors.status.success },
    slipWrap: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
    slipBtn: {
      flex: 1,
      borderRadius: 10,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.xs,
      alignItems: 'center',
    },
    slipBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    slipText: { ...typography.caption, color: colors.text.secondary },
    slipTextActive: { color: colors.text.inverse },

    actionBtn: { marginTop: spacing.xs },
    loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
    loadingText: { ...typography.caption, color: colors.text.secondary },

    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.overlay.medium,
    },
    modalSheet: {
      maxHeight: '80%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingBottom: spacing.lg,
    },
    modalHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    modalTitle: { ...typography.h4, color: colors.text.primary },
    close: { ...typography.captionMedium, color: colors.primary },
    searchInput: {
      margin: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceLight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...typography.body,
      color: colors.text.primary,
    },
    tokenRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    tokenDot: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    tokenDotText: { ...typography.captionMedium, color: colors.text.primary },
    tokenMeta: { flex: 1 },
    tokenName: { ...typography.bodyMedium, color: colors.text.primary },
    tokenSymbol: { ...typography.caption, color: colors.text.secondary },
    tokenAmount: { ...typography.captionMedium, color: colors.text.secondary },
  });
