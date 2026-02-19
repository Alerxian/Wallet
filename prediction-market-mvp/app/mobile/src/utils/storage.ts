import AsyncStorage from '@react-native-async-storage/async-storage';
import { PendingTradeRecord, TradeAction, TradeLifecycleStatus, TradeSide } from '../types';

const WATCHLIST_KEY = 'watchlist_ids';
const RECENT_KEY = 'recent_market_ids';
const TAB_KEY = 'active_tab';
const THEME_KEY = 'theme_mode';
const SETTINGS_KEY = 'app_settings';
const PENDING_TRADES_KEY = 'pending_trades';

const tradeLifecycleStatuses: TradeLifecycleStatus[] = [
  'DRAFT',
  'SUBMITTING',
  'PENDING_CHAIN',
  'CONFIRMED',
  'INDEXED',
  'FAILED_RETRYABLE',
  'FAILED_FATAL',
  'UNKNOWN_NEEDS_RECONCILE',
  'FINAL',
];
const tradeActions: TradeAction[] = ['BUY', 'SELL'];
const tradeSides: TradeSide[] = ['YES', 'NO'];
const tradeActionSet = new Set<string>(tradeActions);
const tradeSideSet = new Set<string>(tradeSides);
const tradeLifecycleStatusSet = new Set<string>(tradeLifecycleStatuses);

function isTradeAction(value: unknown): value is TradeAction {
  return typeof value === 'string' && tradeActionSet.has(value);
}

function isTradeSide(value: unknown): value is TradeSide {
  return typeof value === 'string' && tradeSideSet.has(value);
}

function isTradeLifecycleStatus(value: unknown): value is TradeLifecycleStatus {
  return typeof value === 'string' && tradeLifecycleStatusSet.has(value);
}

function parseArray(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parsePendingTrades(raw: string | null): PendingTradeRecord[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is PendingTradeRecord => {
      if (!isObject(item)) {
        return false;
      }

      const txHashValid = item.txHash === undefined || typeof item.txHash === 'string';
      const nextRetryAtValid = item.nextRetryAt === undefined || typeof item.nextRetryAt === 'string';
      const lastErrorCodeValid = item.lastErrorCode === undefined || typeof item.lastErrorCode === 'string';

      return (
        typeof item.clientOrderId === 'string' &&
        typeof item.marketId === 'string' &&
        isTradeAction(item.action) &&
        isTradeSide(item.side) &&
        typeof item.amount === 'number' &&
        isTradeLifecycleStatus(item.status) &&
        typeof item.retryCount === 'number' &&
        typeof item.createdAt === 'string' &&
        typeof item.updatedAt === 'string' &&
        txHashValid &&
        nextRetryAtValid &&
        lastErrorCodeValid
      );
    });
  } catch {
    return [];
  }
}

export async function loadWatchlistIds(): Promise<string[]> {
  return parseArray(await AsyncStorage.getItem(WATCHLIST_KEY));
}

export async function saveWatchlistIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(ids));
}

export async function loadRecentMarketIds(): Promise<string[]> {
  return parseArray(await AsyncStorage.getItem(RECENT_KEY));
}

export async function saveRecentMarketIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(ids));
}

export async function loadActiveTab(): Promise<string | null> {
  return AsyncStorage.getItem(TAB_KEY);
}

export async function saveActiveTab(tab: string): Promise<void> {
  await AsyncStorage.setItem(TAB_KEY, tab);
}

export async function loadThemeMode(): Promise<string | null> {
  return AsyncStorage.getItem(THEME_KEY);
}

export async function saveThemeMode(mode: string): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, mode);
}

export async function loadSettings(): Promise<Record<string, unknown> | null> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function saveSettings(settings: Record<string, unknown>): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function loadPendingTrades(): Promise<PendingTradeRecord[]> {
  return parsePendingTrades(await AsyncStorage.getItem(PENDING_TRADES_KEY));
}

export async function savePendingTrades(records: PendingTradeRecord[]): Promise<void> {
  await AsyncStorage.setItem(PENDING_TRADES_KEY, JSON.stringify(records));
}
