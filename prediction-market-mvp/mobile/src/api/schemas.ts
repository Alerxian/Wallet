import { z } from "zod";

export const marketSummarySchema = z.object({
  id: z.string(),
  question: z.string(),
  closeTime: z.number(),
  status: z.string(),
  marketAddress: z.string(),
  createTxHash: z.string(),
});

export const marketDetailSchema = marketSummarySchema.extend({
  yesPool: z.string().optional(),
  noPool: z.string().optional(),
});

export const positionSchema = z.object({
  marketId: z.string(),
  marketAddress: z.string(),
  question: z.string(),
  status: z.string(),
  closeTime: z.number(),
  yesShares: z.string(),
  noShares: z.string(),
  yesPool: z.string(),
  noPool: z.string(),
});

export const historySchema = z.object({
  txHash: z.string(),
  marketId: z.string(),
  marketQuestion: z.string(),
  marketAddress: z.string(),
  walletAddress: z.string(),
  action: z.enum(["BUY", "SELL"]),
  side: z.enum(["YES", "NO"]),
  amount: z.string(),
  blockNumber: z.number(),
  state: z.enum(["PENDING", "CONFIRMED", "INDEXED", "FAILED"]),
});

export const nonceSchema = z.object({ nonce: z.string() });
export const verifySchema = z.object({ session: z.object({ token: z.string(), expiresAt: z.number() }) });
export const sessionSchema = z.object({ address: z.string(), expiresAt: z.number() });
export const txIntentSchema = z.object({ tx: z.object({ to: z.string(), data: z.string(), value: z.string() }) });
export const txStatusSchema = z.object({ state: z.enum(["PENDING", "CONFIRMED", "INDEXED", "FAILED"]) });
