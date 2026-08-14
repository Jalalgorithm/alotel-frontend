import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock, Hourglass, Users, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { SpacesEmpty } from './SpacesEmpty';
import { formatCurrency, formatDate } from '@/utils/format';
import { formatTime, SPACE_BOOKING_STATUSES } from '@/lib/spaceSchema';
import { useSpaceBooking } from '../hooks/useSpaces';

/**
 * The outcome of a space booking.
 *
 * Two genuinely different endings, so two different pages rather than one with
 * the word swapped: an instant booking is *done*, and a request is a promise
 * someone else still has to keep. Telling a guest "confirmed" when a host has
 * not answered is how people turn up to a locked door.
 *
 * For a pending request the page shows a live countdown to auto-expiry, because
 * "24 hours to respond" is only reassuring if you can see how much is left.
 */

/** Human "7h 12m left", recomputed each minute. */
const useCountdown = (expiresAt) => {
  const [remaining, setRemaining] = useState(() => (expiresAt ? new Date(expiresAt) - Date.now() : null));

  useEffect(() => {
    if (!expiresAt) return undefined;
    const tick = () => setRemaining(new Date(expiresAt) - Date.now());
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (remaining == null) return null;
  if (remaining <= 0) return 'expired';

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const STAGES = [
  { id: 'pending_host_approval', label: 'Requested' },
  { id: 'confirmed', label: 'Approved' },
  { id: 'completed', label: 'Completed' },
];

const RequestTracker = ({ status }) => {
  const reached = STAGES.findIndex((stage) => stage.id === status);
  const isDead = ['declined', 'expired', 'cancelled'].includes(status);

  return (
    <ol className="flex items-center gap-1.5">
      {STAGES.map((stage, index) => {
        const isDone = !isDead && index <= (reached === -1 ? 0 : reached);

        return (
          <li key={stage.id} className="flex items-center gap-1.5">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                isDone ? 'bg-brand-50 text-brand-700' : 'bg-line-soft text-ink-muted'
              }`}
            >
              {stage.label}
            </span>
            {index < STAGES.length - 1 && (
              <span aria-hidden="true" className={`h-px w-4 ${isDone ? 'bg-brand-600' : 'bg-line'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
};

export const SpaceBookingConfirmationPage = () => {
  const { bookingId } = useParams();
  const { data: booking, isLoading } = useSpaceBooking(bookingId);
  const countdown = useCountdown(booking?.expiresAt);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <SpacesEmpty title="We could not find that booking" />
      </div>
    );
  }

  const status = SPACE_BOOKING_STATUSES[booking.status] ?? { label: booking.status, tone: 'neutral' };
  const isAwaitingPayment = booking.status === 'pending_payment';
  const isPending = booking.status === 'pending_host_approval';
  const isConfirmed = ['confirmed', 'completed'].includes(booking.status);
  const isDead = ['declined', 'expired', 'cancelled'].includes(booking.status);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <span
          className={`inline-grid size-12 place-items-center rounded-full ${
            isConfirmed ? 'bg-brand-50 text-brand-700' : isDead ? 'bg-danger/10 text-danger' : 'bg-gold/15 text-gold-ink'
          }`}
        >
          {isConfirmed ? (
            <CheckCircle2 className="size-6" aria-hidden="true" />
          ) : isDead ? (
            <XCircle className="size-6" aria-hidden="true" />
          ) : (
            <Hourglass className="size-6" aria-hidden="true" />
          )}
        </span>

        <h1 className="mt-3 font-display text-[22px] font-semibold text-ink">
          {isConfirmed
            ? 'Your space is confirmed'
            : isAwaitingPayment
              ? 'Payment not finished'
              : isPending
                ? 'Request sent'
                : status.label}
        </h1>

        <p className="mt-1.5 text-[13.5px] text-ink-soft">
          {isConfirmed
            ? 'The room is held for you. We have emailed the details.'
            : isAwaitingPayment
              ? 'Your slot is held but nothing has been taken yet. Finish paying to confirm it.'
            : isPending
              ? `${booking.spaceName} — the host has ${countdown === 'expired' ? 'no time' : countdown} left to respond.`
              : booking.declineReason || 'This booking is no longer going ahead.'}
        </p>
      </div>

      {/*
        A booking sits in `pending_payment` until Stripe reports back. Saying
        "confirmed" here would be a lie, and saying nothing leaves the guest
        assuming a room they have not actually secured.
      */}
      {isAwaitingPayment && (
        <Alert
          variant="warn"
          className="mt-5"
          title="This space is not booked yet"
          facts={[{ label: 'To pay', value: formatCurrency(booking.totalPrice, booking.currency) }]}
        >
          The slot is held while you pay. If you closed the payment page by accident, start the booking again from the
          space and your held slot will still be there.
        </Alert>
      )}

      {isPending && (
        <div className="mt-5 flex justify-center">
          <RequestTracker status={booking.status} />
        </div>
      )}

      {isPending && (
        <Alert
          variant="warn"
          className="mt-5"
          title="Nothing is charged yet"
          facts={[
            { label: 'Host responds within', value: countdown === 'expired' ? 'Time is up' : countdown },
            { label: 'Total if approved', value: formatCurrency(booking.totalPrice, booking.currency) },
          ]}
        >
          If the host does not respond in time the request expires on its own and the slot is released — you will not be
          charged either way.
        </Alert>
      )}

      <div className="mt-5 rounded-card border border-line bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-[16px] font-semibold text-ink">{booking.spaceName}</h2>
            <p className="mt-0.5 text-[12px] text-ink-muted">Reference {booking.id}</p>
          </div>
          <Badge variant={status.tone}>{status.label}</Badge>
        </div>

        <dl className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
          <div>
            <dt className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
              <CalendarDays className="size-3" aria-hidden="true" />
              Date
            </dt>
            <dd className="mt-1 text-[13px] font-semibold text-ink">{formatDate(booking.date)}</dd>
          </div>
          <div>
            <dt className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
              <Clock className="size-3" aria-hidden="true" />
              Time
            </dt>
            <dd className="mt-1 text-[13px] font-semibold text-ink">
              {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
            </dd>
          </div>
          <div>
            <dt className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
              <Users className="size-3" aria-hidden="true" />
              Layout
            </dt>
            <dd className="mt-1 text-[13px] font-semibold text-ink">
              {booking.layoutName} · {booking.guestCount}
            </dd>
          </div>
        </dl>

        {booking.addons.length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-line pt-4">
            {booking.addons.map((addon) => (
              <li key={addon.addonId} className="flex justify-between text-[12.5px]">
                <span className="text-ink-soft">
                  {addon.name} × {addon.qty}
                </span>
                <span className="tabular-nums text-ink">
                  {formatCurrency(addon.priceAtBooking * addon.qty, booking.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <dl className="mt-4 space-y-1 border-t border-line pt-4 text-[12.5px]">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Space</dt>
            <dd className="tabular-nums text-ink">{formatCurrency(booking.basePrice, booking.currency)}</dd>
          </div>
          {booking.addonsPrice > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-soft">Add-ons</dt>
              <dd className="tabular-nums text-ink">{formatCurrency(booking.addonsPrice, booking.currency)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-ink-soft">Tax</dt>
            <dd className="tabular-nums text-ink">{formatCurrency(booking.taxTotal, booking.currency)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-1.5 font-semibold">
            <dt className="text-ink">Total</dt>
            <dd className="tabular-nums text-ink">{formatCurrency(booking.totalPrice, booking.currency)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button to="/spaces" variant="secondary">
          Browse more spaces
        </Button>

        {/*
          There is no guest-facing cancel endpoint for spaces — only host
          approve/decline. Offering a button that always errors is worse than
          telling the guest who can actually do it.
        */}
        {!isDead && booking.status !== 'completed' && (
          <Button to="/spaces" variant="ghost">
            Contact the host to change this
          </Button>
        )}
      </div>
    </div>
  );
};
