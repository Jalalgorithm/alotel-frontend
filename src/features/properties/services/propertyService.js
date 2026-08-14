import { apiClient } from '@/lib/apiClient';
import { env } from '@/lib/env';
import { ApiError } from '@/utils/errors';
import { clone, delay } from '@/lib/mock/utils';
import { properties } from '@/lib/mock/data';
import { filterByGuests, toListParams, toPage, toProperty, toVideo } from '@/lib/propertySchema';
import { toAvailabilityCalendar } from '@/lib/bookingSchema';

/**
 * Property catalogue service — listing, detail, search and recommendations.
 * Mirrors `authService`: one mock implementation, one real one, same surface.
 */

const matchesQuery = (property, query) => {
  if (!query) return true;
  const haystack = `${property.name} ${property.city} ${property.country} ${property.type}`.toLowerCase();
  return haystack.includes(query.toLowerCase().trim());
};

const SORTERS = {
  recommended: () => 0,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
};

const mockProperties = {
  /**
   * @param {{ query?: string, type?: string, destinationId?: string, guests?: number,
   *           minPrice?: number, maxPrice?: number, sort?: string, page?: number, pageSize?: number }} filters
   */
  async list(filters = {}) {
    await delay(500);

    const {
      query,
      type,
      destinationId,
      guests,
      minPrice,
      maxPrice,
      sort = 'recommended',
      page = 1,
      pageSize = 8,
    } = filters;

    const filtered = properties.filter(
      (property) =>
        matchesQuery(property, query) &&
        (!type || type === 'All' || property.type === type) &&
        (!destinationId || property.destinationId === destinationId) &&
        (!guests || property.guests >= Number(guests)) &&
        (minPrice === undefined || property.price >= Number(minPrice)) &&
        (maxPrice === undefined || property.price <= Number(maxPrice)),
    );

    const sorted = [...filtered].sort(SORTERS[sort] ?? SORTERS.recommended);
    const start = (page - 1) * pageSize;

    return {
      items: clone(sorted.slice(start, start + pageSize)),
      total: sorted.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    };
  },

  async detail(id) {
    await delay(450);

    const property = properties.find((entry) => entry.id === id);
    if (!property) throw new ApiError('We could not find that property.', 404);

    return clone(property);
  },

  async similar(id, limit = 4) {
    await delay(350);

    const source = properties.find((entry) => entry.id === id);
    if (!source) return [];

    // Same destination first, then anything else, so the rail is never empty.
    const sameDestination = properties.filter(
      (entry) => entry.id !== id && entry.destinationId === source.destinationId,
    );
    const others = properties.filter(
      (entry) => entry.id !== id && entry.destinationId !== source.destinationId,
    );

    return clone([...sameDestination, ...others].slice(0, limit));
  },

  async featured(limit = 8) {
    await delay(400);
    return clone(properties.filter((property) => property.featured).slice(0, limit));
  },

  async availability() {
    await delay(250);
    return toAvailabilityCalendar([]);
  },

  async videos() {
    await delay(200);
    return [];
  },
};

/** Page size is fixed by the API's pagination class. */
const API_PAGE_SIZE = 10;

const realProperties = {
  async list(filters = {}) {
    const params = toListParams(filters);
    const { data } = await apiClient.get('/properties/', { params });
    const page = toPage(data, { page: params.page, pageSize: API_PAGE_SIZE });

    // Guest capacity has no server-side filter — narrow the returned page.
    return { ...page, items: filterByGuests(page.items, filters.guests) };
  },

  /**
   * The gallery lives on its own endpoint, so the detail view fetches both in
   * parallel and hands the components a single property object — the same
   * shape the mock returns, gallery included.
   */
  async detail(id) {
    const [{ data }, gallery] = await Promise.all([
      apiClient.get(`/properties/${id}/`),
      apiClient
        .get(`/properties/${id}/images/`)
        // A listing with no photos is normal, not an error — fall back to the
        // thumbnail rather than failing the whole page.
        .then((response) => response.data?.results ?? response.data ?? [])
        .catch(() => []),
    ]);

    return toProperty(data, gallery);
  },

  /**
   * The API has no similarity endpoint. The nearest honest equivalent is
   * "other listings in the same market", which is what the rail is for.
   */
  async similar(id, limit = 4) {
    const source = await realProperties.detail(id);
    if (!source) return [];

    const { data } = await apiClient.get('/properties/', {
      params: { location: source.location, page: 1 },
    });

    return toPage(data, { pageSize: API_PAGE_SIZE })
      .items.filter((property) => property.id !== id)
      .slice(0, limit);
  },

  /** Walkthrough videos for a listing. Public, same as the photo gallery. */
  async videos(id) {
    const { data } = await apiClient.get(`/properties/${id}/videos/`);
    return (data?.results ?? data ?? []).map(toVideo).sort((a, b) => a.order - b.order);
  },

  /**
   * The booking calendar's blocked nights.
   *
   * Public, and it already folds live bookings into `blockedDates`, so the
   * calendar never has to ask about other guests' reservations directly.
   */
  async availability(id) {
    const { data } = await apiClient.get(`/properties/${id}/availability/`);
    return toAvailabilityCalendar(data);
  },

  /**
   * There is no `featured` flag on the API, so the landing rail shows the
   * first page of published listings — the server's default ordering is
   * newest first, which is a reasonable stand-in for a curated set.
   */
  async featured(limit = 8) {
    const { data } = await apiClient.get('/properties/', { params: { page: 1 } });
    return toPage(data, { pageSize: API_PAGE_SIZE }).items.slice(0, limit);
  },
};

/**
 * Properties are wired to the real API independently of the rest of the mocked
 * catalogue, so each half can move at its own pace.
 */
const backend = env.useMockProperties ? mockProperties : realProperties;

export const propertyService = {
  getProperties: (filters) => backend.list(filters),
  getProperty: (id) => backend.detail(id),
  getSimilarProperties: (id, limit) => backend.similar(id, limit),
  getFeaturedProperties: (limit) => backend.featured(limit),
  getPropertyAvailability: (id) => backend.availability(id),
  getPropertyVideos: (id) => backend.videos(id),
};
