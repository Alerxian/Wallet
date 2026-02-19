import ky from 'ky';
import { z } from 'zod';
import { mockMarkets } from '../data/mockMarkets';
import { Market } from '../types';

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

const api = ky.create({
  prefixUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  timeout: 8000,
});

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
