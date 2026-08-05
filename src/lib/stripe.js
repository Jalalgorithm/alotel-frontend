import { env } from './env';

/**
 * Stripe.js loader.
 *
 * Loaded on demand rather than in `index.html` because only the identity step
 * needs it — every other page would pay for a third-party script it never
 * calls. Stripe requires the script be served from js.stripe.com (their fraud
 * detection depends on it), so this cannot be bundled.
 */

const STRIPE_JS = 'https://js.stripe.com/v3/';

let loader = null;

const injectScript = () =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${STRIPE_JS}"]`);
    if (existing) {
      // A previous call already injected it; wait for that same element.
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      if (window.Stripe) resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = STRIPE_JS;
    script.async = true;
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', () => reject(new Error('Could not load Stripe.js.')), { once: true });
    document.head.appendChild(script);
  });

/**
 * Resolve a configured Stripe instance.
 *
 * @returns {Promise<object>} the Stripe client
 * @throws when no publishable key is configured, or the script is blocked
 */
export const loadStripe = () => {
  if (!env.stripePublishableKey) {
    return Promise.reject(
      new Error(
        'Stripe is not configured in this environment. Set VITE_STRIPE_PUBLISHABLE_KEY to enable identity verification.',
      ),
    );
  }

  if (!loader) {
    loader = injectScript()
      .then(() => {
        if (!window.Stripe) throw new Error('Stripe.js loaded but did not initialise.');
        return window.Stripe(env.stripePublishableKey);
      })
      .catch((error) => {
        // Don't cache a failure — an ad blocker may be disabled and retried.
        loader = null;
        throw error;
      });
  }

  return loader;
};

/** True when the identity step can run the real Stripe modal. */
export const isStripeConfigured = () => Boolean(env.stripePublishableKey);
