import type SignClient from "@walletconnect/sign-client";
import { create } from "zustand";
import type {
  HistoryRow,
  MarketDetail,
  MarketSummary,
  PendingTx,
  PositionRow,
  RuntimeError,
  TabKey,
  TradeSide,
  WalletPhase,
  WalletSession,
} from "../domain/types";

type State = {
  tab: TabKey;
  setTab: (tab: TabKey) => void;

  markets: MarketSummary[];
  marketLoading: boolean;
  selectedMarketId: string | null;
  marketDetail: MarketDetail | null;
  detailLoading: boolean;

  positions: PositionRow[];
  positionsLoading: boolean;
  history: HistoryRow[];
  historyLoading: boolean;

  tradeAmount: string;
  tradeSide: TradeSide;
  pendingTxs: PendingTx[];
  walletSending: boolean;

  walletAddress: string;
  authToken: string;
  authExpiresAt: number;
  walletClientReady: boolean;
  walletConnecting: boolean;
  walletRelay: string;
  walletError: string;
  walletPhase: WalletPhase;
  recoveringSession: boolean;

  signClient: SignClient | null;
  walletSession: WalletSession | null;

  errors: RuntimeError[];

  patch: (next: Partial<State>) => void;
};

export const useStore = create<State>((set) => ({
  tab: "MARKETS",
  setTab: (tab) => set({ tab }),

  markets: [],
  marketLoading: false,
  selectedMarketId: null,
  marketDetail: null,
  detailLoading: false,

  positions: [],
  positionsLoading: false,
  history: [],
  historyLoading: false,

  tradeAmount: "10",
  tradeSide: "YES",
  pendingTxs: [],
  walletSending: false,

  walletAddress: "",
  authToken: "",
  authExpiresAt: 0,
  walletClientReady: false,
  walletConnecting: false,
  walletRelay: "",
  walletError: "",
  walletPhase: "IDLE",
  recoveringSession: false,

  signClient: null,
  walletSession: null,

  errors: [],

  patch: (next) => set((state) => ({ ...state, ...next })),
}));
