import { AlertCircle, AlertTriangle, CheckCircle2, Info, ShieldCheck } from 'lucide-react';
import { cn } from '@/utils/classNames';

const VARIANTS = {
  info: { wrapper: 'bg-brand-50/70 border-l-4 border-brand-600', icon: Info, tone: 'text-brand-600' },
  success: {
    wrapper: 'bg-brand-50/70 border-l-4 border-brand-600',
    icon: CheckCircle2,
    tone: 'text-brand-600',
  },
  secure: {
    wrapper: 'bg-brand-50/70 border-l-4 border-brand-600',
    icon: ShieldCheck,
    tone: 'text-brand-600',
  },
  /**
   * Something needs the guest's attention but nothing has gone wrong — an
   * unpaid booking, a cancellation warning. Distinct from `error`, which is
   * for a failure that already happened.
   */
  warn: { wrapper: 'bg-gold/10 border-l-4 border-gold', icon: AlertTriangle, tone: 'text-gold' },
  error: { wrapper: 'bg-danger/5 border-l-4 border-danger', icon: AlertCircle, tone: 'text-danger' },
};

/**
 * The bordered notice block used for "Important" payment instructions,
 * "Your security matters", and form-level API errors.
 */
export const Alert = ({ variant = 'info', title, children, className, icon }) => {
  const config = VARIANTS[variant] ?? VARIANTS.info;
  const Icon = config.icon;

  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={cn('rounded-lg p-3.5', config.wrapper, className)}>
      <div className="flex gap-2.5">
        <span className={cn('mt-0.5 shrink-0', config.tone)}>
          {icon ?? <Icon className="size-4" aria-hidden="true" />}
        </span>
        <div className="text-[13px] leading-5">
          {title && <p className="font-semibold text-ink">{title}</p>}
          {children && <div className="text-ink-soft">{children}</div>}
        </div>
      </div>
    </div>
  );
};
