import { forwardRef, useId } from 'react';
import { cn } from '@/utils/classNames';

/** Checkbox with an inline label — used for terms consent and "Remember me". */
export const Checkbox = forwardRef(function Checkbox(
  { label, error, className, containerClassName, id, ...props },
  ref,
) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <div className={cn('w-full', containerClassName)}>
      <div className="flex items-start gap-2.5">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          className={cn(
            'mt-0.5 size-4 shrink-0 cursor-pointer rounded border-line text-brand-700',
            'accent-brand-700 focus:ring-brand-600',
            error && 'border-danger',
            className,
          )}
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className="cursor-pointer text-[13px] leading-5 text-ink-soft">
            {label}
          </label>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
});
