import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PoolBar } from '../components/charts/PoolBar';
import { SparkBars } from '../components/charts/SparkBars';
import { StatusPill } from '../components/StatusPill';
import { Card } from '../components/ui/Card';
import { KpiRow } from '../components/ui/KpiRow';
import { useAppStore } from '../store/appStore';
import { getThemePalette, spacing, typography } from '../theme/tokens';

export function PortfolioScreen() {
  const buildPositions = useAppStore((state) => state.buildPositions);
  const themeMode = useAppStore((state) => state.themeMode);
  const palette = getThemePalette(themeMode);
  const positions = buildPositions();

  const totalMarkets = positions.length;
  const totalShares = positions.reduce((sum, row) => sum + row.yesShares + row.noShares, 0);
  const yesTotal = positions.reduce((sum, row) => sum + Math.max(0, row.yesShares), 0);
  const noTotal = positions.reduce((sum, row) => sum + Math.max(0, row.noShares), 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: palette.textPrimary }]}>Portfolio</Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>Monitor exposure and rebalance positions quickly.</Text>

      <Card style={[styles.summaryCard, { backgroundColor: palette.bgElevated }]}> 
        <View style={styles.summaryTop}>
          <Text style={[styles.summaryTitle, { color: palette.textPrimary }]}>Exposure Board</Text>
          <Image source={require('../../assets/favicon.png')} style={styles.summaryImage} />
        </View>
        <KpiRow
          items={[
            { label: 'Markets', value: String(totalMarkets) },
            { label: 'Shares', value: totalShares.toFixed(1) },
            { label: 'Net', value: (yesTotal - noTotal).toFixed(1) },
          ]}
        />
        <PoolBar yes={yesTotal || 1} no={noTotal || 1} />
        <SparkBars values={[10, 14, 11, 19, 18, 22]} />
      </Card>

      {positions.length === 0 ? (
        <Card>
          <Text style={[styles.empty, { color: palette.textMuted }]}>No active positions yet. Place a trade from Markets.</Text>
        </Card>
      ) : null}

      {positions.map((position) => (
        <Card key={position.marketId}>
          <View style={styles.rowTop}>
            <View style={styles.rowLeft}>
              <Ionicons name="pie-chart-outline" size={16} color={palette.primaryStrong} />
              <Text style={[styles.marketId, { color: palette.textSecondary }]}>{position.marketId}</Text>
            </View>
            <StatusPill label={position.status} />
          </View>
          <Text style={[styles.question, { color: palette.textPrimary }]}>{position.marketQuestion}</Text>
          <PoolBar yes={Math.max(0, position.yesShares)} no={Math.max(0, position.noShares)} />
          <Text style={[styles.meta, { color: palette.textMuted }]}>YES: {position.yesShares.toFixed(2)} / NO: {position.noShares.toFixed(2)}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 110,
  },
  title: {
    ...typography.display,
    color: '#162920',
    fontSize: 28,
  },
  subtitle: {
    ...typography.body,
    color: '#4e5f57',
  },
  summaryCard: {
    backgroundColor: '#eaf0e8',
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    ...typography.section,
    color: '#162920',
  },
  summaryImage: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  empty: {
    ...typography.body,
    color: '#7b847f',
    textAlign: 'center',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  marketId: {
    ...typography.meta,
    color: '#4e5f57',
  },
  question: {
    ...typography.body,
    color: '#162920',
  },
  meta: {
    ...typography.meta,
    color: '#7b847f',
  },
});
