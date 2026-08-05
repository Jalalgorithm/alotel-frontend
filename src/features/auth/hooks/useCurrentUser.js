import { useQuery } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { queryKeys } from '@/lib/queryKeys';
import { authStorage } from '@/lib/storage';

/**
 * The single source of truth for "who is signed in".
 *
 * Session persistence across refreshes works in two layers:
 *  1. `initialData` returns the localStorage copy synchronously, so a reload
 *     paints the authenticated UI immediately — no auth flicker;
 *  2. the query then revalidates against the API (or mock) in the background.
 */
export const useCurrentUser = () => {
  const cachedUser = authStorage.getUser();

  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: authService.getCurrentUser,
    initialData: cachedUser ?? undefined,
    // Treat the cache as already stale so a refetch confirms it right away.
    initialDataUpdatedAt: 0,
    staleTime: 1000 * 60 * 5,
    retry: false,
    // Signed-out users have nothing to fetch.
    enabled: Boolean(authStorage.getToken()),
  });
};
