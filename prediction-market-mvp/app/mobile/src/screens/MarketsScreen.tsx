import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PoolBar } from '../components/charts/PoolBar';
import { SparkBars } from '../components/charts/SparkBars';
import { useMarketsQuery } from '../api/queries/marketsQuery';
import { StatusPill } from '../components/StatusPill';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { KpiRow } from '../components/ui/KpiRow';
import { Skeleton } from '../components/ui/Skeleton';
import { useAppStore } from '../store/appStore';
import { getThemePalette, motion, spacing, typography } from '../theme/tokens';
import { Market } from '../types';
import { runMarketPipeline } from '../utils/marketFilters';

const sortModes = [
  { key: 'CLOSE_DESC', label: 'Close Newest' },
  { key: 'CLOSE_ASC', label: 'Close Oldest' },
  { key: 'ID_DESC', label: 'ID Newest' },
] as const;

interface MarketRowProps {
  item: Market;
  index: number;
  watched: boolean;
  onToggleWatch: () => void;
  onOpen: () => void;
}

function MarketRow({ item, index, watched, onToggleWatch, onOpen }: MarketRowProps) {
  const enter = useMemo(() => new Animated.Value(0), []);
  const themeMode = useAppStore((state) => state.themeMode);
  const palette = getThemePalette(themeMode);

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: motion.normal,
      delay: Math.min(index * 55, 280),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const trendValues = [
    Math.max(6, item.yesPool % 22),
    Math.max(8, item.noPool % 24),
    Math.max(10, (item.yesPool + item.noPool) % 27),
    Math.max(12, item.id.charCodeAt(2) % 28),
  ];

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          {
            translateY: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
      }}
    >
      <Pressable style={[styles.marketCard, { borderColor: palette.border, backgroundColor: palette.card }]} onPress={onOpen}>
        <View style={styles.marketTop}>
          <View style={styles.marketLeft}>
            <Ionicons name="analytics-outline" size={17} color={palette.primaryStrong} />
            <Text style={[styles.marketId, { color: palette.textSecondary }]}>{item.id}</Text>
          </View>
          <Pressable
            style={[
              styles.watchButton,
              { backgroundColor: themeMode === 'night' ? '#3f3325' : '#f3dfbf' },
              watched ? [styles.watchButtonActive, { backgroundColor: palette.accent }] : null,
            ]}
            onPress={onToggleWatch}
          >
            <Ionicons name={watched ? 'bookmark' : 'bookmark-outline'} size={14} color={watched ? '#f9f7f2' : palette.accent} />
            <Text style={[styles.watchText, { color: palette.accent }, watched ? styles.watchTextActive : null]}>{watched ? 'Saved' : 'Save'}</Text>
          </Pressable>
        </View>

        <Text style={[styles.question, { color: palette.textPrimary }]}>{item.question}</Text>
        <PoolBar yes={item.yesPool} no={item.noPool} />

        <View style={styles.marketBottom}>
          <StatusPill label={item.status} />
          <Text style={[styles.closeTime, { color: palette.textMuted }]}>{new Date(item.closeTime).toLocaleString()}</Text>
        </View>

        <View style={styles.marketTrend}>
          <Text style={[styles.metaText, { color: palette.textMuted }]}>7D trend</Text>
          <SparkBars values={trendValues} tone="amber" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function MarketSkeletonList() {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((item) => (
        <Card key={item}>
          <Skeleton width="30%" height={12} />
          <Skeleton width="92%" height={16} />
          <Skeleton width="100%" height={14} />
          <Skeleton width="56%" height={10} />
        </Card>
      ))}
    </View>
  );
}

