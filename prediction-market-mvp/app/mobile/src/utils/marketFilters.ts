import { Market, MarketFilters, SortMode } from '../types';

export function applySearch(markets: Market[], query: string): Market[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return markets;
  }

  return markets.filter((market) => market.question.toLowerCase().includes(normalized));
}

export function applyFilters(markets: Market[], filters: MarketFilters, watchlistIds: string[]): Market[] {
  const now = Date.now();

  return markets.filter((market) => {
    if (filters.status !== 'ALL' && market.status !== filters.status) {
      return false;
    }

    const closeTime = Date.parse(market.closeTime);
    if (filters.time === 'CLOSING_SOON' && closeTime - now > 1000 * 60 * 60 * 24 * 7) {
      return false;
    }

    if (filters.time === 'ENDED' && closeTime > now) {
      return false;
    }

    if (filters.watchlistOnly && !watchlistIds.includes(market.id)) {
      return false;
    }

    return true;
  });
}

export function applySort(markets: Market[], sortMode: SortMode): Market[] {
  const copied = [...markets];

  switch (sortMode) {
    case 'CLOSE_ASC':
      return copied.sort((a, b) => Date.parse(a.closeTime) - Date.parse(b.closeTime));
    case 'ID_DESC':
      return copied.sort((a, b) => b.id.localeCompare(a.id));
    case 'CLOSE_DESC':
    default:
      return copied.sort((a, b) => Date.parse(b.closeTime) - Date.parse(a.closeTime));
  }
}

export function runMarketPipeline(
  markets: Market[],
  query: string,
  filters: MarketFilters,
  sortMode: SortMode,
  watchlistIds: string[],
): Market[] {
  const searched = applySearch(markets, query);
  const filtered = applyFilters(searched, filters, watchlistIds);
  return applySort(filtered, sortMode);
}
