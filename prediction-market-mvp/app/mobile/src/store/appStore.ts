import { create } from 'zustand';
import { fetchMarkets } from '../api/marketApi';
import {
  AppSettings,
  ActivityFilters,
  ActivityItem,
  MainTab,
  Market,
  MarketFilters,
  Position,
  SortMode,
  ThemeMode,
  TradeAction,
  TradeSide,
} from '../types';
import {
  loadActiveTab,
  loadRecentMarketIds,
  loadSettings,
  loadThemeMode,
  loadWatchlistIds,
  saveActiveTab,
  saveRecentMarketIds,
  saveSettings,
  saveThemeMode,
  saveWatchlistIds,
} from '../utils/storage';

interface AppState {
  currentTab: MainTab;
  selectedMarketId: string | null;
  markets: Market[];
  loadingMarkets: boolean;
  marketError: string | null;
  query: string;
  filters: MarketFilters;
  sortMode: SortMode;
  watchlistIds: string[];
  recentMarketIds: string[];
  activityFilters: ActivityFilters;
  walletConnected: boolean;
  network: string;
  themeMode: ThemeMode;
  themeTransition: { id: number; x: number; y: number } | null;
  settings: AppSettings;
  pendingTxs: ActivityItem[];
  historyTxs: ActivityItem[];
  diagnostics: string[];
  hydratePersisted: () => Promise<void>;
  loadMarkets: () => Promise<void>;
  setCurrentTab: (tab: MainTab) => void;
  setSelectedMarketId: (id: string | null) => void;
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<MarketFilters>) => void;
  setSortMode: (sortMode: SortMode) => void;
  toggleWatchlist: (marketId: string) => void;
  recordRecentMarket: (marketId: string) => void;
  toggleWallet: () => void;
  setNetwork: (network: string) => void;
  requestThemeTransition: (x: number, y: number) => void;
  applyThemeMode: (mode: ThemeMode) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setActivityStatusFilters: (statuses: ActivityFilters['statuses']) => void;
  setActivityActionFilters: (actions: ActivityFilters['actions']) => void;
  submitTrade: (params: { market: Market; side: TradeSide; amount: number; action: TradeAction }) => Promise<void>;
  buildPositions: () => Position[];
}

const initialFilters: MarketFilters = {
  status: 'ALL',
  time: 'ALL',
  watchlistOnly: false,
};

const defaultSettings: AppSettings = {
  notifications: true,
  biometric: false,
  reducedMotion: false,
  autoRefresh: true,
  currency: 'USDC',
  language: 'EN',
};

