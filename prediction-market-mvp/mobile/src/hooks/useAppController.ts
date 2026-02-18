import { useEffect, useMemo, useRef } from "react";
import { Alert, AppState, Linking } from "react-native";
import type SignClient from "@walletconnect/sign-client";
import { ANVIL_CHAIN_ID, API_BASE, STORAGE_KEYS } from "../config/env";
import type { PendingTx, RuntimeError, TradeAction, WalletPhase, WalletSession } from "../domain/types";
import { ApiClient } from "../api/client";
import { createBackend } from "../services/backend";
import { storage } from "../services/storage";
import { initWalletClient, signMessage } from "../services/walletconnect";
import { useStore } from "../state/store";
import { wait, errorMessage, withTimeout } from "../utils/common";
import { composeSiwe } from "../utils/siwe";
import { unifyActivity, validAmount } from "../utils/trade";
import { walletAccount, walletChainId, walletChainRef } from "../utils/wallet";

export function useAppController() {
  const state = useStore();
  const errorId = useRef(0);
  const signClientInitRef = useRef<Promise<SignClient> | null>(null);

  const unauthorized = () => clearSession("Please reconnect wallet and sign in again.");

  const api = useMemo(() => {
    const client = new ApiClient({
      baseUrl: API_BASE,
      tokenProvider: () => useStore.getState().authToken,
      onUnauthorized: unauthorized,
    });
    return createBackend(client);
  }, []);

  const addError = (scope: string, err: unknown, title?: string) => {
    errorId.current += 1;
    const next: RuntimeError = {
      id: errorId.current,
      time: Date.now(),
      scope,
      message: errorMessage(err),
    };
    useStore.setState((prev) => ({ ...prev, errors: [next, ...prev.errors].slice(0, 20) }));
    if (title) {
      Alert.alert(title, next.message);
    }
  };

  const phaseLabel = (phase: WalletPhase) => {
    switch (phase) {
      case "IDLE":
        return "Idle";
      case "INIT":
        return "Init wallet client";
      case "PAIRING":
        return "Create WalletConnect session";
      case "APPROVAL":
        return "Waiting wallet approval";
      case "SIGNED":
        return "Wallet signed";
      case "NONCE":
        return "Request SIWE nonce";
      case "VERIFYING":
        return "Verify SIWE";
      case "AUTHED":
        return "Authenticated";
      case "RECOVERING":
        return "Recovering session";
      default:
        return "Failed";
    }
  };

  const clearSession = (reason?: string) => {
    void storage.secureDelete(STORAGE_KEYS.authToken);
    void storage.secureDelete(STORAGE_KEYS.authExpiresAt);
    useStore.setState((prev) => ({
      ...prev,
      walletAddress: "",
      authToken: "",
      authExpiresAt: 0,
      walletSession: null,
      walletPhase: "IDLE",
      positions: [],
      history: [],
      pendingTxs: [],
    }));
    if (reason) {
      Alert.alert("Session ended", reason);
    }
  };

  const loadMarkets = async () => {
    useStore.setState((prev) => ({ ...prev, marketLoading: true }));
    try {
      const markets = await api.getMarkets();
      useStore.setState((prev) => ({ ...prev, markets }));
    } catch (err) {
      addError("loadMarkets", err, "Cannot reach backend");
    } finally {
      useStore.setState((prev) => ({ ...prev, marketLoading: false }));
    }
  };

  const loadMarketDetail = async (marketId: string) => {
    useStore.setState((prev) => ({ ...prev, detailLoading: true }));
    try {
      const marketDetail = await api.getMarketDetail(marketId);
      useStore.setState((prev) => ({ ...prev, marketDetail }));
    } catch (err) {
      addError("loadMarketDetail", err, "Load detail failed");
    } finally {
      useStore.setState((prev) => ({ ...prev, detailLoading: false }));
    }
  };

  const loadPositions = async (walletOverride?: string) => {
    const wallet = (walletOverride || useStore.getState().walletAddress).toLowerCase();
    if (!wallet || !useStore.getState().authToken) {
      return;
    }
    useStore.setState((prev) => ({ ...prev, positionsLoading: true }));
    try {
      const positions = await api.getPositions(wallet);
      useStore.setState((prev) => ({ ...prev, positions }));
    } catch (err) {
      addError("loadPositions", err, "Positions load failed");
    } finally {
      useStore.setState((prev) => ({ ...prev, positionsLoading: false }));
    }
  };

  const loadHistory = async (walletOverride?: string) => {
    const wallet = (walletOverride || useStore.getState().walletAddress).toLowerCase();
    if (!wallet || !useStore.getState().authToken) {
      return;
    }
    useStore.setState((prev) => ({ ...prev, historyLoading: true }));
    try {
      const history = await api.getHistory(wallet);
      useStore.setState((prev) => ({ ...prev, history }));
    } catch (err) {
      addError("loadHistory", err, "History load failed");
    } finally {
      useStore.setState((prev) => ({ ...prev, historyLoading: false }));
    }
  };

  const refreshPending = async () => {
    const { pendingTxs, selectedMarketId, walletAddress } = useStore.getState();
    const checking = pendingTxs.filter((row) => row.state === "PENDING" || row.state === "CONFIRMED");
    if (!checking.length) {
      return;
    }

    const updates = await Promise.all(
      checking.map(async (row) => {
        try {
          const status = await api.getTradeStatus(row.txHash);
          return { txHash: row.txHash, state: status.state, updatedAt: Date.now() };
        } catch {
          return null;
        }
      }),
    );

    const nonNull = updates.filter(Boolean) as Array<{ txHash: string; state: PendingTx["state"]; updatedAt: number }>;
    if (!nonNull.length) {
      return;
    }

    let indexed = false;
    useStore.setState((prev) => ({
      ...prev,
      pendingTxs: prev.pendingTxs.map((row) => {
        const update = nonNull.find((next) => next.txHash === row.txHash);
        if (!update) return row;
        if (update.state === "INDEXED") indexed = true;
        return { ...row, state: update.state, updatedAt: update.updatedAt };
      }),
    }));

    if (indexed) {
      if (selectedMarketId) void loadMarketDetail(selectedMarketId);
      void loadMarkets();
      if (walletAddress) {
        void loadHistory();
        void loadPositions();
      }
    }
  };

  const ensureClient = async (force = false) => {
    const current = useStore.getState();
    const { client, relay } = await initWalletClient(current.signClient, signClientInitRef, current.walletRelay, force);
    useStore.setState((prev) => ({ ...prev, signClient: client, walletRelay: relay, walletClientReady: true, walletError: "" }));
    return client;
  };

  const authenticate = async (client: SignClient, session: WalletSession, address: string) => {
    useStore.setState((prev) => ({ ...prev, walletPhase: "NONCE" }));
    const nonce = await api.getNonce(address);
    const siwe = composeSiwe(address, nonce.nonce, walletChainId(session), API_BASE);
    await wait(300);
    useStore.setState((prev) => ({ ...prev, walletPhase: "VERIFYING" }));
    const signature = await signMessage(client, session, walletChainRef(session), address, siwe);
    const verify = await api.verifySiwe(siwe, signature);
    useStore.setState((prev) => ({
      ...prev,
      authToken: verify.session.token,
      authExpiresAt: verify.session.expiresAt,
      walletPhase: "AUTHED",
    }));
  };

  const connectWallet = async () => {
    useStore.setState((prev) => ({ ...prev, walletConnecting: true, walletError: "", walletPhase: "INIT" }));

    try {
      let client = await ensureClient();
      useStore.setState((prev) => ({ ...prev, walletPhase: "PAIRING" }));

      const connectArgs = {
        requiredNamespaces: {
          eip155: {
            methods: ["eth_sendTransaction", "personal_sign", "eth_signTypedData_v4"],
            chains: ["eip155:1"],
            events: ["accountsChanged", "chainChanged"],
          },
        },
        optionalNamespaces: {
          eip155: {
            methods: ["eth_sendTransaction", "personal_sign", "eth_signTypedData_v4"],
            chains: ["eip155:1", "eip155:11155111", `eip155:${ANVIL_CHAIN_ID}`],
            events: ["accountsChanged", "chainChanged"],
          },
        },
      };

      let sessionResult;
      try {
        sessionResult = await withTimeout(client.connect(connectArgs), 20000, "Wallet connection timed out");
      } catch (err) {
        const msg = errorMessage(err).toLowerCase();
        if (!(msg.includes("relay") || msg.includes("timeout") || msg.includes("publish custom payload"))) {
          throw err;
        }

        useStore.setState((prev) => ({ ...prev, walletError: "Relay unstable. Retrying..." }));
        await wait(300);
        client = await ensureClient(true);
        sessionResult = await withTimeout(client.connect(connectArgs), 25000, "Wallet retry timed out");
      }

      const { uri, approval } = sessionResult;
      useStore.setState((prev) => ({ ...prev, walletPhase: "APPROVAL" }));
      if (uri) {
        const opened = await Linking.openURL(uri).then(
          () => true,
          () => false,
        );
        if (!opened) {
          Alert.alert("Open wallet", "Please open your wallet app and approve the WalletConnect request.");
        }
      }

      const approved = (await withTimeout(approval(), 240000, "Wallet approval timed out")) as unknown as WalletSession;
      useStore.setState((prev) => ({ ...prev, walletSession: approved, walletPhase: "SIGNED" }));
      const address = walletAccount(approved);
      if (!address) {
        throw new Error("Wallet did not return an account");
      }

      useStore.setState((prev) => ({ ...prev, walletAddress: address }));
      await authenticate(client, approved, address);
      await Promise.all([loadPositions(address), loadHistory(address)]);
    } catch (err) {
      addError("connectWallet", err, "Login failed");
      useStore.setState((prev) => ({ ...prev, walletError: errorMessage(err), walletPhase: "FAILED" }));
    } finally {
      useStore.setState((prev) => ({ ...prev, walletConnecting: false }));
    }
  };

  const recoverWallet = async () => {
    const current = useStore.getState();
    if (current.recoveringSession || current.walletConnecting) {
      return;
    }

    useStore.setState((prev) => ({ ...prev, recoveringSession: true, walletPhase: "RECOVERING" }));
    try {
      const client = await ensureClient();
      const sessions = (client as unknown as { session?: { getAll?: () => WalletSession[] } }).session?.getAll?.() || [];
      if (!sessions.length) return;

      const latest = sessions[sessions.length - 1];
      const address = walletAccount(latest);
      if (!address) return;

      useStore.setState((prev) => ({ ...prev, walletSession: latest, walletAddress: address }));
      const { authToken, authExpiresAt } = useStore.getState();
      if (!authToken || authExpiresAt <= Date.now()) {
        await authenticate(client, latest, address);
      }

      await Promise.all([loadPositions(address), loadHistory(address)]);
      useStore.setState((prev) => ({ ...prev, walletPhase: "AUTHED" }));
    } catch (err) {
      addError("recoverWallet", err);
      useStore.setState((prev) => ({ ...prev, walletError: errorMessage(err), walletPhase: "FAILED" }));
    } finally {
      useStore.setState((prev) => ({ ...prev, recoveringSession: false }));
    }
  };

  const disconnectWallet = () => {
    if (useStore.getState().authToken) {
      void api.logout().catch(() => undefined);
    }
    clearSession();
  };

  const sendTx = async (tx: { to: string; data: string; value: string }) => {
    const { signClient, walletSession, walletAddress } = useStore.getState();
    if (!signClient || !walletSession || !walletAddress) {
      throw new Error("Wallet not connected");
    }

    return signClient.request({
      topic: walletSession.topic,
      chainId: walletChainRef(walletSession),
      request: {
        method: "eth_sendTransaction",
        params: [
          {
            from: walletAddress,
            to: tx.to,
            data: tx.data,
            value: tx.value || "0x0",
          },
        ],
      },
    });
  };

  const executeTrade = async (action: TradeAction) => {
    const current = useStore.getState();
    if (!current.marketDetail) return;
    if (!current.walletAddress || !current.authToken || !current.walletSession || !current.signClient) {
      Alert.alert("Wallet not connected", "Reconnect wallet before trading.");
      return;
    }
    if (walletChainId(current.walletSession) !== ANVIL_CHAIN_ID) {
      Alert.alert("Wrong wallet network", `Switch wallet to ${ANVIL_CHAIN_ID} for local trades.`);
      return;
    }
    if (!validAmount(current.tradeAmount)) {
      Alert.alert("Invalid amount", "Enter amount greater than 0.");
      return;
    }

    useStore.setState((prev) => ({ ...prev, walletSending: true }));
    try {
      if (action === "BUY") {
        const approve = await api.createApproveIntent(current.marketDetail.id, current.walletAddress, current.tradeAmount);
        const approveHash = await sendTx(approve.tx);
        useStore.setState((prev) => ({
          ...prev,
          pendingTxs: [
            {
              txHash: String(approveHash).toLowerCase(),
              marketId: current.marketDetail!.id,
              action: "APPROVE",
              side: current.tradeSide,
              amount: current.tradeAmount,
              state: "PENDING",
              updatedAt: Date.now(),
            },
            ...prev.pendingTxs,
          ],
        }));
      }

      const trade = await api.createTradeIntent(
        current.marketDetail.id,
        current.walletAddress,
        current.tradeAmount,
        action,
        current.tradeSide,
      );
      const txHash = await sendTx(trade.tx);
      useStore.setState((prev) => ({
        ...prev,
        pendingTxs: [
          {
            txHash: String(txHash).toLowerCase(),
            marketId: current.marketDetail!.id,
            action,
            side: current.tradeSide,
            amount: current.tradeAmount,
            state: "PENDING",
            updatedAt: Date.now(),
          },
          ...prev.pendingTxs,
        ],
      }));

      Alert.alert("Transaction submitted", `${action} ${current.tradeSide} ${current.tradeAmount} submitted.`);
      await Promise.all([loadMarketDetail(current.marketDetail.id), loadMarkets(), loadHistory(), loadPositions()]);
      useStore.setState((prev) => ({ ...prev, tab: "ACTIVITY" }));
    } catch (err) {
      addError("executeTrade", err, `${action} failed`);
    } finally {
      useStore.setState((prev) => ({ ...prev, walletSending: false }));
    }
  };

  useEffect(() => {
    void (async () => {
      const [tab, walletAddress, token, expires] = await Promise.all([
        storage.get(STORAGE_KEYS.tab),
        storage.get(STORAGE_KEYS.wallet),
        storage.secureGet(STORAGE_KEYS.authToken),
        storage.secureGet(STORAGE_KEYS.authExpiresAt),
      ]);

      if (tab === "MARKETS" || tab === "PORTFOLIO" || tab === "ACTIVITY" || tab === "SETTINGS") {
        useStore.setState((prev) => ({ ...prev, tab }));
      }
      if (walletAddress) {
        useStore.setState((prev) => ({ ...prev, walletAddress: walletAddress.toLowerCase() }));
      }
      const exp = Number(expires || 0);
      if (token && exp > Date.now()) {
        try {
          const tempApi = createBackend(
            new ApiClient({
              baseUrl: API_BASE,
              tokenProvider: () => token,
              onUnauthorized: () => undefined,
            }),
          );
          const session = await tempApi.getSession();
          useStore.setState((prev) => ({ ...prev, authToken: token, authExpiresAt: session.expiresAt, walletAddress: session.address.toLowerCase() }));
        } catch {
          useStore.setState((prev) => ({ ...prev, authToken: "", authExpiresAt: 0 }));
        }
      }
    })();

    void loadMarkets();
    void ensureClient().catch((err) => addError("ensureClient", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void storage.set(STORAGE_KEYS.tab, state.tab);
  }, [state.tab]);

  useEffect(() => {
    void storage.set(STORAGE_KEYS.wallet, state.walletAddress);
  }, [state.walletAddress]);

  useEffect(() => {
    const persist = async () => {
      if (state.authToken) {
        await storage.secureSet(STORAGE_KEYS.authToken, state.authToken);
      } else {
        await storage.secureDelete(STORAGE_KEYS.authToken);
      }

      if (state.authExpiresAt > 0) {
        await storage.secureSet(STORAGE_KEYS.authExpiresAt, String(state.authExpiresAt));
      } else {
        await storage.secureDelete(STORAGE_KEYS.authExpiresAt);
      }
    };
    void persist();
  }, [state.authToken, state.authExpiresAt]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        void recoverWallet();
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.selectedMarketId) {
      void loadMarketDetail(state.selectedMarketId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedMarketId]);

  useEffect(() => {
    if (!state.walletAddress || !state.authToken) return;
    if (state.tab === "PORTFOLIO") void loadPositions();
    if (state.tab === "ACTIVITY") void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.tab, state.walletAddress, state.authToken]);

  useEffect(() => {
    const exp = state.authExpiresAt;
    if (!exp) return;
    const remaining = exp - Date.now();
    if (remaining <= 0) {
      clearSession("Session expired. Please reconnect wallet.");
      return;
    }
    const timer = setTimeout(() => clearSession("Session expired. Please reconnect wallet."), remaining);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.authExpiresAt]);

  useEffect(() => {
    const inFlight = state.pendingTxs.some((row) => row.state === "PENDING" || row.state === "CONFIRMED");
    if (!inFlight) return;
    const timer = setInterval(() => {
      void refreshPending();
    }, 4000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pendingTxs]);

  const combinedActivity = useMemo(
    () => unifyActivity(state.pendingTxs, state.history, state.markets, state.walletAddress),
    [state.pendingTxs, state.history, state.markets, state.walletAddress],
  );

  const isAuthenticated = Boolean(state.walletAddress && state.authToken && state.authExpiresAt > Date.now());
  const isWalletConnected = Boolean(state.walletAddress && state.walletSession && state.signClient);
  const walletTag = state.walletAddress ? `${state.walletAddress.slice(0, 6)}...${state.walletAddress.slice(-4)}` : "Not connected";

  return {
    ...state,
    apiBase: API_BASE,
    isAuthenticated,
    isWalletConnected,
    walletTag,
    phaseText: phaseLabel(state.walletPhase),
    combinedActivity,
    setTab: state.setTab,
    setMarketId: (id: string | null) => useStore.setState((prev) => ({ ...prev, selectedMarketId: id })),
    setTradeAmount: (value: string) => useStore.setState((prev) => ({ ...prev, tradeAmount: value })),
    setTradeSide: (side: "YES" | "NO") => useStore.setState((prev) => ({ ...prev, tradeSide: side })),
    loadMarkets,
    loadPositions,
    loadHistory,
    connectWallet,
    disconnectWallet,
    executeTrade,
    clearTopError: () => useStore.setState((prev) => ({ ...prev, errors: prev.errors.slice(1) })),
  };
}
