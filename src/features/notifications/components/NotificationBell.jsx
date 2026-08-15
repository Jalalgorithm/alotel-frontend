import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { useClickOutside } from '@/hooks/useClickOutside';
import { formatDate } from '@/utils/format';
import { useNotificationMutations, useNotifications } from '../hooks/useNotifications';

/**
 * The navbar bell.
 *
 * Shows the most recent handful rather than everything — a dropdown is for
 * "has anything happened", not for reading an archive. The full page handles
 * the rest.
 *
 * Opening the dropdown deliberately does *not* mark everything read. A glance
 * at a list is not the same as having read it, and silently clearing the badge
 * is how people miss things.
 */

const PREVIEW_COUNT = 6;

const TONE_DOT = {
  success: 'bg-brand-600',
  danger: 'bg-danger',
  warn: 'bg-gold',
  info: 'bg-info',
};

export const NotificationBell = () => {
  const [isOpen, setOpen] = useState(false);
  const panelRef = useClickOutside(() => setOpen(false), isOpen);

  const { notifications, unreadCount } = useNotifications();
  const { markRead, markAllRead, isMarkingAll } = useNotificationMutations();

  const preview = notifications.slice(0, PREVIEW_COUNT);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={isOpen}
        className="relative flex size-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
      >
        <Bell className="size-4" aria-hidden="true" />

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold leading-4 text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-[330px] overflow-hidden rounded-xl border border-line bg-surface shadow-raised">
          <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
            <p className="text-[12.5px] font-semibold text-ink">
              Notifications
              {unreadCount > 0 && <span className="ml-1.5 text-[11px] font-normal text-ink-muted">{unreadCount} new</span>}
            </p>

            {unreadCount > 0 && (
              <button
                type="button"
                disabled={isMarkingAll}
                onClick={() => markAllRead()}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:underline disabled:opacity-50"
              >
                <Check className="size-3" aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          {preview.length ? (
            <ul className="max-h-[340px] divide-y divide-line overflow-y-auto">
              {preview.map((notification) => {
                const target = notification.bookingId ? `/bookings/${notification.bookingId}` : '/notifications';

                return (
                  <li key={notification.id}>
                    <Link
                      to={target}
                      onClick={() => {
                        if (!notification.isRead) markRead(notification.id);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-line-soft',
                        !notification.isRead && 'bg-brand-50/40',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', TONE_DOT[notification.tone] ?? TONE_DOT.info)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-[12.5px] text-ink', !notification.isRead && 'font-semibold')}>
                          {notification.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-4 text-ink-soft">
                          {notification.body}
                        </span>
                        <span className="mt-1 block text-[10.5px] text-ink-muted">{formatDate(notification.sentAt)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-3.5 py-6 text-center text-[12px] text-ink-muted">
              Nothing yet. Booking updates will appear here.
            </p>
          )}

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-line px-3.5 py-2.5 text-center text-[12px] font-medium text-brand-700 hover:bg-line-soft"
          >
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
};