export const useAppStore = create<AppState>((set, get) => ({
  currentTab: 'MARKETS',
  selectedMarketId: null,
  markets: [],
  loadingMarkets: false,
  marketError: null,
  query: '',
  filters: initialFilters,
  sortMode: 'CLOSE_DESC',
  watchlistIds: [],
  recentMarketIds: [],
  activityFilters: { statuses: [], actions: [] },
  walletConnected: false,
  network: '31337',
  themeMode: 'sand',
  themeTransition: null,
  settings: defaultSettings,
  pendingTxs: [],
  historyTxs: [],
  diagnostics: [],

  hydratePersisted: async () => {
    const [watchlistIds, recentMarketIds, tab, mode, rawSettings] = await Promise.all([
      loadWatchlistIds(),
      loadRecentMarketIds(),
      loadActiveTab(),
      loadThemeMode(),
      loadSettings(),
    ]);

    const safeMode: ThemeMode = mode === 'night' ? 'night' : 'sand';
    const parsedSettings: AppSettings = {
      notifications:
        typeof rawSettings?.notifications === 'boolean' ? rawSettings.notifications : defaultSettings.notifications,
      biometric: typeof rawSettings?.biometric === 'boolean' ? rawSettings.biometric : defaultSettings.biometric,
      reducedMotion:
        typeof rawSettings?.reducedMotion === 'boolean' ? rawSettings.reducedMotion : defaultSettings.reducedMotion,
      autoRefresh:
        typeof rawSettings?.autoRefresh === 'boolean' ? rawSettings.autoRefresh : defaultSettings.autoRefresh,
      currency: rawSettings?.currency === 'USD' ? 'USD' : 'USDC',
      language: rawSettings?.language === 'ZH' ? 'ZH' : 'EN',
    };

    set({
      watchlistIds,
      recentMarketIds,
      currentTab: tab === 'PORTFOLIO' || tab === 'ACTIVITY' || tab === 'SETTINGS' ? tab : 'MARKETS',
      themeMode: safeMode,
      settings: parsedSettings,
    });
    await get().loadMarkets();
  },

  loadMarkets: async () => {
    set({ loadingMarkets: true, marketError: null });
    try {
      const markets = await fetchMarkets();
      set({ markets, loadingMarkets: false });
    } catch {
      const diagnostics = [`${new Date().toISOString()} fetch /markets failed`].concat(get().diagnostics).slice(0, 8);
      set({ loadingMarkets: false, marketError: 'Unable to load markets.', diagnostics });
    }
  },

  setCurrentTab: (tab) => {
    void saveActiveTab(tab);
    set({ currentTab: tab });
  },

  setSelectedMarketId: (id) => set({ selectedMarketId: id }),
  setQuery: (query) => set({ query }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setSortMode: (sortMode) => set({ sortMode }),

  toggleWatchlist: (marketId) => {
    const previous = get().watchlistIds;
    const next = previous.includes(marketId) ? previous.filter((id) => id !== marketId) : [marketId, ...previous];
    set({ watchlistIds: next });
    void saveWatchlistIds(next);
  },

  recordRecentMarket: (marketId) => {
    const previous = get().recentMarketIds.filter((id) => id !== marketId);
    const next = [marketId, ...previous].slice(0, 12);
    set({ recentMarketIds: next });
    void saveRecentMarketIds(next);
  },

  toggleWallet: () => set((state) => ({ walletConnected: !state.walletConnected })),
  setNetwork: (network) => set({ network }),

  requestThemeTransition: (x, y) =>
    set((state) => ({
      themeTransition: {
        id: Date.now(),
        x,
        y,
      },
      diagnostics: [`${new Date().toISOString()} theme transition requested`].concat(state.diagnostics).slice(0, 8),
    })),

  applyThemeMode: (mode) => {
    void saveThemeMode(mode);
    set({ themeMode: mode, themeTransition: null });
  },

  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    void saveSettings(next as Record<string, unknown>);
    set({ settings: next });
  },

  setActivityStatusFilters: (statuses) =>
    set((state) => ({ activityFilters: { ...state.activityFilters, statuses } })),

  setActivityActionFilters: (actions) =>
    set((state) => ({ activityFilters: { ...state.activityFilters, actions } })),

  submitTrade: async ({ market, side, amount, action }) => {
    const txHash = `0x${Math.random().toString(16).slice(2, 18)}`;
    const base: ActivityItem = {
      txHash,
      marketId: market.id,
      marketQuestion: market.question,
      action,
      side,
      amount,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      pendingTxs: [base, ...state.pendingTxs],
      diagnostics: [`${new Date().toISOString()} trade submitted ${txHash}`].concat(state.diagnostics).slice(0, 8),
    }));

    setTimeout(() => {
      const latest = get().pendingTxs.find((item) => item.txHash === txHash);
      if (!latest) {
        return;
      }

      const confirmed = { ...latest, status: 'CONFIRMED' as const };
      set((state) => ({
        pendingTxs: state.pendingTxs.map((item) => (item.txHash === txHash ? confirmed : item)),
      }));
    }, 1200);

    setTimeout(() => {
      const latest = get().pendingTxs.find((item) => item.txHash === txHash);
      if (!latest) {
        return;
      }

      const indexed = { ...latest, status: 'INDEXED' as const };
      set((state) => ({
        pendingTxs: state.pendingTxs.filter((item) => item.txHash !== txHash),
        historyTxs: [indexed, ...state.historyTxs],
      }));
    }, 2600);
  },

  buildPositions: () => {
    const rows = get().historyTxs.filter((item) => item.status === 'INDEXED');
    const byMarket = new Map<string, Position>();

    rows.forEach((row) => {
      const existing = byMarket.get(row.marketId) ?? {
        marketId: row.marketId,
        marketQuestion: row.marketQuestion,
        status: 'OPEN' as const,
        yesShares: 0,
        noShares: 0,
      };

      const isBuy = row.action === 'BUY';
      const signed = isBuy ? row.amount : -row.amount;
      if (row.side === 'YES') {
        existing.yesShares += signed;
      } else {
        existing.noShares += signed;
      }
      byMarket.set(row.marketId, existing);
    });

    return [...byMarket.values()];
  },
}));

export type { MainTab };
