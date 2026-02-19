export type MainTab = 'MARKETS' | 'PORTFOLIO' | 'ACTIVITY' | 'SETTINGS';
export type ThemeMode = 'sand' | 'night';

export type MarketStatus = 'OPEN' | 'CLOSED' | 'RESOLVED';
export type TradeSide = 'YES' | 'NO';
export type TradeAction = 'BUY' | 'SELL';
export type TradeStatus =
  | 'PENDING'
  | 'PENDING_CHAIN'
  | 'CONFIRMED'
  | 'INDEXED'
  | 'FAILED'
  | 'FAILED_RETRYABLE'
  | 'FAILED_FATAL'
  | 'UNKNOWN_NEEDS_RECONCILE';
export type TradeLifecycleStatus =
  | 'DRAFT'
  | 'SUBMITTING'
  | 'PENDING_CHAIN'
  | 'CONFIRMED'
  | 'INDEXED'
  | 'FAILED_RETRYABLE'
  | 'FAILED_FATAL'
  | 'UNKNOWN_NEEDS_RECONCILE'
  | 'FINAL';
export type RetryCategory = 'RETRYABLE' | 'FATAL' | 'RECONCILE';

export interface Market {
  id: string;
  question: string;
  status: MarketStatus;
  closeTime: string;
  address: string;
  yesPool: number;
  noPool: number;
}

export interface ActivityItem {
  txHash: string;
  marketId: string;
  marketQuestion: string;
  action: TradeAction;
  side: TradeSide;
  amount: number;
  status: TradeStatus;
  createdAt: string;
  errorMessage?: string;
}

export interface PendingTradeRecord {
  clientOrderId: string;
  txHash?: string;
  marketId: string;
  marketQuestion: string;
  action: TradeAction;
  side: TradeSide;
  amount: number;
  status: TradeLifecycleStatus;
  retryCount: number;
  nextRetryAt?: string;
  lastErrorCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  marketId: string;
  marketQuestion: string;
  status: MarketStatus;
  yesShares: number;
  noShares: number;
}

export interface ActivityFilters {
  statuses: TradeStatus[];
  actions: TradeAction[];
}

export type SortMode = 'CLOSE_DESC' | 'CLOSE_ASC' | 'ID_DESC';

export interface MarketFilters {
  status: 'ALL' | MarketStatus;
  time: 'ALL' | 'CLOSING_SOON' | 'ENDED';
  watchlistOnly: boolean;
}

export interface AppSettings {
  notifications: boolean;
  biometric: boolean;
  reducedMotion: boolean;
  autoRefresh: boolean;
  currency: 'USDC' | 'USD';
  language: 'EN' | 'ZH';
}
