/** Every URL in the app, in one place — no route string is ever hard-coded twice. */
export const paths = {
  home: '/',
  properties: '/properties',
  propertyDetail: (id = ':propertyId') => `/properties/${id}`,
  search: '/search',
  destinations: '/destinations',
  about: '/about',
  support: '/support',

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

  /**
   * Fixed by the backend: it builds Stripe's `success_url` / `cancel_url` from
   * `FRONTEND_URL` plus these paths, so they can only change in both places at
   * once.
   */
  paymentSuccess: '/payment/success',
  paymentCancelled: '/payment/cancel',
};
