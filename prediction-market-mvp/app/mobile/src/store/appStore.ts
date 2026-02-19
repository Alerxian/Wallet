import { create } from 'zustand';
import { HTTPError, TimeoutError } from 'ky';
import { fetchTradeStatus, submitTradeIntent } from '../api/marketApi';
import {
  AppSettings,
  ActivityFilters,
  ActivityItem,
  MainTab,
  Market,
  MarketFilters,
  PendingTradeRecord,
  Position,
  RetryCategory,
  SortMode,
  ThemeMode,
  TradeAction,
  TradeLifecycleStatus,
  TradeSide,
  TradeStatus,
} from '../types';
import {
  loadActiveTab,
  loadPendingTrades,
  loadRecentMarketIds,
  loadSettings,
  loadThemeMode,
  loadWatchlistIds,
  saveActiveTab,
  savePendingTrades,
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
  pendingTrades: PendingTradeRecord[];
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
  pollTradeStatus: (clientOrderId: string, startedAt?: number) => Promise<void>;
  recoverPendingTrades: () => Promise<void>;
  classifyTradeError: (error: unknown) => { category: RetryCategory; status: TradeLifecycleStatus; code: string };
  buildPositions: () => Position[];
}

const terminalStatuses = new Set<TradeLifecycleStatus>(['INDEXED', 'FINAL', 'FAILED_FATAL']);
const retryStatuses = new Set<TradeLifecycleStatus>(['PENDING_CHAIN', 'CONFIRMED', 'FAILED_RETRYABLE', 'SUBMITTING', 'DRAFT']);
const tradeTimers = new Map<string, ReturnType<typeof setTimeout>>();

function toTradeStatus(status: TradeLifecycleStatus): TradeStatus {
  switch (status) {
    case 'DRAFT':
    case 'SUBMITTING':
    case 'PENDING_CHAIN':
      return 'PENDING_CHAIN';
    case 'CONFIRMED':
      return 'CONFIRMED';
    case 'INDEXED':
    case 'FINAL':
      return 'INDEXED';
    case 'FAILED_RETRYABLE':
      return 'FAILED_RETRYABLE';
    case 'FAILED_FATAL':
      return 'FAILED_FATAL';
    case 'UNKNOWN_NEEDS_RECONCILE':
      return 'UNKNOWN_NEEDS_RECONCILE';
    default:
      return 'FAILED';
  }
}

