import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/classNames';

/**
 * Labelled text field with inline validation messaging.
 *
 * `error` wires up `aria-invalid` + `aria-describedby` so screen readers
 * announce the failure alongside the visual red state.
 */
export const Input = forwardRef(function Input(
  { label, error, hint, leftIcon, className, containerClassName, id, type = 'text', ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  const isPassword = type === 'password';
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-ink">
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={isPassword && isRevealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-ink transition-colors',
            'placeholder:text-ink-muted focus:border-brand-600 focus:outline-none',
            'focus:ring-2 focus:ring-brand-600/15 disabled:bg-black/5 disabled:text-ink-muted',
            leftIcon && 'pl-10',
            isPassword && 'pr-10',
            error ? 'border-danger focus:border-danger focus:ring-danger/15' : 'border-line',
            className,
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setIsRevealed((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-ink"
            aria-label={isRevealed ? 'Hide password' : 'Show password'}
          >
            {isRevealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

/** Multi-line variant sharing `Input`'s chrome and validation messaging. */
export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className, containerClassName, id, rows = 3, ...props },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-[13px] font-medium text-ink">
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink transition-colors',
          'placeholder:text-ink-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/15',
          'disabled:bg-black/5 disabled:text-ink-muted',
          error ? 'border-danger focus:border-danger focus:ring-danger/15' : 'border-line',
          className,
        )}
        {...props}
      />

      {error ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
