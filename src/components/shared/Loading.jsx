import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/utils/classNames';

/** Centred loading state — the Suspense fallback and route-guard placeholder. */
export const Loading = ({ label = 'Loading…', fullScreen = false, className }) => (
  <div
    className={cn(
      'flex w-full flex-col items-center justify-center gap-3 py-16',
      fullScreen && 'min-h-screen py-0',
      className,
    )}
  >
    <Spinner size="lg" />
    <p className="text-sm text-ink-soft">{label}</p>
  </div>
);
