/**
 * Central query-key registry.
 *
 * Keeping keys in one place makes invalidation predictable: invalidating
 * `queryKeys.properties.all` also invalidates every list/detail beneath it,
 * because React Query matches keys by prefix.
 */
export const queryKeys = {
  notifications: {
    all: () => ['notifications'],
    list: (userId) => ['notifications', 'list', userId],
    unreadCount: (userId) => ['notifications', 'unread-count', userId],
    preferences: (userId) => ['notifications', 'preferences', userId],
  },

  spaces: {
    paymentStatus: (id) => ['spaces', 'payment-status', id],
    myBookings: () => ['spaces', 'my-bookings'],
    availabilityRange: (id, from, to) => ['spaces', 'availability-range', id, from, to],
    /* Prefix key — booking a space changes availability and the guest's own
       list, so everything under `spaces` invalidates together. */
    all: () => ['spaces'],
    list: (filters) => ['spaces', 'list', filters ?? {}],
    detail: (id) => ['spaces', 'detail', id],
    availability: (id, date) => ['spaces', 'availability', id, date],
    bookings: () => ['spaces', 'bookings'],
    booking: (id) => ['spaces', 'booking', id],
  },

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
    videos: (id) => ['properties', 'videos', id],
    saved: () => ['properties', 'saved'],
    search: (params = {}) => ['properties', 'search', params],
  },
  destinations: {
    all: ['destinations'],
    /* Shared by the homepage rail and the destinations index — same data. */
    list: () => ['destinations', 'list'],
    detail: (slug) => ['destinations', 'detail', slug],
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
    timeline: (id) => ['bookings', 'timeline', id],
    inspection: (id, stage) => ['bookings', 'inspection', id, stage],
    contractText: (id) => ['bookings', 'contract-text', id],
    contractStatus: (id) => ['bookings', 'contract-status', id],
    fullKyc: (guestId) => ['bookings', 'full-kyc', guestId],
    checkoutReport: (id) => ['bookings', 'checkout-report', id],
    deposit: (id) => ['bookings', 'deposit', id],
    guidebook: (propertyId) => ['bookings', 'guidebook', propertyId],
    reviews: (listingId) => ['bookings', 'reviews', listingId],
    messages: (id) => ['bookings', 'messages', id],
    notifications: (guestId) => ['bookings', 'notifications', guestId],
  },
  dashboard: {
    summary: () => ['dashboard', 'summary'],
  },
};
