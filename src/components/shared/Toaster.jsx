import { createPortal } from 'react-dom';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/utils/classNames';

/**
 * Renders the toast queue held in `uiStore`. Mounted once, in `App`.
 *
 * Shares its visual language with `Alert` — accent rail, tinted icon chip, real
 * surface underneath — so a confirmation reads the same whether it arrives as a
 * toast or sits in the page.
 *
 * The rail doubles as a countdown. A message that dismisses itself with no
 * warning reads as a glitch, and anyone mid-sentence has no idea whether they
 * have time to finish reading; draining the rail turns that into information.
 */
const VARIANTS = {
  success: { Icon: CheckCircle2, rail: 'bg-brand-600', chip: 'bg-brand-50 text-brand-700' },
  error: { Icon: AlertCircle, rail: 'bg-danger', chip: 'bg-danger/10 text-danger-ink' },
  warn: { Icon: AlertTriangle, rail: 'bg-gold', chip: 'bg-gold/15 text-gold-ink' },
  info: { Icon: Info, rail: 'bg-info', chip: 'bg-info/10 text-info-ink' },
};

export const Toaster = () => {
  const toasts = useUIStore((state) => state.toasts);
  const dismissToast = useUIStore((state) => state.dismissToast);

  if (!toasts.length) return null;

  return createPortal(
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex flex-col items-center gap-2.5 px-4 sm:items-end sm:px-6"
    >
      {toasts.map(({ id, title, description, variant, duration }) => {
        const { Icon, rail, chip } = VARIANTS[variant] ?? VARIANTS.info;

        return (
          <div
            key={id}
            className="animate-fade-up pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface shadow-raised"
          >
            <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-[3px]', rail)} />

            <div className="flex items-start gap-3 p-3.5 pl-[18px]">
              <span className={cn('grid size-7 shrink-0 place-items-center rounded-lg', chip)}>
                <Icon className="size-3.5" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-5 text-ink">{title}</p>
                {description && <p className="mt-0.5 text-[12.5px] leading-5 text-ink-soft">{description}</p>}
              </div>

              <button
                type="button"
                onClick={() => dismissToast(id)}
                aria-label="Dismiss notification"
                className="-mr-1 -mt-1 rounded-md p-1 text-ink-muted transition-colors hover:bg-line-soft hover:text-ink"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>

            {/* Purely decorative: the text above already carries the message. */}
            {duration > 0 && (
              <span
                aria-hidden="true"
                className={cn('absolute bottom-0 left-0 h-0.5 origin-left animate-toast-countdown', rail)}
                style={{ animationDuration: `${duration}ms` }}
              />
            )}
          </div>
        );
      })}
    </div>,
    document.body,
  );
};
