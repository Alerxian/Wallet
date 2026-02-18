import { z } from "zod";
import { ApiClient } from "../api/client";
import {
  historySchema,
  marketDetailSchema,
  marketSummarySchema,
  nonceSchema,
  positionSchema,
  sessionSchema,
  txIntentSchema,
  txStatusSchema,
  verifySchema,
} from "../api/schemas";
import type { TradeAction, TradeSide } from "../domain/types";

export function createBackend(client: ApiClient) {
  return {
    getMarkets: () => client.get("markets", z.array(marketSummarySchema)),
    getMarketDetail: (marketId: string) => client.get(`markets/${marketId}`, marketDetailSchema),
    getNonce: (address: string) => client.get(`auth/siwe/nonce?address=${encodeURIComponent(address)}`, nonceSchema),
    verifySiwe: (message: string, signature: string) => client.post("auth/siwe/verify", verifySchema, { json: { message, signature } }),
    getSession: () => client.get("auth/siwe/session", sessionSchema),
    logout: () => client.post("auth/siwe/logout", z.any()),
    getPositions: (walletAddress: string) =>
      client.get(`trades/positions?walletAddress=${encodeURIComponent(walletAddress)}`, z.array(positionSchema)),
    getHistory: (walletAddress: string) =>
      client.get(`trades/history?walletAddress=${encodeURIComponent(walletAddress)}&limit=50`, z.array(historySchema)),
    getTradeStatus: (txHash: string) => client.get(`trades/status/${txHash}`, txStatusSchema),
    createApproveIntent: (marketId: string, walletAddress: string, amount: string) =>
      client.post("trades/approve-intent", txIntentSchema, { json: { marketId, walletAddress, amount } }),
    createTradeIntent: (marketId: string, walletAddress: string, amount: string, action: TradeAction, side: TradeSide) =>
      client.post("trades/intent", txIntentSchema, { json: { marketId, walletAddress, amount, action, side } }),
  };
}
