import { useQuery } from '@tanstack/react-query';
import { fetchMarkets } from '../marketApi';

export function useMarketsQuery() {
  return useQuery({
    queryKey: ['markets'],
    queryFn: fetchMarkets,
  });
}
