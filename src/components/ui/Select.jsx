import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/classNames';

/**
 * Native select styled to match `Input`. Native is deliberate: it gives correct
 * keyboard and mobile behaviour for free.
 */
export const Select = forwardRef(function Select(
  { label, error, hint, options = [], placeholder, className, containerClassName, id, children, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-[13px] font-medium text-ink">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-11 w-full appearance-none rounded-lg border bg-white px-3.5 pr-9 text-sm text-ink',
            'transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/15',
            error ? 'border-danger' : 'border-line',
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value ?? option} value={option.value ?? option}>
              {option.label ?? option}
            </option>
          ))}
          {children}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});