export function MarketsScreen() {
  const query = useAppStore((state) => state.query);
  const filters = useAppStore((state) => state.filters);
  const sortMode = useAppStore((state) => state.sortMode);
  const watchlistIds = useAppStore((state) => state.watchlistIds);
  const setQuery = useAppStore((state) => state.setQuery);
  const setFilters = useAppStore((state) => state.setFilters);
  const setSortMode = useAppStore((state) => state.setSortMode);
  const toggleWatchlist = useAppStore((state) => state.toggleWatchlist);
  const setSelectedMarketId = useAppStore((state) => state.setSelectedMarketId);
  const recordRecentMarket = useAppStore((state) => state.recordRecentMarket);
  const recentMarketIds = useAppStore((state) => state.recentMarketIds);
  const themeMode = useAppStore((state) => state.themeMode);
  const {
    data: marketRows,
    isLoading,
    isFetching,
    refetch,
  } = useMarketsQuery();
  const markets = marketRows ?? [];
  const loading = isLoading || isFetching;
  const palette = getThemePalette(themeMode);

  const [draftQuery, setDraftQuery] = useState(query);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(draftQuery);
    }, 260);
    return () => clearTimeout(timer);
  }, [draftQuery, setQuery]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: motion.normal,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const visibleMarkets = runMarketPipeline(markets, query, filters, sortMode, watchlistIds);
  const openCount = markets.filter((item) => item.status === 'OPEN').length;

  return (
    <Animated.View style={[styles.screen, { opacity: fadeAnim }]}> 
      <FlatList
        data={visibleMarkets}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl tintColor={palette.primary} refreshing={loading} onRefresh={() => void refetch()} />}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>LIVE BOOK</Text>
            <Text style={[styles.title, { color: palette.textPrimary }]}>Markets</Text>
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>Scan momentum, size exposure, and execute with confidence.</Text>

            <Card style={[styles.heroCard, { backgroundColor: palette.bgElevated }]}> 
              <View style={styles.heroTop}>
                <View>
                  <Text style={[styles.heroTitle, { color: palette.textPrimary }]}>Session Pulse</Text>
                  <Text style={[styles.heroMeta, { color: palette.textMuted }]}>{new Date().toLocaleDateString()}</Text>
                </View>
                <Image source={require('../../assets/icon.png')} style={styles.heroImage} />
              </View>
              <KpiRow
                items={[
                  { label: 'Open', value: String(openCount) },
                  { label: 'Watchlist', value: String(watchlistIds.length) },
                  { label: 'Recent', value: String(recentMarketIds.length) },
                ]}
              />
              <View style={styles.heroBottom}>
                <Text style={styles.metaText}>Market flow</Text>
                <SparkBars values={[13, 18, 20, 16, 22, 28, 24, 26]} />
              </View>
            </Card>

            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" color={palette.textMuted} size={18} />
              <Input
                value={draftQuery}
                onChangeText={setDraftQuery}
                placeholder="Search markets by keywords"
                style={styles.inputFill}
              />
            </View>

            <View style={styles.chipRow}>
              <Chip label="All" active={filters.status === 'ALL'} onPress={() => setFilters({ status: 'ALL' })} />
              <Chip label="Open" active={filters.status === 'OPEN'} onPress={() => setFilters({ status: 'OPEN' })} />
              <Chip
                label="Watchlist"
                active={filters.watchlistOnly}
                onPress={() => setFilters({ watchlistOnly: !filters.watchlistOnly })}
              />
            </View>

            <View style={styles.chipRow}>
              {sortModes.map((mode) => (
                <Chip key={mode.key} label={mode.label} active={sortMode === mode.key} onPress={() => setSortMode(mode.key)} />
              ))}
            </View>

            {recentMarketIds.length ? <Text style={[styles.recentText, { color: palette.textMuted }]}>Recent: {recentMarketIds.slice(0, 4).join('  |  ')}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          loading && !markets.length ? (
            <MarketSkeletonList />
          ) : (
            <EmptyState
              title="No matching markets"
              message="Try broadening your search, reset filters, or refresh to sync the latest markets."
              actionLabel="Reset Filters"
              onAction={() => {
                setFilters({ status: 'ALL', watchlistOnly: false, time: 'ALL' });
                setSortMode('CLOSE_DESC');
                setDraftQuery('');
                setQuery('');
              }}
            />
          )
        }
        contentContainerStyle={styles.content}
        renderItem={({ item, index }) => {
          const watched = watchlistIds.includes(item.id);

          return (
            <MarketRow
              item={item}
              index={index}
              watched={watched}
              onToggleWatch={() => toggleWatchlist(item.id)}
              onOpen={() => {
                recordRecentMarket(item.id);
                setSelectedMarketId(item.id);
              }}
            />
          );
        }}
      />
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
  headerWrap: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  eyebrow: {
    ...typography.meta,
    color: '#70532a',
  },
  title: {
    ...typography.display,
    color: '#162920',
  },
  subtitle: {
    ...typography.body,
    color: '#4e5f57',
  },
  heroCard: {
    backgroundColor: '#f3e7d7',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    ...typography.section,
    color: '#3a2e1f',
  },
  heroMeta: {
    ...typography.meta,
    color: '#78634a',
  },
  heroImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  heroBottom: {
    gap: 6,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 2,
  },
  inputFill: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  recentText: {
    ...typography.meta,
    color: '#7b847f',
  },
  marketCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d8ccb9',
    backgroundColor: '#fffaf1',
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  marketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  marketId: {
    ...typography.meta,
    color: '#4e5f57',
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    backgroundColor: '#f3dfbf',
  },
  watchButtonActive: {
    backgroundColor: '#80531f',
  },
  watchText: {
    ...typography.meta,
    color: '#80531f',
  },
  watchTextActive: {
    color: '#f9f7f2',
  },
  question: {
    ...typography.body,
    color: '#162920',
    fontSize: 16,
    lineHeight: 22,
  },
  marketBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeTime: {
    ...typography.meta,
    color: '#7b847f',
  },
  marketTrend: {
    gap: 4,
  },
  metaText: {
    ...typography.meta,
    color: '#7b847f',
  },
  skeletonWrap: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
