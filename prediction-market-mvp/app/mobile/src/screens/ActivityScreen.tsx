import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SparkBars } from '../components/charts/SparkBars';
import { StatusPill } from '../components/StatusPill';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { KpiRow } from '../components/ui/KpiRow';
import { Skeleton } from '../components/ui/Skeleton';
import { useAppStore } from '../store/appStore';
import { getThemePalette, motion, spacing, typography } from '../theme/tokens';
import { TradeAction, TradeStatus } from '../types';
import { filterActivity, mergeAndDedupeActivity } from '../utils/activity';

const statusOptions: TradeStatus[] = ['PENDING', 'CONFIRMED', 'INDEXED', 'FAILED'];
const actionOptions: TradeAction[] = ['BUY', 'SELL'];

const statusIcons: Record<TradeStatus, keyof typeof Ionicons.glyphMap> = {
  PENDING: 'time-outline',
  CONFIRMED: 'checkmark-done-outline',
  INDEXED: 'server-outline',
  FAILED: 'close-circle-outline',
};

function ActivitySkeleton() {
  return (
    <Card>
      <Skeleton width="30%" />
      <Skeleton width="75%" height={16} />
      <Skeleton width="100%" />
      <Skeleton width="52%" />
    </Card>
  );
}

export function ActivityScreen() {
  const pendingTxs = useAppStore((state) => state.pendingTxs);
  const historyTxs = useAppStore((state) => state.historyTxs);
  const activityFilters = useAppStore((state) => state.activityFilters);
  const setActivityStatusFilters = useAppStore((state) => state.setActivityStatusFilters);
  const setActivityActionFilters = useAppStore((state) => state.setActivityActionFilters);
  const themeMode = useAppStore((state) => state.themeMode);
  const palette = getThemePalette(themeMode);

  const fade = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: motion.normal,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  const merged = mergeAndDedupeActivity(pendingTxs, historyTxs);
  const visible = filterActivity(merged, activityFilters);
  const pendingCount = merged.filter((item) => item.status === 'PENDING').length;
  const indexedCount = merged.filter((item) => item.status === 'INDEXED').length;
  const failedCount = merged.filter((item) => item.status === 'FAILED').length;

  return (
    <Animated.View style={{ flex: 1, opacity: fade }}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: palette.textPrimary }]}>Activity Ledger</Text>
        <Text style={[styles.subtitle, { color: palette.textSecondary }]}>Track order lifecycle from submission to indexing.</Text>

        <Card style={[styles.heroCard, { backgroundColor: palette.bgElevated }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroTitle, { color: palette.textPrimary }]}>Execution Timeline</Text>
              <Text style={[styles.heroMeta, { color: palette.textMuted }]}>Realtime status stream</Text>
            </View>
            <Image source={require('../../assets/favicon.png')} style={styles.heroIcon} />
          </View>
          <KpiRow
            items={[
              { label: 'Pending', value: String(pendingCount) },
              { label: 'Indexed', value: String(indexedCount) },
              { label: 'Failed', value: String(failedCount) },
            ]}
          />
          <SparkBars values={[pendingCount + 2, indexedCount + 4, failedCount + 1, indexedCount + 2, pendingCount + 3]} />
        </Card>

        <Card>
          <Text style={[styles.section, { color: palette.textSecondary }]}>Status</Text>
          <View style={styles.row}>
            {statusOptions.map((status) => {
              const active = activityFilters.statuses.includes(status);
              return (
                <Pressable
                  key={status}
                  style={[styles.filterButton, active ? styles.filterActive : null]}
                  onPress={() => {
                    const next = active
                      ? activityFilters.statuses.filter((item) => item !== status)
                      : [...activityFilters.statuses, status];
                    setActivityStatusFilters(next);
                  }}
                >
                  <Ionicons
                    name={statusIcons[status]}
                    size={14}
                    color={active ? '#f8f7f2' : palette.textSecondary}
                  />
                  <Text style={[styles.filterText, { color: palette.textSecondary }, active ? styles.filterTextActive : null]}>{status}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.section, { color: palette.textSecondary }]}>Action</Text>
          <View style={styles.row}>
            {actionOptions.map((action) => {
              const active = activityFilters.actions.includes(action);
              return (
                <Chip
                  key={action}
                  label={action}
                  active={active}
                  onPress={() => {
                    const next = active
                      ? activityFilters.actions.filter((item) => item !== action)
                      : [...activityFilters.actions, action];
                    setActivityActionFilters(next);
                  }}
                />
              );
            })}
          </View>
        </Card>

        {!merged.length ? (
          <>
            <ActivitySkeleton />
            <ActivitySkeleton />
          </>
        ) : null}

        {merged.length > 0 && visible.length === 0 ? (
          <EmptyState
            title="No matching records"
            message="Adjust status/action filters to see order history."
            actionLabel="Clear Filters"
            onAction={() => {
              setActivityStatusFilters([]);
              setActivityActionFilters([]);
            }}
          />
        ) : null}

        {visible.map((item, index) => (
          <Card key={item.txHash}>
            <View style={styles.timelineTop}>
              <View style={styles.timelineLeft}>
                <View style={styles.dotWrap}>
                  <Ionicons name={statusIcons[item.status]} size={14} color={palette.primaryStrong} />
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineBody}>
                <View style={styles.txTopRow}>
                  <Text style={[styles.marketId, { color: palette.textSecondary }]}>{item.marketId}</Text>
                  <StatusPill label={item.status} />
                </View>
                <Text style={[styles.question, { color: palette.textPrimary }]}>{item.marketQuestion}</Text>
                <Text style={[styles.meta, { color: palette.textMuted }]}>{item.action} {item.side} ${item.amount}</Text>
                <Text style={[styles.meta, { color: palette.textMuted }]}>Hash: {item.txHash}</Text>
                <Text style={[styles.meta, { color: palette.textMuted }]}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
            </View>
            {index === 0 ? <SparkBars values={[9, 13, 11, 18, 16, 20]} tone="amber" /> : null}
          </Card>
        ))}
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
  heroCard: {
    backgroundColor: '#eef3ed',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    ...typography.section,
    color: '#162920',
  },
  heroMeta: {
    ...typography.meta,
    color: '#7b847f',
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  section: {
    ...typography.meta,
    color: '#4e5f57',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#f7efe2',
    borderWidth: 1,
    borderColor: '#d8ccb9',
  },
  filterActive: {
    backgroundColor: '#1f5a47',
    borderColor: '#1f5a47',
  },
  filterText: {
    ...typography.meta,
    color: '#4e5f57',
  },
  filterTextActive: {
    color: '#f8f7f2',
  },
  timelineTop: {
    flexDirection: 'row',
    gap: 8,
  },
  timelineLeft: {
    width: 24,
    alignItems: 'center',
  },
  dotWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#d8ece4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#d8d3c8',
    marginTop: 4,
  },
  timelineBody: {
    flex: 1,
    gap: 4,
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
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
