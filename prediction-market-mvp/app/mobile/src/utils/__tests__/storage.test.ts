const mockMemory = new Map<string, string | null>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockMemory.get(key) ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockMemory.set(key, value);
    return Promise.resolve();
  }),
}));

import type { PendingTradeRecord } from '../../types';
import {
  loadPendingTrades,
  loadRecentMarketIds,
  loadWatchlistIds,
  savePendingTrades,
  saveRecentMarketIds,
  saveWatchlistIds,
} from '../storage';

describe('storage utilities', () => {
  beforeEach(() => {
    mockMemory.clear();
  });

  it('persists and loads watchlist and recent ids', async () => {
    await saveWatchlistIds(['MKT-1', 'MKT-2']);
    await saveRecentMarketIds(['MKT-3']);

    await expect(loadWatchlistIds()).resolves.toEqual(['MKT-1', 'MKT-2']);
    await expect(loadRecentMarketIds()).resolves.toEqual(['MKT-3']);
  });

  it('persists and loads pending trades', async () => {
    const records: PendingTradeRecord[] = [
      {
        clientOrderId: 'order-1',
        txHash: '0xabc',
        marketId: 'MKT-1',
        marketQuestion: 'Will ETH close above 5k by Friday?',
        action: 'BUY',
        side: 'YES',
        amount: 25,
        status: 'PENDING_CHAIN',
        retryCount: 1,
        nextRetryAt: '2026-02-19T16:00:00.000Z',
        lastErrorCode: 'NETWORK_TIMEOUT',
        createdAt: '2026-02-19T15:59:00.000Z',
        updatedAt: '2026-02-19T16:00:00.000Z',
      },
    ];

    await savePendingTrades(records);
    await expect(loadPendingTrades()).resolves.toEqual(records);
  });

  it('returns empty pending trades on malformed payload', async () => {
    mockMemory.set('pending_trades', '{bad_json');
    await expect(loadPendingTrades()).resolves.toEqual([]);
  });

  it('filters invalid pending trade records and keeps valid ones', async () => {
    mockMemory.set(
      'pending_trades',
      JSON.stringify([
        {
          clientOrderId: 'order-2',
          marketId: 'MKT-2',
          marketQuestion: 'Will BTC reclaim ATH?',
          action: 'SELL',
          side: 'NO',
          amount: 10,
          status: 'CONFIRMED',
          retryCount: 0,
          createdAt: '2026-02-19T16:10:00.000Z',
          updatedAt: '2026-02-19T16:10:00.000Z',
        },
        {
          clientOrderId: 'broken',
          marketId: 'MKT-3',
          marketQuestion: 'Broken record',
          action: 'HOLD',
          side: 'NO',
          amount: 10,
          status: 'CONFIRMED',
          retryCount: 0,
          createdAt: '2026-02-19T16:10:00.000Z',
          updatedAt: '2026-02-19T16:10:00.000Z',
        },
      ]),
    );

    await expect(loadPendingTrades()).resolves.toEqual([
      {
        clientOrderId: 'order-2',
        marketId: 'MKT-2',
        marketQuestion: 'Will BTC reclaim ATH?',
        action: 'SELL',
        side: 'NO',
        amount: 10,
        status: 'CONFIRMED',
        retryCount: 0,
        createdAt: '2026-02-19T16:10:00.000Z',
        updatedAt: '2026-02-19T16:10:00.000Z',
      },
    ]);
  });
});
