import { AlertCircle, AlertTriangle, CheckCircle2, Info, ShieldCheck } from 'lucide-react';
import { cn } from '@/utils/classNames';

/**
 * The notice block used for payment instructions, security notes, form-level
 * API errors and destructive-action warnings.
 *
 * Deliberately *not* a flat pastel panel with an icon floating in it. That
 * treatment washes the whole block in one colour, which shouts at the reader
 * regardless of how routine the message is, and leaves body copy sitting on a
 * tint that drags its contrast down. This sits on the real surface instead and
 * spends its colour in two precise places — a 3px accent rail and a tinted icon
 * chip — so severity reads instantly while the prose stays as legible as the
 * page around it.
 *
 * `facts` exists because the important number in a warning is usually buried
 * mid-sentence ("...against the $1,280 paid"). Passed as facts, it gets pulled
 * into a rule-separated strip where it can actually be read at a glance.
 */
const VARIANTS = {
  info: { rail: 'bg-brand-600', chip: 'bg-brand-50 text-brand-700', icon: Info },
  success: { rail: 'bg-brand-600', chip: 'bg-brand-50 text-brand-700', icon: CheckCircle2 },
  secure: { rail: 'bg-brand-600', chip: 'bg-brand-50 text-brand-700', icon: ShieldCheck },
  /**
   * Something needs attention but nothing has gone wrong — an unpaid booking,
   * a cancellation warning. Distinct from `error`, which is for a failure that
   * already happened.
   */
  warn: { rail: 'bg-gold', chip: 'bg-gold/15 text-gold-ink', icon: AlertTriangle },
  error: { rail: 'bg-danger', chip: 'bg-danger/10 text-danger-ink', icon: AlertCircle },
};

export const Alert = ({ variant = 'info', title, children, className, icon, facts, actions }) => {
  const config = VARIANTS[variant] ?? VARIANTS.info;
  const Icon = config.icon;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('relative overflow-hidden rounded-xl border border-line bg-surface shadow-card', className)}
    >
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-[3px]', config.rail)} />

      <div className="flex gap-3 p-4 pl-[19px]">
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', config.chip)}>
          {icon ?? <Icon className="size-4" aria-hidden="true" />}
        </span>

        <div className="min-w-0 flex-1">
          {title && <p className="text-[13.5px] font-semibold leading-5 text-ink">{title}</p>}
          {children && (
            <div className={cn('text-[12.5px] leading-5 text-ink-soft', title && 'mt-1')}>{children}</div>
          )}

          {facts?.length > 0 && (
            <dl className="mt-3 flex flex-wrap gap-x-7 gap-y-2 border-t border-line pt-2.5">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                    {fact.label}
                  </dt>
                  <dd className="mt-0.5 font-display text-[13px] font-semibold text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
};
