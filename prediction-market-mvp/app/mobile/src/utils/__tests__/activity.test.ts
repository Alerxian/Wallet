import { filterActivity, mergeAndDedupeActivity } from '../activity';
import { ActivityItem } from '../../types';

const base: ActivityItem = {
  txHash: '0x1',
  marketId: 'MKT-1',
  marketQuestion: 'Q',
  action: 'BUY',
  side: 'YES',
  amount: 10,
  status: 'PENDING',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('activity utils', () => {
  it('dedupes by tx hash and keeps latest', () => {
    const merged = mergeAndDedupeActivity(
      [{ ...base, createdAt: '2026-01-02T00:00:00Z', status: 'CONFIRMED' }],
      [base],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe('CONFIRMED');
  });

  it('filters by status and action', () => {
    const rows = [
      base,
      { ...base, txHash: '0x2', action: 'SELL' as const, status: 'INDEXED' as const },
    ];

    const filtered = filterActivity(rows, { statuses: ['INDEXED'], actions: ['SELL'] });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].txHash).toBe('0x2');
  });
});
