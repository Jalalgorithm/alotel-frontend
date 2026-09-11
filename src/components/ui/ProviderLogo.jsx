import { cn } from '@/utils/classNames';

/**
 * Payment provider marks.
 *
 * Drawn inline rather than loaded as images: they render at any size without a
 * network request, inherit the surrounding colour when greyed out, and cannot
 * break a checkout by failing to load. Each uses the provider's own brand
 * colour and glyph so the option is recognisable at a glance.
 */

const Stripe = ({ className }) => (
  <svg viewBox="0 0 32 32" role="img" aria-label="Stripe" className={className}>
    <rect width="32" height="32" rx="7" fill="currentColor" />
    {/* The Stripe "S" — a single stroke doubling back on itself. */}
    <path
      fill="#fff"
      d="M15.6 12.5c0-.72.6-1.03 1.55-1.03 1.37 0 3.1.42 4.47 1.16V8.42a11.9 11.9 0 0 0-4.47-.82c-3.65 0-6.08 1.9-6.08 5.08 0 4.95 6.82 4.16 6.82 6.29 0 .85-.74 1.13-1.75 1.13-1.5 0-3.4-.61-4.92-1.44v4.27a12.5 12.5 0 0 0 4.92 1.03c3.74 0 6.31-1.85 6.31-5.07 0-5.34-6.85-4.4-6.85-6.39Z"
    />
  </svg>
);

const Flutterwave = ({ className }) => (
  <svg viewBox="0 0 32 32" role="img" aria-label="Flutterwave" className={className}>
    <rect width="32" height="32" rx="7" fill="currentColor" />
    {/*
      Three stacked waves. Deliberately not an attempt at Flutterwave's exact
      mark — a rough copy of a trademark is worse than an honest generic one —
      but it reads as "wave" beside the name rather than as a stray letter.
    */}
    <g fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round">
      <path d="M7.5 12.4c1.9-2.2 3.7-2.2 5.6 0s3.7 2.2 5.6 0 3.7-2.2 5.6 0" />
      <path d="M7.5 17c1.9-2.2 3.7-2.2 5.6 0s3.7 2.2 5.6 0 3.7-2.2 5.6 0" opacity=".75" />
      <path d="M7.5 21.6c1.9-2.2 3.7-2.2 5.6 0s3.7 2.2 5.6 0 3.7-2.2 5.6 0" opacity=".5" />
    </g>
  </svg>
);

const DropboxSign = ({ className }) => (
  <svg viewBox="0 0 32 32" role="img" aria-label="Dropbox Sign" className={className}>
    <rect width="32" height="32" rx="7" fill="currentColor" />
    {/*
      Dropbox's mark is two stacked diamonds. Same rule as Flutterwave below:
      an honest generic beats a rough copy of someone's trademark.
    */}
    <g fill="#fff">
      <path d="M11 8.5 6.5 11.6 11 14.7l4.5-3.1L11 8.5Z" />
      <path d="M21 8.5l-4.5 3.1 4.5 3.1 4.5-3.1L21 8.5Z" />
      <path d="M6.5 17.8 11 14.7l4.5 3.1L11 20.9l-4.5-3.1Z" />
      <path d="M16.5 17.8 21 14.7l4.5 3.1L21 20.9l-4.5-3.1Z" opacity=".75" />
    </g>
  </svg>
);

const Mapbox = ({ className }) => (
  <svg viewBox="0 0 32 32" role="img" aria-label="Mapbox" className={className}>
    <rect width="32" height="32" rx="7" fill="currentColor" />
    {/* A pin, which is what the service does for us. */}
    <path
      fill="#fff"
      d="M16 7.5c-3.3 0-6 2.6-6 5.9 0 4.3 6 11.1 6 11.1s6-6.8 6-11.1c0-3.3-2.7-5.9-6-5.9Zm0 8.1a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4Z"
    />
  </svg>
);

const MARKS = {
  stripe: { Component: Stripe, brand: 'text-[#635BFF]' },
  flutterwave: { Component: Flutterwave, brand: 'text-[#F5A623]' },
  'dropbox-sign': { Component: DropboxSign, brand: 'text-[#0061FF]' },
  mapbox: { Component: Mapbox, brand: 'text-[#4264FB]' },
};

/**
 * @param {{ provider: 'stripe' | 'flutterwave' | 'dropbox-sign' | 'mapbox', isMuted?: boolean }} props
 *  `isMuted` drops the brand colour to grey, for a provider that is offered but
 *  unavailable in this currency.
 */
export const ProviderLogo = ({ provider, isMuted = false, className }) => {
  const mark = MARKS[provider];
  if (!mark) return null;

  const { Component, brand } = mark;
  return <Component className={cn('size-9 shrink-0', isMuted ? 'text-ink-muted/40' : brand, className)} />;
};
