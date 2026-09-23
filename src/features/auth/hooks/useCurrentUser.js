import { useQuery } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { queryKeys } from '@/lib/queryKeys';
import { authStorage } from '@/lib/storage';

/**
 * The single source of truth for "who is signed in".
 *
 * There is deliberately no `initialData` here. Seeding the query from browser
 * storage made an unverified, user-editable blob indistinguishable from a
 * server response, and `AuthProvider` then promoted it to the signed-in user.
 * The cached copy still paints the shell without any auth flicker — it does so
 * through `authStore.cachedUser`, which nothing treats as authentication.
 */
export const useCurrentUser = () =>
  useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: authService.getCurrentUser,
    staleTime: 1000 * 60 * 5,
    retry: false,
    // Signed-out visitors have nothing to fetch.
    enabled: Boolean(authStorage.getToken() || authStorage.getRefreshToken()),
  });
