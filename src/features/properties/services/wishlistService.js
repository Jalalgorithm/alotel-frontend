import { apiClient } from '@/lib/apiClient';
import { env } from '@/lib/env';
import { delay } from '@/lib/mock/utils';
import { properties } from '@/lib/mock/data';
import { useFavoritesStore } from '@/stores/favoritesStore';

/**
 * Saved properties.
 *
 * The API keeps a wishlist per guest, so a save follows them between devices —
 * but it requires authentication. A signed-out visitor still gets to heart
 * things; those live in the local store until they sign in, at which point
 * `mergeLocalInto` pushes them up. Losing a save at the login screen is a
 * needless way to annoy someone who was about to book.
 */

const toSavedProperty = (raw) => ({
  /** The wishlist row's own id — needed by nothing, but returned for parity. */
  id: raw.id,
  propertyId: raw.property,
  name: raw.property_name,
  city: raw.property_city,
  price: Number(raw.property_base_rate) || 0,
  image: raw.property_main_image ?? null,
  savedAt: raw.created_at ?? raw.createdAt ?? null,
});

const mockWishlist = {
  async list() {
    await delay(250);
    const { ids } = useFavoritesStore.getState();

    return properties
      .filter((property) => ids.includes(property.id))
      .map((property) => ({
        id: property.id,
        propertyId: property.id,
        name: property.name,
        city: property.city,
        price: property.price,
        image: property.images?.[0] ?? null,
        savedAt: null,
      }));
  },

  async add(propertyId) {
    await delay(200);
    const store = useFavoritesStore.getState();
    if (!store.ids.includes(propertyId)) store.toggle(propertyId);
    return { propertyId };
  },

  async remove(propertyId) {
    await delay(200);
    const store = useFavoritesStore.getState();
    if (store.ids.includes(propertyId)) store.toggle(propertyId);
    return { success: true };
  },
};

const realWishlist = {
  async list() {
    const { data } = await apiClient.get('/wishlist/');
    return (data?.results ?? data ?? []).map(toSavedProperty);
  },

  /**
   * The API answers 409 when the property is already saved. That is the state
   * the caller wanted, so it is a success here rather than an error to show.
   */
  async add(propertyId) {
    try {
      const { data } = await apiClient.post(`/wishlist/${propertyId}/`);
      return toSavedProperty(data);
    } catch (error) {
      if (error?.status === 409 || error?.response?.status === 409) return { propertyId };
      throw error;
    }
  },

  /** Likewise, a 404 on remove means it is already gone. */
  async remove(propertyId) {
    try {
      await apiClient.delete(`/wishlist/${propertyId}/`);
    } catch (error) {
      if (error?.status !== 404 && error?.response?.status !== 404) throw error;
    }
    return { success: true };
  },
};

const backend = env.useMockBookings ? mockWishlist : realWishlist;

export const wishlistService = {
  getSaved: () => backend.list(),
  save: (propertyId) => backend.add(propertyId),
  unsave: (propertyId) => backend.remove(propertyId),

  /**
   * Push anything hearted while signed out up to the account, then clear the
   * local copy so the API is the only source of truth from then on.
   */
  async mergeLocalInto() {
    const { ids, clear } = useFavoritesStore.getState();
    if (!ids.length) return { merged: 0 };

    await Promise.allSettled(ids.map((id) => backend.add(id)));
    clear();
    return { merged: ids.length };
  },
};
