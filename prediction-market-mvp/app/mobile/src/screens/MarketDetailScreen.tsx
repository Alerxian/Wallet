import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PoolBar } from '../components/charts/PoolBar';
import { SparkBars } from '../components/charts/SparkBars';
import { SegmentedControl } from '../components/SegmentedControl';
import { StatusPill } from '../components/StatusPill';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Input } from '../components/ui/Input';
import { KpiRow } from '../components/ui/KpiRow';
import { useAppStore } from '../store/appStore';
import { getThemePalette, spacing, typography } from '../theme/tokens';
import { validateTradeAmount } from '../utils/trade';

const QUICK_AMOUNTS = [5, 10, 25, 50, 100];

export function MarketDetailScreen() {
  const selectedMarketId = useAppStore((state) => state.selectedMarketId);
  const setSelectedMarketId = useAppStore((state) => state.setSelectedMarketId);
  const markets = useAppStore((state) => state.markets);
  const walletConnected = useAppStore((state) => state.walletConnected);
  const network = useAppStore((state) => state.network);
  const themeMode = useAppStore((state) => state.themeMode);
  const submitTrade = useAppStore((state) => state.submitTrade);
  const setCurrentTab = useAppStore((state) => state.setCurrentTab);
  const palette = getThemePalette(themeMode);

  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState('');

  const market = markets.find((item) => item.id === selectedMarketId);
  const amountState = useMemo(() => validateTradeAmount(amount), [amount]);
  const fade = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  if (!market) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.empty, { color: palette.textSecondary }]}>Market not found.</Text>
        <Button label="Back" onPress={() => setSelectedMarketId(null)} />
      </View>
    );
  }

  const canSubmit = walletConnected && network === '31337' && amountState.valid;
  const expectedShares = amountState.valid ? (side === 'YES' ? amountState.value * 0.92 : amountState.value * 0.88) : 0;
  const impliedPrice = expectedShares > 0 ? amountState.value / expectedShares : 0;
  const poolTotal = market.yesPool + market.noPool;
  const slippagePct = amountState.valid ? Math.min(12, (amountState.value / Math.max(1, poolTotal)) * 10000) : 0;

  return (
    <Animated.View style={{ flex: 1, opacity: fade }}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={[styles.back, { backgroundColor: palette.bgElevated, borderColor: palette.border }]} onPress={() => setSelectedMarketId(null)}>
        <Ionicons name="arrow-back" size={16} color={palette.textSecondary} />
        <Text style={[styles.backText, { color: palette.textSecondary }]}>Back to markets</Text>
      </Pressable>

      <Card style={[styles.marketCard, { backgroundColor: palette.bgElevated }]}>
        <View style={styles.marketTop}>
          <View style={styles.marketTitleBlock}>
            <Text style={[styles.id, { color: palette.textSecondary }]}>{market.id}</Text>
            <Text style={[styles.title, { color: palette.textPrimary }]}>{market.question}</Text>
          </View>
          <Image source={require('../../assets/adaptive-icon.png')} style={styles.heroImage} />
        </View>
        <View style={styles.inlineRow}>
          <StatusPill label={market.status} />
          <Chip label={`Close ${new Date(market.closeTime).toLocaleDateString()}`} />
        </View>
        <PoolBar yes={market.yesPool} no={market.noPool} />
        <KpiRow
          items={[
            { label: 'YES Pool', value: `$${Math.round(market.yesPool / 1000)}k` },
            { label: 'NO Pool', value: `$${Math.round(market.noPool / 1000)}k` },
            { label: 'Address', value: market.address.slice(0, 6) },
          ]}
        />
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Order Ticket</Text>
        <SegmentedControl options={['BUY', 'SELL']} value={action} onChange={setAction} />
        <SegmentedControl options={['YES', 'NO']} value={side} onChange={setSide} />

        <Input
          invalid={!amountState.valid && amount.length > 0}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter USDC amount"
        />

        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((value) => (
            <Chip key={value} label={`$${value}`} onPress={() => setAmount(String(value))} />
          ))}
        </View>

        <View style={[styles.signalCard, { borderColor: palette.border, backgroundColor: palette.warningBg }]}> 
          <Text style={[styles.signalLabel, { color: palette.accent }]}>Execution Intensity</Text>
          <SparkBars values={[12, 18, 23, 16, 26, 30, 24]} />
          <Text style={[styles.signalMeta, { color: palette.textSecondary }]}>Estimated fill: {expectedShares.toFixed(2)} shares</Text>
        </View>

        <View style={[styles.estimateCard, { borderColor: palette.border, backgroundColor: palette.infoBg }]}> 
          <Text style={[styles.signalLabel, { color: palette.primaryStrong }]}>Estimated Execution</Text>
          <KpiRow
            items={[
              { label: 'Avg Price', value: impliedPrice ? `$${impliedPrice.toFixed(3)}` : '-' },
              { label: 'Slippage', value: `${slippagePct.toFixed(2)}%` },
              { label: 'Fee', value: amountState.valid ? `$${(amountState.value * 0.003).toFixed(2)}` : '-' },
            ]}
          />
          <Text style={[styles.signalMeta, { color: palette.textSecondary }]}>Final output can vary with on-chain latency and pool movement.</Text>
        </View>

        {!walletConnected ? <Text style={[styles.error, { color: palette.danger }]}>Wallet disconnected. Connect in Settings.</Text> : null}
        {network !== '31337' ? <Text style={[styles.error, { color: palette.danger }]}>Switch network to 31337 before submitting.</Text> : null}
        {!amountState.valid ? <Text style={[styles.error, { color: palette.danger }]}>{amountState.message}</Text> : null}

        <Button
          label={`${action} ${side}`}
          disabled={!canSubmit}
          onPress={() => {
            void submitTrade({ market, side, action, amount: amountState.value });
            Alert.alert('Trade submitted', 'Your order is now tracked in Activity.');
            setCurrentTab('ACTIVITY');
            setSelectedMarketId(null);
          }}
        />
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Risk Checklist</Text>
        <View style={styles.riskRow}>
          <Ionicons name="warning-outline" size={16} color={palette.accent} />
          <Text style={[styles.riskText, { color: palette.textSecondary }]}>Market may remain pending if chain indexing is delayed.</Text>
        </View>
        <View style={styles.riskRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={palette.primaryStrong} />
          <Text style={[styles.riskText, { color: palette.textSecondary }]}>Invalid amount and wrong network are blocked before submit.</Text>
        </View>
      </Card>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  empty: {
    ...typography.body,
    color: '#4e5f57',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f7f0e4',
    borderWidth: 1,
    borderColor: '#d8ccb9',
  },
  backText: {
    ...typography.meta,
    color: '#4e5f57',
  },
  marketCard: {
    backgroundColor: '#f9efe1',
  },
  marketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  marketTitleBlock: {
    flex: 1,
    gap: 6,
  },
  heroImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  id: {
    ...typography.meta,
    color: '#4e5f57',
  },
  title: {
    ...typography.section,
    color: '#162920',
    fontSize: 21,
    lineHeight: 27,
  },
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.section,
    color: '#162920',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  signalCard: {
    borderRadius: 12,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#d8ccb9',
    backgroundColor: '#f5ead7',
    gap: 4,
  },
  signalLabel: {
    ...typography.meta,
    color: '#6c532e',
  },
  signalMeta: {
    ...typography.meta,
    color: '#4e5f57',
  },
  estimateCard: {
    borderRadius: 12,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#d8ccb9',
    backgroundColor: '#edf2eb',
    gap: 6,
  },
  error: {
    ...typography.meta,
    color: '#9f1239',
  },
  riskRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  riskText: {
    ...typography.body,
    color: '#4e5f57',
    flex: 1,
  },
});
