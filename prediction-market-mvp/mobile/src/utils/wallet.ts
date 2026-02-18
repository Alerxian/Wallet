import { ANVIL_CHAIN_ID } from "../config/env";
import type { WalletSession } from "../domain/types";

export function walletChainRef(session: WalletSession): string {
  const account = session.namespaces.eip155?.accounts?.[0] || "";
  const parts = account.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return `eip155:${ANVIL_CHAIN_ID}`;
}

export function walletChainId(session: WalletSession): number {
  const raw = Number(walletChainRef(session).split(":")[1]);
  return Number.isFinite(raw) ? raw : ANVIL_CHAIN_ID;
}

export function walletAccount(session: WalletSession): string {
  const account = session.namespaces.eip155?.accounts?.[0] || "";
  return (account.split(":").pop() || "").toLowerCase();
}
