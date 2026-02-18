import type SignClient from "@walletconnect/sign-client";

export type TabKey = "MARKETS" | "PORTFOLIO" | "ACTIVITY" | "SETTINGS";
export type TradeAction = "BUY" | "SELL";
export type TradeSide = "YES" | "NO";
export type TradeState = "PENDING" | "CONFIRMED" | "INDEXED" | "FAILED";

export type MarketSummary = {
  id: string;
  question: string;
  closeTime: number;
  status: string;
  marketAddress: string;
  createTxHash: string;
};

export type MarketDetail = MarketSummary & {
  yesPool?: string;
  noPool?: string;
};

export type PositionRow = {
  marketId: string;
  marketAddress: string;
  question: string;
  status: string;
  closeTime: number;
  yesShares: string;
  noShares: string;
  yesPool: string;
  noPool: string;
};

export type HistoryRow = {
  txHash: string;
  marketId: string;
  marketQuestion: string;
  marketAddress: string;
  walletAddress: string;
  action: TradeAction;
  side: TradeSide;
  amount: string;
  blockNumber: number;
  state: TradeState;
};

export type WalletSession = {
  topic: string;
  namespaces: {
    eip155?: {
      accounts: string[];
      methods: string[];
      events: string[];
    };
  };
  peer?: {
    metadata?: {
      redirect?: {
        native?: string;
        universal?: string;
      };
    };
  };
};

export type WalletPhase =
  | "IDLE"
  | "INIT"
  | "PAIRING"
  | "APPROVAL"
  | "SIGNED"
  | "NONCE"
  | "VERIFYING"
  | "AUTHED"
  | "RECOVERING"
  | "FAILED";

export type PendingTx = {
  txHash: string;
  marketId: string;
  action: TradeAction | "APPROVE";
  side: TradeSide;
  amount: string;
  state: TradeState;
  updatedAt: number;
};

export type RuntimeError = {
  id: number;
  time: number;
  scope: string;
  message: string;
};

export type WalletRuntime = {
  signClient: SignClient | null;
  session: WalletSession | null;
};
