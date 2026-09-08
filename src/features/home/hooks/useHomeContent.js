import { useQuery } from '@tanstack/react-query';
import { homeService } from '../services/homeService';
import { queryKeys } from '@/lib/queryKeys';

// Marketing content changes rarely — keep it fresh for 15 minutes.
const MARKETING_STALE_TIME = 1000 * 60 * 15;

export const useDestinations = (limit) =>
  useQuery({
    queryKey: [...queryKeys.destinations.list(), limit ?? 'all'],
    queryFn: () => homeService.getDestinations(limit),
    staleTime: MARKETING_STALE_TIME,
  });

export const useTestimonials = () =>
  useQuery({
    queryKey: queryKeys.home.testimonials(),
    queryFn: homeService.getTestimonials,
    staleTime: MARKETING_STALE_TIME,
  });

/*
 * `useTrustStats` is gone with the four placeholder figures it fetched. The
 * homepage now states four things that are true rather than four numbers
 * nobody had verified — see `ASSURANCES` in `lib/homeContent`.
 */
