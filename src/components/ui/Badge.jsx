import { cn } from '@/utils/classNames';

const VARIANTS = {
  verified: 'bg-brand-600 text-white',
  gold: 'bg-gold text-white',
  soft: 'bg-brand-50 text-brand-700',
  neutral: 'bg-black/5 text-ink-soft',
  outline: 'border border-line bg-white text-ink-soft',
};

/** Small status pill — "Verified Property", "Verified Guest", filter counts. */
export const Badge = ({ variant = 'soft', icon, className, children, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium',
      VARIANTS[variant] ?? VARIANTS.soft,
      className,
    )}
    {...props}
  >
    {icon}
    {children}
  </span>
);
