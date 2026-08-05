/**
 * Central query-key registry.
 *
 * Keeping keys in one place makes invalidation predictable: invalidating
 * `queryKeys.properties.all` also invalidates every list/detail beneath it,
 * because React Query matches keys by prefix.
 */
export const queryKeys = {
  auth: {
    all: ['auth'],
    currentUser: () => ['auth', 'current-user'],
  },
  properties: {
    all: ['properties'],
    list: (filters = {}) => ['properties', 'list', filters],
    detail: (id) => ['properties', 'detail', id],
    similar: (id) => ['properties', 'similar', id],
    calendar: (id) => ['properties', 'calendar', id],
    saved: () => ['properties', 'saved'],
    search: (params = {}) => ['properties', 'search', params],
  },
  destinations: {
    all: ['destinations'],
    list: () => ['destinations', 'list'],
  },
  home: {
    testimonials: () => ['home', 'testimonials'],
    stats: () => ['home', 'stats'],
  },
  bookings: {
    all: ['bookings'],
    list: () => ['bookings', 'list'],
    detail: (id) => ['bookings', 'detail', id],
    availability: (params = {}) => ['bookings', 'availability', params],
    paymentOptions: (base) => ['bookings', 'payment-options', base],
    paymentStatus: (id) => ['bookings', 'payment-status', id],
    receipt: (id) => ['bookings', 'receipt', id],
    taxRules: () => ['bookings', 'tax-rules'],
  },
  dashboard: {
    summary: () => ['dashboard', 'summary'],
  },
};
