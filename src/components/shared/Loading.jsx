import { BrandLoader } from './BrandLoader';
import { cn } from '@/utils/classNames';

/**
 * Centred loading state — the Suspense fallback and route-guard placeholder.
 *
 * Uses the brand mark rather than a generic spinner. This is the single
 * chokepoint for every full-page wait in the app, so the mark appears on route
 * transitions, session checks and the booking and residence pages alike.
 */
export const Loading = ({ label = 'Loading…', fullScreen = false, className }) => (
  <div
    className={cn(
      'flex w-full flex-col items-center justify-center gap-4 py-16',
      fullScreen && 'min-h-screen py-0',
      className,
    )}
  >
    <BrandLoader size={fullScreen ? 'lg' : 'md'} label={label} />
    <p className="text-sm text-ink-soft">{label}</p>
  </div>
);
