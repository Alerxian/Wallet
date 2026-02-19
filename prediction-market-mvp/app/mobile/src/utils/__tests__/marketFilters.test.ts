import { mockMarkets } from '../../data/mockMarkets';
import { applyFilters, applySearch, applySort } from '../marketFilters';

describe('market filter pipeline', () => {
  it('searches by question text', () => {
    const result = applySearch(mockMarkets, 'eth close');
    expect(result.some((item) => item.id === 'MKT-1072')).toBe(true);
  });

  it('supports watchlist-only filter', () => {
    const result = applyFilters(
      mockMarkets,
      { status: 'ALL', time: 'ALL', watchlistOnly: true },
      ['MKT-1046'],
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('MKT-1046');
  });

  it('sorts by ID desc', () => {
    const sorted = applySort(mockMarkets, 'ID_DESC');
    expect(sorted[0].id >= sorted[1].id).toBe(true);
  });
});
