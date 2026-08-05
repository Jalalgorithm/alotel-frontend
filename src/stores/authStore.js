import { create } from 'zustand';
import { authStorage } from '@/lib/storage';

/**
 * Client-side mirror of the authenticated session.
 *
 * React Query owns the *server* truth (`useCurrentUser`); this store exists so
 * non-React code and deeply nested components can read the session
 * synchronously without threading props or re-running a query.
 */
export const useAuthStore = create((set) => ({
  user: authStorage.getUser(),
  /** `true` until the initial session check resolves — drives the route guard. */
  isInitialising: true,

  setUser: (user) => {
    authStorage.setUser(user);
    set({ user, isInitialising: false });
  },

  setInitialised: () => set({ isInitialising: false }),

  clearSession: () => {
    authStorage.clear();
    set({ user: null, isInitialising: false });
  },
}));

/* Stable selectors — components subscribe to one slice instead of the whole store. */
export const selectUser = (state) => state.user;
export const selectIsAuthenticated = (state) => Boolean(state.user);
