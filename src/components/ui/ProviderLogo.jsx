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

const MARKS = {
  stripe: { Component: Stripe, brand: 'text-[#635BFF]' },
  flutterwave: { Component: Flutterwave, brand: 'text-[#F5A623]' },
};

/**
 * @param {{ provider: 'stripe' | 'flutterwave', isMuted?: boolean }} props
 *  `isMuted` drops the brand colour to grey, for a provider that is offered but
 *  unavailable in this currency.
 */
export const ProviderLogo = ({ provider, isMuted = false, className }) => {
  const mark = MARKS[provider];
  if (!mark) return null;

  const { Component, brand } = mark;
  return <Component className={cn('size-9 shrink-0', isMuted ? 'text-ink-muted/40' : brand, className)} />;
};
