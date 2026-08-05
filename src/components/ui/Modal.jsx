import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { useClickOutside } from '@/hooks/useClickOutside';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Accessible dialog rendered in a portal.
 * Locks body scroll and closes on backdrop click / Escape.
 */
export const Modal = ({ isOpen, onClose, title, description, size = 'md', className, children }) => {
  const panelRef = useClickOutside(() => onClose?.(), isOpen);

  useEffect(() => {
    if (!isOpen) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'animate-fade-up relative z-10 w-full rounded-card bg-surface shadow-raised',
          SIZES[size] ?? SIZES.md,
          className,
        )}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              {title && <h2 className="text-lg font-semibold">{title}</h2>}
              {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-md p-1 text-ink-muted transition-colors hover:bg-black/5 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}

        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
