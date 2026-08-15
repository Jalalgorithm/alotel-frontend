/** Every URL in the app, in one place — no route string is ever hard-coded twice. */
export const paths = {
  home: '/',
  properties: '/properties',
  propertyDetail: (id = ':propertyId') => `/properties/${id}`,

  /* Spaces get their own discovery surface rather than sharing the stays
     routes — different search, different result shape, different intent. */
  spaces: '/spaces',
  spaceDetail: (id = ':spaceId') => `/spaces/${id}`,
  spaceCheckout: (id = ':spaceId') => `/spaces/${id}/book`,
  spaceBooking: (id = ':bookingId') => `/spaces/bookings/${id}`,
  search: '/search',
  notifications: '/notifications',
  destinations: '/destinations',
  destinationDetail: (slug = ':slug') => `/destinations/${slug}`,
  about: '/about',
  support: '/support',

  /** Legal pages, each filled by a Termageddon policy. */
  privacy: '/privacy-policy',
  terms: '/terms-of-service',
  cookies: '/cookie-policy',
  disclaimer: '/disclaimer',

  // Auth
  login: '/login',
  signup: '/signup',
  twoFactor: '/verify',
  forgotPassword: '/forgot-password',
  /**
   * The API emails `{FRONTEND_URL}/password-reset/{uid}/{token}/`, so this
   * route's shape is fixed by the backend — don't change it without changing
   * `PasswordResetRequestSerializer` too.
   */
  resetPassword: (uid = ':uid', token = ':token') => `/password-reset/${uid}/${token}`,

  // Protected
  dashboard: '/dashboard',
  booking: (propertyId = ':propertyId') => `/book/${propertyId}`,
  bookingDetail: (bookingId = ':bookingId') => `/bookings/${bookingId}`,

  /**
   * Fixed by the backend: it builds Stripe's `success_url` / `cancel_url` from
   * `FRONTEND_URL` plus these paths, so they can only change in both places at
   * once.
   */
  paymentSuccess: '/payment/success',
  paymentCancelled: '/payment/cancel',
};
