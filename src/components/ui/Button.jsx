import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/classNames';

const VARIANTS = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 shadow-sm',
  secondary: 'bg-white text-ink border border-line hover:bg-brand-50 hover:border-brand-200',
  outline: 'border border-brand-700 text-brand-700 bg-transparent hover:bg-brand-50',
  ghost: 'text-ink-soft hover:bg-black/5 hover:text-ink',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  danger: 'bg-danger text-white hover:brightness-95',
  /** Disabled-looking "Cancel" affordance used throughout the booking wizard. */
  muted: 'bg-black/5 text-ink-muted hover:bg-black/10',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-[15px] gap-2',
};

/**
 * The single button primitive for the app.
 *
 * Renders an `<a>`/`<Link>` when `href`/`to` is provided so navigation actions
 * stay semantically correct while keeping one visual language.
 */
export const Button = forwardRef(function Button(
  {
    as,
    to,
    href,
    variant = 'primary',
    size = 'md',
    italic = false,
    fullWidth = false,
    isLoading = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    ...props
  },
  ref,
) {
  const Component = as ?? (to ? Link : href ? 'a' : 'button');

  const classes = cn(
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150',
    'disabled:pointer-events-none disabled:opacity-55',
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    // Several CTAs in the designs use an italic display face.
    italic && 'cta-label',
    fullWidth && 'w-full',
    className,
  );

  return (
    <Component
      ref={ref}
      to={to}
      href={href}
      className={classes}
      disabled={Component === 'button' ? disabled || isLoading : undefined}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </Component>
  );
});
