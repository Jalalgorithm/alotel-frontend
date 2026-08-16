import { Link } from 'react-router-dom';
import { CalendarDays, Clock, Hourglass, MapPin, Presentation, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/classNames';
import { formatCurrency, formatDate } from '@/utils/format';
import { formatTime, SPACE_BOOKING_STATUSES } from '@/lib/spaceSchema';
import { useMySpaceBookings } from '@/features/spaces/hooks/useSpaces';
import { paths } from '@/routes/paths';

/**
 * Space bookings on the dashboard.
 *
 * Kept separate from the residence list rather than merged into it. A stay is
 * measured in nights and a space in hours, they cancel under different rules,
 * and a request-to-book space can be waiting on a host in a way no residence
 * ever is — folding them together would mean a row that had to hedge about
 * which kind it was.
 *
 * Ordered soonest-first among upcoming, since a booking later today matters
 * more than one next month.
 */

/** Statuses that still need something to happen. */
const LIVE_STATUSES = ['pending_payment', 'pending_host_approval', 'confirmed'];

const needsAttention = (booking) =>
  booking.status === 'pending_payment' || booking.status === 'pending_host_approval';

const Row = ({ booking }) => {
  const status = SPACE_BOOKING_STATUSES[booking.status] ?? { label: booking.status, tone: 'neutral' };

  return (
    <li>
      <Link
        to={paths.spaceBooking(booking.id)}
        className={cn(
          'block rounded-lg border p-4 transition-shadow hover:shadow-card',
          needsAttention(booking) ? 'border-gold/40 bg-gold/5' : 'border-line bg-surface',
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-ink">
              <Presentation className="size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
              {booking.spaceName || 'Space booking'}
            </p>

            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3" aria-hidden="true" />
                {formatDate(booking.date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3" aria-hidden="true" />
                {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
              </span>
              {booking.layoutName && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3" aria-hidden="true" />
                  {booking.layoutName} · {booking.guestCount}
                </span>
              )}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <Badge variant={status.tone}>{status.label}</Badge>
            <p className="mt-1.5 text-[13px] font-semibold tabular-nums text-ink">
              {formatCurrency(booking.totalPrice, booking.currency)}
            </p>
          </div>
        </div>

        {/*
          The two states where the guest is the one holding things up, said
          plainly on the row so it does not take opening the booking to find
          out that something is waiting on them.
        */}
        {booking.status === 'pending_payment' && (
          <p className="mt-2.5 inline-flex items-center gap-1.5 border-t border-gold/25 pt-2 text-[11.5px] text-gold-ink">
            <Hourglass className="size-3" aria-hidden="true" />
            Not paid for yet — this slot is held, not booked.
          </p>
        )}

        {booking.status === 'pending_host_approval' && (
          <p className="mt-2.5 inline-flex items-center gap-1.5 border-t border-gold/25 pt-2 text-[11.5px] text-gold-ink">
            <Hourglass className="size-3" aria-hidden="true" />
            Waiting on the host. Nothing is charged unless they accept.
          </p>
        )}

        {booking.status === 'declined' && booking.declineReason && (
          <p className="mt-2.5 border-t border-line pt-2 text-[11.5px] text-ink-soft">
            <span className="font-semibold text-ink">Host&apos;s reason:</span> {booking.declineReason}
          </p>
        )}
      </Link>
    </li>
  );
};

export const SpaceBookingList = ({ className }) => {
  const { data: bookings = [], isLoading } = useMySpaceBookings();

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    );
  }

  /* Nothing booked and nothing past — say so once, and point somewhere useful. */
  if (!bookings.length) {
    return (
      <div className={cn('rounded-lg border border-dashed border-line p-8 text-center', className)}>
        <span className="mx-auto grid size-10 place-items-center rounded-full bg-brand-50 text-brand-700">
          <Presentation className="size-4" aria-hidden="true" />
        </span>
        <p className="mt-3 font-display text-[14px] font-semibold text-ink">No spaces booked yet</p>
        <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-ink-soft">
          Meeting rooms, studios and event halls, booked by the hour or the day.
        </p>
        <Button to={paths.spaces} size="sm" variant="secondary" className="mt-3">
          Browse spaces
        </Button>
      </div>
    );
  }

  const live = bookings
    .filter((booking) => LIVE_STATUSES.includes(booking.status))
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  const past = bookings
    .filter((booking) => !LIVE_STATUSES.includes(booking.status))
    .sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime));

  return (
    <div className={cn('space-y-5', className)}>
      {live.length > 0 && (
        <ul className="space-y-3">
          {live.map((booking) => (
            <Row key={booking.id} booking={booking} />
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
            Finished and cancelled
          </p>
          <ul className="mt-2 space-y-3">
            {past.map((booking) => (
              <Row key={booking.id} booking={booking} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
