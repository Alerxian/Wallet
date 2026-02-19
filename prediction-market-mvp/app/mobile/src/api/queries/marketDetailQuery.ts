import { useQuery } from '@tanstack/react-query';
import { fetchMarketById } from '../marketApi';

export function useMarketDetailQuery(marketId: string | null) {
  return useQuery({
    queryKey: ['market', marketId],
    queryFn: () => fetchMarketById(marketId ?? ''),
    enabled: Boolean(marketId),
  });
}
