import { useAuthStore } from '@/stores/authStore';

/**
 * Read-only view of the session for components that just need to branch on it.
 *
 * The store is kept in sync with React Query by `AuthProvider`, so this hook
 * never triggers a request of its own.
 *
 * @returns {{ user: object|null, isAuthenticated: boolean, isInitialising: boolean }}
 */
export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isInitialising = useAuthStore((state) => state.isInitialising);

  return {
    user,
    isAuthenticated: Boolean(user),
    isInitialising,
  };
};
