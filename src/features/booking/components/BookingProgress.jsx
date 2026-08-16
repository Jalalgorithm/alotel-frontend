import { useMemo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { formatDate } from '@/utils/format';
import { useInspection } from '../hooks/useBookingMutations';

/**
 * The stay's journey, rendered from whatever steps the API reports.
 *
 * The step list is deliberately not hardcoded: the server decides which stages
 * a booking has and which are done, so a change there (a new contract step, a
 * skipped deposit) shows up here without a frontend release.
 */
export const BookingProgress = ({ timeline, bookingId, className }) => {
  /*
   * The check-in inspection the guest has to confirm.
   *
   * The API's timeline has no step for this, but it is a real thing the guest
   * must do and the only one of these stages that is *theirs* — every other
   * step happens to them. Left out, a guest saw "Checked In" tick over while
   * the confirmation we were waiting on went unmentioned.
   */
  const { data: checkin } = useInspection(bookingId, 'checkin');

  const steps = useMemo(() => {
    const serverSteps = timeline?.steps ?? [];
    if (!serverSteps.length) return [];

    /* Nothing to show until staff have recorded the check-in. */
    if (!checkin) return serverSteps;

    const acknowledgement = {
      id: 'guest-acknowledgement',
      label: 'You confirmed the check-in record',
      isComplete: Boolean(checkin.isAcknowledged),
      completedAt: checkin.acknowledgedAt ?? null,
      /* Distinguishes "waiting on you" from "waiting on us", which the
         generic "In progress" caption cannot. */
      isGuestAction: true,
      isReady: Boolean(checkin.isComplete),
    };

    /* Sits immediately before Checked In: the guest's confirmation is what
       completes the arrival, so it reads as the step on the way in. */
    const at = serverSteps.findIndex((step) => /checked in/i.test(step.label));
    if (at === -1) return [...serverSteps, acknowledgement];

    return [...serverSteps.slice(0, at), acknowledgement, ...serverSteps.slice(at)];
  }, [timeline, checkin]);

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
                {step.completedAt
                  ? formatDate(step.completedAt)
                  : step.isGuestAction && step.isReady
                    ? 'Waiting for you to confirm'
                    : step.isGuestAction
                      ? 'Once our team has finished the inspection'
                      : isCurrent
                        ? 'In progress'
                        : 'Not yet'}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
