import { create } from 'zustand';
import { authStorage } from '@/lib/storage';

/**
 * Client-side mirror of the authenticated session.
 *
 * React Query owns the *server* truth (`useCurrentUser`); this store exists so
 * non-React code and deeply nested components can read the session
 * synchronously without threading props or re-running a query.
 *
 * Two slots, deliberately separate:
 *
 *  - `user` is set only from a server response. `isAuthenticated` reads it, so
 *    being signed in always means the API said so.
 *  - `cachedUser` is the copy in browser storage, used to paint the shell
 *    while the session is being confirmed. Anyone can type one of those into
 *    DevTools, so it never counts as authentication — it previously seeded
 *    `user` directly, which let a forged entry render the signed-in app.
 */
export const useAuthStore = create((set) => ({
  user: null,
  /** Untrusted: for first paint only, never for access decisions. */
  cachedUser: authStorage.getUser(),
  /** `true` until the initial session check resolves — drives the route guard. */
  isInitialising: true,

  setUser: (user) => {
    authStorage.setUser(user);
    set({ user, cachedUser: null, isInitialising: false });
  },

  setInitialised: () => set({ isInitialising: false }),

  clearSession: () => {
    authStorage.clear();
    set({ user: null, cachedUser: null, isInitialising: false });
  },
}));

/* Stable selectors — components subscribe to one slice instead of the whole store. */
export const selectUser = (state) => state.user;
export const selectIsAuthenticated = (state) => Boolean(state.user);
