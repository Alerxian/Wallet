import ky from 'ky';
import { z } from 'zod';
import { mockMarkets } from '../data/mockMarkets';
import { Market, TradeAction, TradeLifecycleStatus, TradeSide } from '../types';

const marketSchema = z.object({
  id: z.string(),
  question: z.string(),
  status: z.enum(['OPEN', 'CLOSED', 'RESOLVED']),
  closeTime: z.string(),
  address: z.string(),
  yesPool: z.number().default(0),
  noPool: z.number().default(0),
});

const marketsSchema = z.array(marketSchema);

const tradeIntentResponseSchema = z.object({
  txHash: z.string(),
  acceptedAt: z.string().optional(),
});

const tradeStatusSchema = z.object({
  txHash: z.string().optional(),
  status: z.enum([
    'DRAFT',
    'SUBMITTING',
    'PENDING_CHAIN',
    'CONFIRMED',
    'INDEXED',
    'FAILED_RETRYABLE',
    'FAILED_FATAL',
    'UNKNOWN_NEEDS_RECONCILE',
    'FINAL',
  ]),
  errorCode: z.string().optional(),
  updatedAt: z.string().optional(),
});

const api = ky.create({
  prefixUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  timeout: 8000,
});

export interface SubmitTradeIntentInput {
  marketId: string;
  action: TradeAction;
  side: TradeSide;
  amount: number;
  clientOrderId: string;
}

export interface TradeStatusResult {
  txHash?: string;
  status: TradeLifecycleStatus;
  errorCode?: string;
  updatedAt: string;
}

export async function fetchMarkets(): Promise<Market[]> {
  try {
    const result = await api.get('markets').json();
    return marketsSchema.parse(result);
  } catch {
    return mockMarkets;
  }
}

export async function fetchMarketById(id: string): Promise<Market | null> {
  try {
    const result = await api.get(`markets/${id}`).json();
    return marketSchema.parse(result);
  } catch {
    return mockMarkets.find((market) => market.id === id) ?? null;
  }
}

export async function submitTradeIntent(input: SubmitTradeIntentInput): Promise<{ txHash: string; acceptedAt: string }> {
  const result = await api
    .post('trades/intent', {
      headers: {
        'idempotency-key': input.clientOrderId,
      },
      json: input,
    })
    .json();

  const parsed = tradeIntentResponseSchema.parse(result);
  return {
    txHash: parsed.txHash,
    acceptedAt: parsed.acceptedAt ?? new Date().toISOString(),
  };
}

export async function fetchTradeStatus(reference: string): Promise<TradeStatusResult> {
  const result = await api.get(`trades/status/${reference}`).json();
  const parsed = tradeStatusSchema.parse(result);
  return {
    txHash: parsed.txHash,
    status: parsed.status,
    errorCode: parsed.errorCode,
    updatedAt: parsed.updatedAt ?? new Date().toISOString(),
  };
}