function toActivityItem(record: PendingTradeRecord): ActivityItem {
  return {
    txHash: record.txHash ?? record.clientOrderId,
    marketId: record.marketId,
    marketQuestion: record.marketQuestion,
    action: record.action,
    side: record.side,
    amount: record.amount,
    status: toTradeStatus(record.status),
    createdAt: record.createdAt,
    errorMessage: record.lastErrorCode,
  };
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
  pendingTrades: [],
  pendingTxs: [],
  historyTxs: [],
  diagnostics: [],

  hydratePersisted: async () => {
    const [watchlistIds, recentMarketIds, tab, mode, rawSettings, pendingTrades] = await Promise.all([
      loadWatchlistIds(),
      loadRecentMarketIds(),
      loadActiveTab(),
      loadThemeMode(),
      loadSettings(),
      loadPendingTrades(),
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
      pendingTrades,
      pendingTxs: pendingTrades.map(toActivityItem),
    });
    await get().recoverPendingTrades();
  },

  loadMarkets: async () => {
    set((state) => ({
      loadingMarkets: false,
      marketError: null,
      diagnostics: [`${new Date().toISOString()} markets loading delegated to react-query`].concat(state.diagnostics).slice(0, 8),
    }));
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

  classifyTradeError: (error) => {
    if (error instanceof TimeoutError) {
      return { category: 'RETRYABLE' as const, status: 'FAILED_RETRYABLE' as const, code: 'TIMEOUT' };
    }

    if (error instanceof HTTPError) {
      if (error.response.status >= 500) {
        return { category: 'RETRYABLE' as const, status: 'FAILED_RETRYABLE' as const, code: `HTTP_${error.response.status}` };
      }

      if (error.response.status >= 400) {
        return { category: 'FATAL' as const, status: 'FAILED_FATAL' as const, code: `HTTP_${error.response.status}` };
      }
    }

    return { category: 'RECONCILE' as const, status: 'UNKNOWN_NEEDS_RECONCILE' as const, code: 'UNKNOWN' };
  },

  submitTrade: async ({ market, side, amount, action }) => {
    const clientOrderId = `co_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
    const now = new Date().toISOString();

    const baseRecord: PendingTradeRecord = {
      clientOrderId,
      marketId: market.id,
      marketQuestion: market.question,
      action,
      side,
      amount,
      status: 'SUBMITTING',
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      pendingTrades: [baseRecord, ...state.pendingTrades],
      pendingTxs: [toActivityItem(baseRecord), ...state.pendingTxs],
      diagnostics: [`${new Date().toISOString()} trade submitting ${clientOrderId}`].concat(state.diagnostics).slice(0, 8),
    }));
    void savePendingTrades(get().pendingTrades);

    try {
      const intent = await submitTradeIntent({
        marketId: market.id,
        action,
        side,
        amount,
        clientOrderId,
      });

      const updatedAt = new Date().toISOString();
      set((state) => {
        const pendingTrades: PendingTradeRecord[] = state.pendingTrades.map((item) => {
          if (item.clientOrderId !== clientOrderId) {
            return item;
          }

          const next: PendingTradeRecord = {
            ...item,
            txHash: intent.txHash,
            status: 'PENDING_CHAIN',
            updatedAt,
          };

          return next;
        });

        return {
          pendingTrades,
          pendingTxs: pendingTrades.map(toActivityItem),
          diagnostics: [`${updatedAt} trade accepted ${intent.txHash}`].concat(state.diagnostics).slice(0, 8),
        };
      });
      void savePendingTrades(get().pendingTrades);

      await get().pollTradeStatus(clientOrderId, Date.now());
    } catch (error) {
      const classification = get().classifyTradeError(error);
      const updatedAt = new Date().toISOString();
      if (classification.category === 'FATAL') {
        set((state) => {
          const target = state.pendingTrades.find((item) => item.clientOrderId === clientOrderId);
          if (!target) {
            return state;
          }

          const failed: PendingTradeRecord = {
            ...target,
            status: classification.status,
            lastErrorCode: classification.code,
            updatedAt,
          };
          const pendingTrades = state.pendingTrades.filter((item) => item.clientOrderId !== clientOrderId);
          return {
            pendingTrades,
            pendingTxs: pendingTrades.map(toActivityItem),
            historyTxs: [toActivityItem(failed), ...state.historyTxs],
            diagnostics: [`${updatedAt} trade fatal ${classification.code}`].concat(state.diagnostics).slice(0, 8),
          };
        });
      } else {
        set((state) => {
          const pendingTrades: PendingTradeRecord[] = state.pendingTrades.map((item) => {
            if (item.clientOrderId !== clientOrderId) {
              return item;
            }

            const next: PendingTradeRecord = {
              ...item,
              status: classification.status,
              retryCount: item.retryCount + 1,
              lastErrorCode: classification.code,
              nextRetryAt: new Date(Date.now() + 2000).toISOString(),
              updatedAt,
            };

            return next;
          });

          return {
            pendingTrades,
            pendingTxs: pendingTrades.map(toActivityItem),
            diagnostics: [`${updatedAt} trade recoverable ${classification.code}`].concat(state.diagnostics).slice(0, 8),
          };
        });
      }
      void savePendingTrades(get().pendingTrades);
    }
  },

  pollTradeStatus: async (clientOrderId, startedAt = Date.now()) => {
    const record = get().pendingTrades.find((item) => item.clientOrderId === clientOrderId);
    if (!record) {
      const timer = tradeTimers.get(clientOrderId);
      if (timer) {
        clearTimeout(timer);
      }
      tradeTimers.delete(clientOrderId);
      return;
    }

    if (Date.now() - startedAt > 10 * 60 * 1000) {
      const updatedAt = new Date().toISOString();
      set((state) => {
        const pendingTrades: PendingTradeRecord[] = state.pendingTrades.map((item) => {
          if (item.clientOrderId !== clientOrderId) {
            return item;
          }

          const next: PendingTradeRecord = {
            ...item,
            status: 'UNKNOWN_NEEDS_RECONCILE',
            updatedAt,
            lastErrorCode: 'POLL_TIMEOUT',
          };

          return next;
        });
        return {
          pendingTrades,
          pendingTxs: pendingTrades.map(toActivityItem),
          diagnostics: [`${updatedAt} trade reconcile timeout ${clientOrderId}`].concat(state.diagnostics).slice(0, 8),
        };
      });
      void savePendingTrades(get().pendingTrades);
      return;
    }

    try {
      const status = await fetchTradeStatus(record.txHash ?? record.clientOrderId);
      const updatedAt = status.updatedAt ?? new Date().toISOString();
      let shouldSchedule = false;

      set((state) => {
        const target = state.pendingTrades.find((item) => item.clientOrderId === clientOrderId);
        if (!target) {
          return state;
        }

        const merged: PendingTradeRecord = {
          ...target,
          txHash: status.txHash ?? target.txHash,
          status: status.status,
          lastErrorCode: status.errorCode,
          updatedAt,
        };

        if (terminalStatuses.has(merged.status)) {
          const pendingTrades = state.pendingTrades.filter((item) => item.clientOrderId !== clientOrderId);
          return {
            pendingTrades,
            pendingTxs: pendingTrades.map(toActivityItem),
            historyTxs: [toActivityItem(merged), ...state.historyTxs],
            diagnostics: [`${updatedAt} trade terminal ${merged.status}`].concat(state.diagnostics).slice(0, 8),
          };
        }

        shouldSchedule = retryStatuses.has(merged.status);
        const pendingTrades = state.pendingTrades.map((item) => (item.clientOrderId === clientOrderId ? merged : item));
        return {
          pendingTrades,
          pendingTxs: pendingTrades.map(toActivityItem),
          diagnostics: [`${updatedAt} trade polled ${merged.status}`].concat(state.diagnostics).slice(0, 8),
        };
      });

      void savePendingTrades(get().pendingTrades);

      if (shouldSchedule) {
        const elapsed = Date.now() - startedAt;
        const delay = elapsed < 30000 ? 2000 : elapsed < 180000 ? 8000 : 30000;
        const currentTimer = tradeTimers.get(clientOrderId);
        if (currentTimer) {
          clearTimeout(currentTimer);
        }
        const timer = setTimeout(() => {
          void get().pollTradeStatus(clientOrderId, startedAt);
        }, delay);
        tradeTimers.set(clientOrderId, timer);
      } else {
        const currentTimer = tradeTimers.get(clientOrderId);
        if (currentTimer) {
          clearTimeout(currentTimer);
        }
        tradeTimers.delete(clientOrderId);
      }
    } catch (error) {
      const classification = get().classifyTradeError(error);
      const updatedAt = new Date().toISOString();

      set((state) => {
        const pendingTrades: PendingTradeRecord[] = state.pendingTrades.map((item) => {
          if (item.clientOrderId !== clientOrderId) {
            return item;
          }

          const next: PendingTradeRecord = {
            ...item,
            status: classification.status,
            retryCount: item.retryCount + 1,
            nextRetryAt: new Date(Date.now() + Math.min(30000, 2 ** (item.retryCount + 1) * 1000)).toISOString(),
            lastErrorCode: classification.code,
            updatedAt,
          };

          return next;
        });

        return {
          pendingTrades,
          pendingTxs: pendingTrades.map(toActivityItem),
          diagnostics: [`${updatedAt} trade poll error ${classification.code}`].concat(state.diagnostics).slice(0, 8),
        };
      });

      void savePendingTrades(get().pendingTrades);

      if (classification.category === 'RETRYABLE') {
        const timer = setTimeout(() => {
          void get().pollTradeStatus(clientOrderId, startedAt);
        }, 2000);
        tradeTimers.set(clientOrderId, timer);
      }
    }
  },

  recoverPendingTrades: async () => {
    const records = await loadPendingTrades();
    set({
      pendingTrades: records,
      pendingTxs: records.map(toActivityItem),
    });

    records.forEach((record, index) => {
      if (!retryStatuses.has(record.status)) {
        return;
      }

      const timer = setTimeout(() => {
        void get().pollTradeStatus(record.clientOrderId);
      }, Math.min(index * 350, 1500));
      tradeTimers.set(record.clientOrderId, timer);
    });
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
