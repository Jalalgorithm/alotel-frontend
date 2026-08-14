import { useQuery } from '@tanstack/react-query';
import { destinationService } from '../services/destinationService';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Destination content joined to live inventory.
 *
 * Held for five minutes: the editorial half never changes within a session, and
 * the counts sweep several pages of properties, which is not something to
 * repeat on every navigation between a city and its listings.
 */
export const useDestinationList = () =>
  useQuery({
    queryKey: queryKeys.destinations.list(),
    queryFn: destinationService.list,
    staleTime: 5 * 60 * 1000,
  });

export const useDestination = (slug) =>
  useQuery({
    queryKey: queryKeys.destinations.detail(slug),
    queryFn: () => destinationService.detail(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
