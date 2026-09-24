import { create } from 'zustand';

/**
 * Ephemeral UI state: mobile navigation, the toast queue used to confirm
 * mutations ("Welcome back", "Booking submitted", ...), and the error banner.
 *
 * The banner is deliberately singular. Two failures at once is a design
 * failure of its own, and stacking them at the top of the page pushes the
 * content a guest is trying to read off the screen. A second failure replaces
 * the first, which is also what a guest expects: the newest problem is the one
 * they just caused.
 */
let toastId = 0;

export const useUIStore = create((set, get) => ({
  isMobileNavOpen: false,
  toasts: [],
  /** @type {{ title: string, message?: string, tone?: string, actions?: Array, reference?: string } | null} */
  errorBanner: null,

  openMobileNav: () => set({ isMobileNavOpen: true }),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),

  /**
   * `duration` is kept on the toast, not just used to schedule the timeout, so
   * the renderer can show how long is left. An auto-dismissing message that
   * gives no sign it is about to vanish reads as a glitch when it goes.
   *
   * @param {{ title: string, description?: string, variant?: 'success'|'error'|'info'|'warn', duration?: number }} toast
   */
  pushToast: ({ title, description, variant = 'success', duration = 4000 }) => {
    const id = ++toastId;
    set((state) => ({ toasts: [...state.toasts, { id, title, description, variant, duration }] }));
    if (duration > 0) {
      setTimeout(() => get().dismissToast(id), duration);
    }
    return id;
  },

  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

  /**
   * Raise the banner at the top of the page.
   *
   * `actions` are `{ label, onClick, variant }` — the way out of the problem,
   * kept with the message rather than left for the guest to find.
   */
  showErrorBanner: (banner) => set({ errorBanner: { tone: 'fixable', ...banner } }),
  dismissErrorBanner: () => set({ errorBanner: null }),
}));

/**
 * Imperative helper for the banner, so a service or an interceptor can raise
 * one without reaching into the store.
 */
export const errorBanner = {
  show: (banner) => useUIStore.getState().showErrorBanner(banner),
  dismiss: () => useUIStore.getState().dismissErrorBanner(),
};

/** Imperative helper for use outside React (interceptors, services). */
export const toast = {
  success: (title, description) => useUIStore.getState().pushToast({ title, description, variant: 'success' }),
  /** Failures hold longer — the reader usually has to act on them. */
  error: (title, description) =>
    useUIStore.getState().pushToast({ title, description, variant: 'error', duration: 7000 }),
  info: (title, description) => useUIStore.getState().pushToast({ title, description, variant: 'info' }),
  warn: (title, description) =>
    useUIStore.getState().pushToast({ title, description, variant: 'warn', duration: 6000 }),
};
