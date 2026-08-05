import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Saved (hearted) properties. Pure client state — it survives reloads via
 * localStorage and would sync to the API once a wishlist endpoint exists.
 */
export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      ids: [],

      toggle: (propertyId) =>
        set((state) => ({
          ids: state.ids.includes(propertyId)
            ? state.ids.filter((id) => id !== propertyId)
            : [...state.ids, propertyId],
        })),

      isFavorite: (propertyId) => get().ids.includes(propertyId),

      clear: () => set({ ids: [] }),
    }),
    {
      name: 'alotel.favorites',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
