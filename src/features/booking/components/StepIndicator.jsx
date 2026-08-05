import { Check } from 'lucide-react';
import { cn } from '@/utils/classNames';

/**
 * Horizontal progress rail across the booking wizard.
 * Completed steps are clickable so guests can go back and edit.
 */
export const StepIndicator = ({ steps, currentIndex, onStepClick }) => (
  <ol className="mx-auto flex max-w-3xl items-center justify-center gap-1.5 sm:gap-3">
    {steps.map((step, index) => {
      const isComplete = index < currentIndex;
      const isCurrent = index === currentIndex;

      return (
        <li key={step.id} className="flex items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            disabled={!isComplete}
            onClick={() => isComplete && onStepClick?.(index)}
            aria-current={isCurrent ? 'step' : undefined}
            title={step.label}
            className={cn(
              'flex size-8 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors',
              isComplete && 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700',
              isCurrent && 'border-brand-700 bg-white text-brand-700',
              !isComplete && !isCurrent && 'border-line bg-white text-ink-muted',
            )}
          >
            {isComplete ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
            <span className="sr-only">{step.label}</span>
          </button>

          {index < steps.length - 1 && (
            <span
              aria-hidden="true"
              className={cn('h-px w-3 xs:w-5 sm:w-10', isComplete ? 'bg-brand-600' : 'bg-line')}
            />
          )}
        </li>
      );
    })}
  </ol>
);
