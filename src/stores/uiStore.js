import { create } from 'zustand';

/**
 * Ephemeral UI state: mobile navigation, and the toast queue used to confirm
 * mutations ("Welcome back", "Booking submitted", ...).
 */
let toastId = 0;

export const useUIStore = create((set, get) => ({
  isMobileNavOpen: false,
  toasts: [],

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
}));

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
