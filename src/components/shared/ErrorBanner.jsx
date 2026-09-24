import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, Clock, LifeBuoy, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/utils/classNames';

/**
 * The banner that carries a failed action, across the top of the page.
 *
 * It replaced a message printed under the button that failed. On a short form
 * that was fine; on a long one — the contract step, where the agreement text
 * scrolls for pages — it appeared below the fold, nothing moved, and the guest
 * was left looking at a button that had apparently done nothing.
 *
 * Mounted at the application root rather than inside a layout, because the
 * screens that fail hardest are the ones with no site chrome: sign-in, the
 * booking wizard, the contract step.
 *
 * Decisions worth keeping:
 *  - **Sticky, not fixed.** It takes its own space at the top of the document
 *    instead of floating over the header, so nothing is ever covered.
 *  - **It does not time out.** A failure the guest has to act on must not
 *    disappear while they are reading it. Toasts remain for things that
 *    happened in the background.
 *  - **It clears on navigation.** A problem with the page you have left is
 *    noise on the page you have arrived at.
 *  - **It takes focus once.** Announced to a screen reader, and the keyboard
 *    lands on it — including on the recovery actions it carries.
 */

const TONES = {
  /* The guest can put this right: a wrong code, a wrong password. */
  fixable: {
    icon: AlertCircle,
    bar: 'bg-danger',
    surface: 'bg-danger/10',
    iconWrap: 'bg-danger/15 text-danger-ink',
  },
  /* Ours, and probably temporary: a provider is down, a request timed out. */
  temporary: {
    icon: Clock,
    bar: 'bg-gold',
    surface: 'bg-gold/15',
    iconWrap: 'bg-gold/25 text-gold-ink',
  },
  /* Ours, and it needs a person. */
  support: {
    icon: LifeBuoy,
    bar: 'bg-brand-600',
    surface: 'bg-brand-50',
    iconWrap: 'bg-brand-100 text-brand-700',
  },
};

export const ErrorBanner = () => {
  const banner = useUIStore((state) => state.errorBanner);
  const dismiss = useUIStore((state) => state.dismissErrorBanner);
  const location = useLocation();
  const ref = useRef(null);
  const lastPath = useRef(location.pathname);

  /* A failure belongs to the screen that caused it. */
  useEffect(() => {
    if (location.pathname !== lastPath.current) {
      lastPath.current = location.pathname;
      dismiss();
    }
  }, [location.pathname, dismiss]);

  useEffect(() => {
    if (banner) ref.current?.focus({ preventScroll: true });
  }, [banner]);

  if (!banner) return null;

  const config = TONES[banner.tone] ?? TONES.fixable;
  const Icon = config.icon;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      className={cn(
        'sticky top-0 z-[60] w-full border-b border-line focus:outline-none',
        config.surface,
      )}
    >
      <span aria-hidden="true" className={cn('block h-[3px] w-full', config.bar)} />

      <div className="shell flex items-start gap-3 py-3">
        <span className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg', config.iconWrap)}>
          <Icon className="size-4" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-ink">{banner.title}</p>

          {banner.message && <p className="mt-0.5 text-[13px] leading-5 text-ink-soft">{banner.message}</p>}

          {banner.detail && <p className="mt-1 text-[12.5px] leading-5 text-ink-soft">{banner.detail}</p>}

          {Boolean(banner.actions?.length) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {banner.actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    dismiss();
                    action.onClick?.();
                  }}
                  className="rounded-md border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {banner.reference && (
            <p className="mt-2 font-mono text-[11px] text-ink-muted">
              Reference {banner.reference} · {new Date().toLocaleTimeString()}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="-mr-1 grid size-8 shrink-0 place-items-center rounded-md text-ink-muted transition-colors hover:bg-black/5 hover:text-ink"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
