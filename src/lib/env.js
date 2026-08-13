/**
 * Single, typed-ish access point for every `import.meta.env` value.
 * Nothing else in the app should read `import.meta.env` directly.
 */
const toBool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

const useMock = toBool(import.meta.env.VITE_USE_MOCK, true);

export const env = {
  apiUrl: import.meta.env.VITE_API_URL || '/api/v1',

  /**
   * Mock mode for the catalogue/booking features, which are not wired to the
   * backend yet. Defaults on so a fresh clone runs with zero setup.
   */
  useMock,

  /**
   * Auth has its own switch so it can talk to the real API while the rest of
   * the app stays on mocks. Falls back to the global flag when unset.
   */
  useMockAuth: toBool(import.meta.env.VITE_USE_MOCK_AUTH, useMock),

  /**
   * Properties are wired to the real API independently of the rest of the
   * catalogue (destinations, reviews, bookings), which is still mocked.
   */
  useMockProperties: toBool(import.meta.env.VITE_USE_MOCK_PROPERTIES, useMock),

  /**
   * Bookings, payments and identity verification. Separate again so the
   * booking flow can be developed offline without a Stripe key.
   */
  useMockBookings: toBool(import.meta.env.VITE_USE_MOCK_BOOKINGS, useMock),

  /**
   * Stripe publishable key, used only for `stripe.verifyIdentity()` — the
   * identity modal runs client-side. Payments never touch this: they redirect
   * to a Checkout URL the server creates.
   */
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',

  /**
   * Mapbox public token (pk.*), used for map tiles and geocoding only.
   * Rendering is MapLibre GL, which carries no per-load licence fee — the
   * token pays for tiles and the geocoding API, nothing else.
   *
   * Blank is a supported state: maps fall back to a static locator rather
   * than rendering a broken canvas.
   */
  mapboxToken: import.meta.env.VITE_MAPBOX_PUBLIC_KEY || '',

  /**
   * Termageddon policy keys, one per document, from their dashboard's embed
   * code (`data-policy-key`). Purely client-side — the policy HTML is fetched
   * from Termageddon at render time and never passes through our API.
   *
   * Blank is a supported state: the page says the policy is not published yet
   * rather than showing a broken embed.
   */
  termageddon: {
    privacy: import.meta.env.VITE_TERMAGEDDON_PRIVACY_KEY || '',
    terms: import.meta.env.VITE_TERMAGEDDON_TERMS_KEY || '',
    cookies: import.meta.env.VITE_TERMAGEDDON_COOKIE_KEY || '',
    disclaimer: import.meta.env.VITE_TERMAGEDDON_DISCLAIMER_KEY || '',
  },

  mockLatency: Number(import.meta.env.VITE_MOCK_LATENCY ?? 800),
  appName: import.meta.env.VITE_APP_NAME || 'Alotel Spaces',
  isDev: import.meta.env.DEV,
};
