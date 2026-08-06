import { Check } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { formatDate } from '@/utils/format';

/**
 * The stay's journey, rendered from whatever steps the API reports.
 *
 * The step list is deliberately not hardcoded: the server decides which stages
 * a booking has and which are done, so a change there (a new contract step, a
 * skipped deposit) shows up here without a frontend release.
 */
export const BookingProgress = ({ timeline, className }) => {
  const steps = timeline?.steps ?? [];
  if (!steps.length) return null;

  /** The first incomplete step is where the guest is now. */
  const activeIndex = steps.findIndex((step) => !step.isComplete);
  const currentIndex = activeIndex === -1 ? steps.length : activeIndex;

  return (
    <ol className={cn('relative', className)}>
      {steps.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
            {/* The rail is drawn per-item so it stops cleanly at the last step. */}
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-[11px] top-6 h-full w-px',
                  step.isComplete ? 'bg-brand-600' : 'bg-line',
                )}
              />
            )}

            <span
              className={cn(
                'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold',
                step.isComplete && 'border-brand-600 bg-brand-600 text-white',
                isCurrent && !step.isComplete && 'border-brand-600 bg-white text-brand-700',
                !step.isComplete && !isCurrent && 'border-line bg-white text-ink-muted',
              )}
            >
              {step.isComplete ? <Check className="size-3" aria-hidden="true" /> : index + 1}
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={cn(
                  'text-[13px]',
                  step.isComplete || isCurrent ? 'font-semibold text-ink' : 'text-ink-muted',
                )}
              >
                {step.label}
              </p>
              <p className="text-[11px] text-ink-muted">
                {step.completedAt ? formatDate(step.completedAt) : isCurrent ? 'In progress' : 'Not yet'}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
