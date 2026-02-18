import type { HistoryRow, MarketSummary, PendingTx } from "../domain/types";

export function validAmount(value: string): boolean {
  const n = Number(value);
  return Boolean(value) && Number.isFinite(n) && n > 0;
}

export function unifyActivity(
  pending: PendingTx[],
  history: HistoryRow[],
  markets: MarketSummary[],
  walletAddress: string,
) {
  const local = pending.map((row) => ({
    txHash: row.txHash,
    marketId: row.marketId,
    marketQuestion: markets.find((m) => m.id === row.marketId)?.question || "",
    marketAddress: "",
    walletAddress,
    action: row.action === "APPROVE" ? "BUY" : row.action,
    side: row.side,
    amount: row.amount,
    blockNumber: 0,
    state: row.state,
    updatedAt: row.updatedAt,
    local: true as const,
  }));

  const map = new Map<string, (typeof local)[number] | (HistoryRow & { updatedAt: number; local: false })>();
  local.forEach((row) => map.set(row.txHash, row));
  history.forEach((row) => map.set(row.txHash, { ...row, updatedAt: row.blockNumber, local: false }));
  return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}
