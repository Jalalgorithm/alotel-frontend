import { useAuthStore } from '@/stores/authStore';

/**
 * Read-only view of the session for components that just need to branch on it.
 *
 * The store is kept in sync with React Query by `AuthProvider`, so this hook
 * never triggers a request of its own.
 *
 * `isAuthenticated` means the server confirmed it. `hasCachedSession` means
 * only that this browser holds a stored session that has not been checked yet
 * — enough to paint a shell, never enough to grant anything.
 *
 * @returns {{ user: object|null, isAuthenticated: boolean, isInitialising: boolean, hasCachedSession: boolean }}
 */
export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const cachedUser = useAuthStore((state) => state.cachedUser);
  const isInitialising = useAuthStore((state) => state.isInitialising);

  return {
    user: user ?? (isInitialising ? cachedUser : null),
    isAuthenticated: Boolean(user),
    isInitialising,
    hasCachedSession: Boolean(cachedUser),
  };
};
