import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellOff, Check, Mail, MessageSquare, Megaphone, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/classNames';
import { formatDate } from '@/utils/format';
import {
  useNotificationMutations,
  useNotificationPreferences,
  useNotifications,
} from '../hooks/useNotifications';

/**
 * Every notification, grouped by day.
 *
 * Grouped by when rather than by kind: someone opening this page is catching up
 * on what they missed, and "yesterday" is the axis they think along. Kind is
 * carried by the coloured rail on each row instead.
 */

const TONE_RAIL = {
  success: 'bg-brand-600',
  danger: 'bg-danger',
  warn: 'bg-gold',
  info: 'bg-info',
};

/** "Today" / "Yesterday" / a date — relative labels only where they help. */
const dayLabel = (iso) => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(date, today)) return 'Today';
  if (same(date, yesterday)) return 'Yesterday';
  return formatDate(iso);
};

const PREFERENCES = [
  { key: 'inApp', icon: Smartphone, label: 'In-app', hint: 'Everything on this page.' },
  { key: 'email', icon: Mail, label: 'Email', hint: 'Booking confirmations and receipts.' },
  { key: 'sms', icon: MessageSquare, label: 'SMS', hint: 'Time-critical updates only.' },
  { key: 'marketing', icon: Megaphone, label: 'Offers', hint: 'Occasional news. Off by default.' },
];

const PreferencesPanel = () => {
  const { preferences, isLoading, updatePreferences, isSaving } = useNotificationPreferences();

  if (isLoading || !preferences) return <Skeleton className="h-44 w-full rounded-card" />;

  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-card">
      <h2 className="text-[13px] font-semibold text-ink">How we reach you</h2>
      <p className="mt-0.5 text-[11.5px] text-ink-muted">Changes save as you make them.</p>

      <ul className="mt-3 space-y-2.5">
        {PREFERENCES.map(({ key, icon: Icon, label, hint }) => {
          const isOn = preferences[key];

          return (
            <li key={key} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                <Icon className="size-3.5" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium text-ink">{label}</p>
                <p className="text-[11px] text-ink-muted">{hint}</p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isOn}
                aria-label={`${label} notifications`}
                disabled={isSaving}
                onClick={() => updatePreferences({ [key]: !isOn })}
                className={cn(
                  'mt-0.5 h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors disabled:opacity-50',
                  isOn ? 'bg-brand-600' : 'bg-line',
                )}
              >
                <span
                  className={cn(
                    'block size-4 rounded-full bg-white shadow-sm transition-transform',
                    isOn && 'translate-x-4',
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export const NotificationsPage = () => {
  const { notifications, unreadCount, isLoading } = useNotifications();
  const { markRead, markAllRead, isMarkingAll } = useNotificationMutations();
  const [filter, setFilter] = useState('all');

  const visible = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const byDay = useMemo(() => {
    const groups = [];

    visible.forEach((notification) => {
      const label = dayLabel(notification.sentAt);
      const existing = groups.find((group) => group.label === label);
      if (existing) existing.items.push(notification);
      else groups.push({ label, items: [notification] });
    });

    return groups;
  }, [visible]);

  const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-semibold text-ink sm:text-[28px]">Notifications</h1>
          <p className="mt-1 text-[13px] text-ink-soft">
            {unreadCount ? `${unreadCount} unread` : 'You are all caught up.'}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            isLoading={isMarkingAll}
            disabled={isMarkingAll}
            onClick={() => markAllRead(unreadIds)}
            leftIcon={<Check className="size-3.5" aria-hidden="true" />}
          >
            Mark all read
          </Button>
        )}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          <div className="flex gap-2">
            {[
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'unread', label: `Unread (${unreadCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                aria-pressed={filter === tab.id}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors',
                  filter === tab.id
                    ? 'border-brand-700 bg-brand-700 font-medium text-white'
                    : 'border-line bg-surface text-ink-soft hover:border-brand-300',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="mt-5 space-y-2.5">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-card" />
              ))}
            </div>
          ) : byDay.length ? (
            <div className="mt-5 space-y-6">
              {byDay.map((group) => (
                <section key={group.label}>
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                    {group.label}
                  </h2>

                  <ul className="mt-2 space-y-2">
                    {group.items.map((notification) => {
                      const target = notification.bookingId ? `/bookings/${notification.bookingId}` : null;

                      const body = (
                        <>
                          <span
                            aria-hidden="true"
                            className={cn(
                              'absolute inset-y-0 left-0 w-[3px]',
                              TONE_RAIL[notification.tone] ?? TONE_RAIL.info,
                            )}
                          />
                          <div className="flex items-start justify-between gap-3 pl-3.5">
                            <div className="min-w-0">
                              <p className={cn('text-[13px] text-ink', !notification.isRead && 'font-semibold')}>
                                {notification.title}
                              </p>
                              <p className="mt-0.5 text-[12.5px] leading-5 text-ink-soft">{notification.body}</p>
                              <p className="mt-1.5 text-[10.5px] text-ink-muted">
                                {notification.group} · {formatDate(notification.sentAt)}
                              </p>
                            </div>

                            {!notification.isRead && (
                              <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-600" aria-label="Unread" />
                            )}
                          </div>
                        </>
                      );

                      return (
                        <li key={notification.id}>
                          {target ? (
                            <Link
                              to={target}
                              onClick={() => !notification.isRead && markRead(notification.id)}
                              className={cn(
                                'relative block overflow-hidden rounded-card border border-line bg-surface p-3.5 shadow-card transition-shadow hover:shadow-raised',
                                !notification.isRead && 'bg-brand-50/30',
                              )}
                            >
                              {body}
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => !notification.isRead && markRead(notification.id)}
                              className={cn(
                                'relative block w-full overflow-hidden rounded-card border border-line bg-surface p-3.5 text-left shadow-card',
                                !notification.isRead && 'bg-brand-50/30',
                              )}
                            >
                              {body}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-card border border-dashed border-line p-10 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-50 text-brand-700">
                <BellOff className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-3 font-display text-[15px] font-semibold text-ink">
                {filter === 'unread' ? 'Nothing unread' : 'No notifications yet'}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-ink-soft">
                Updates about your bookings, payments and stays will arrive here.
              </p>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-5 lg:self-start">
          <PreferencesPanel />
        </aside>
      </div>
    </div>
  );
};
