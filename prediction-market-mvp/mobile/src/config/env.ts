export const ANVIL_CHAIN_ID = 31337;
export const API_BASE = (process.env.EXPO_PUBLIC_API_BASE || "http://127.0.0.1:3001").trim();
export const WALLETCONNECT_PROJECT_ID = (process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || "").trim();
export const RELAY_PRIMARY = "wss://relay.walletconnect.com";
export const RELAY_FALLBACK = "wss://relay.walletconnect.org";
export const APP_SCHEME = "predictionmvp://";

export const STORAGE_KEYS = {
  tab: "pm_tab_v2",
  wallet: "pm_wallet_v2",
  authToken: "pm_auth_token_v2",
  authExpiresAt: "pm_auth_exp_v2",
} as const;
