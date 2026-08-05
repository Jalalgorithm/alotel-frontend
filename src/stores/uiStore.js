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
   * @param {{ title: string, description?: string, variant?: 'success'|'error'|'info', duration?: number }} toast
   */
  pushToast: ({ title, description, variant = 'success', duration = 4000 }) => {
    const id = ++toastId;
    set((state) => ({ toasts: [...state.toasts, { id, title, description, variant }] }));
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
  error: (title, description) => useUIStore.getState().pushToast({ title, description, variant: 'error' }),
  info: (title, description) => useUIStore.getState().pushToast({ title, description, variant: 'info' }),
};
