import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Download,
  Hourglass,
  MapPin,
  MessageSquare,
  Users,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { SpacesEmpty } from './SpacesEmpty';
import { formatCurrency, formatDate } from '@/utils/format';
import { formatTime, SPACE_BOOKING_STATUSES } from '@/lib/spaceSchema';
import { useCancelSpaceBooking, useSpace, useSpaceBooking, useSpacePaymentStatus } from '../hooks/useSpaces';
import { spaceService } from '../services/spaceService';
import { printSpaceReceipt } from '../spaceReceipt';
import { useAuth } from '@/features/auth';
import { toast } from '@/stores/uiStore';
import { getErrorMessage } from '@/utils/errors';

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

/**
 * A calendar entry for the booking.
 *
 * Built and downloaded in the browser rather than fetched: the booking is
 * already loaded, and an `.ics` file is a few lines of text. Times are written
 * in UTC (the trailing `Z`) so the entry lands correctly whatever timezone the
 * guest's calendar is set to.
 */
const downloadCalendarFile = (booking, space) => {
  const stamp = (iso) => `${iso.replace(/[-:]/g, '').split('.')[0]}Z`;
  const where = [space?.address, space?.city, space?.country].filter(Boolean).join(', ');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Alotel Spaces//EN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@alotelspaces.com`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(new Date(booking.startDateTime).toISOString())}`,
    `DTEND:${stamp(new Date(booking.endDateTime).toISOString())}`,
    `SUMMARY:${booking.spaceName || 'Space booking'}`,
    `LOCATION:${where}`,
    `DESCRIPTION:Alotel Spaces booking ${booking.id}`,
    'END:VEVENT',
    'END:VCALENDAR',
    /* CRLF between lines — the iCalendar spec requires it, and some desktop
       clients reject a file that uses bare newlines. */
  ].join('\r\n');

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'alotel-space-booking.ics';
  link.click();
  URL.revokeObjectURL(url);
};

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

  /*
   * Poll while the booking is unpaid. Each call reconciles server-side against
   * the provider, so this is what actually resolves a booking whose webhook
   * never landed — previously it sat on `pending_payment` for ever and the
   * page simply said payment had not finished, with no way forward.
   */
  const { data: paymentState } = useSpacePaymentStatus(bookingId, {
    enabled: booking?.status === 'pending_payment',
  });
  const { cancel, isPending: cancelling } = useCancelSpaceBooking();
  const { user } = useAuth();

  /* For the address and directions — the booking carries only the space name. */
  const { data: space } = useSpace(booking?.spaceId);

  /*
   * Paying again for a booking that already exists.
   *
   * Without this a guest whose payment fell through had a real booking, a held
   * slot, and no way to pay for it — the only instruction was to start over
   * from the space, which loses the layout and add-ons they had chosen.
   */
  const [isRetrying, setRetrying] = useState(false);
  const retryPayment = async () => {
    setRetrying(true);
    try {
      const payment = await spaceService.initiateSpacePayment({
        bookingId: booking.id,
        currency: booking.currency,
      });
      if (payment?.paymentUrl) window.location.assign(payment.paymentUrl);
      else toast.error('Could not reopen payment', 'Message us and we will send a payment link.');
    } catch (error) {
      toast.error('Could not reopen payment', getErrorMessage(error));
    } finally {
      setRetrying(false);
    }
  };
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

  /*
   * The poll is fresher than the cached booking once it starts returning, so
   * every derived flag below reads from it rather than from the booking that
   * was loaded before the guest went off to pay.
   */
  const liveStatus = paymentState?.status ?? booking.status;

  const status = SPACE_BOOKING_STATUSES[liveStatus] ?? { label: liveStatus, tone: 'neutral' };
  const isAwaitingPayment = liveStatus === 'pending_payment';

  /*
   * Two different situations wear the same booking status. The provider may
   * simply not have reported yet (`initiated`) — normal for the first seconds
   * after checkout — or it may have reported failure. Saying "payment not
   * finished" during the former is alarming and wrong.
   */
  const isSettling = isAwaitingPayment && (paymentState?.paymentStatus ?? 'initiated') === 'initiated';
  const isPending = liveStatus === 'pending_host_approval';
  const isConfirmed = ['confirmed', 'completed'].includes(liveStatus);
  const isDead = ['declined', 'expired', 'cancelled'].includes(liveStatus);

  /* The same conditions the API enforces on PATCH /cancel/. */
  const CANCELLABLE = ['pending_payment', 'pending_host_approval', 'confirmed'];
  const hasStarted = new Date(booking.startDateTime) <= new Date();
  const canCancel = CANCELLABLE.includes(booking.status) && !hasStarted;

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
            : isSettling
              ? 'Confirming your payment'
              : isAwaitingPayment
                ? 'Payment not finished'
              : isPending
                ? 'Request sent'
                : status.label}
        </h1>

        <p className="mt-1.5 text-[13.5px] text-ink-soft">
          {isConfirmed
            ? 'The room is held for you. We have emailed the details.'
            : isSettling
              ? 'This usually takes a few seconds. Your slot is held while we check with the payment provider.'
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
      {isAwaitingPayment && !isSettling && (
        <Alert
          variant="warn"
          className="mt-5"
          title="This space is not booked yet"
          facts={[{ label: 'To pay', value: formatCurrency(booking.totalPrice, booking.currency) }]}
        >
          The slot is held while you pay. Your date, layout and add-ons are all saved — picking up where you left off
          does not mean choosing them again.
          <span className="mt-3 block">
            <Button size="sm" isLoading={isRetrying} disabled={isRetrying} onClick={retryPayment}>
              Finish paying
            </Button>
          </span>
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

      {/*
        Only once the slot is genuinely theirs. Handing someone directions and
        a calendar entry for a booking still awaiting payment or a host's
        answer would imply a certainty that does not exist yet.
      */}
      {isConfirmed && space && (
        <div className="mt-5 rounded-card border border-line bg-surface p-5 shadow-card">
          <h2 className="inline-flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
            <MapPin className="size-4 text-brand-600" aria-hidden="true" />
            Getting there
          </h2>
          <p className="mt-1 text-[12.5px] leading-5 text-ink-soft">
            {[space.address, space.city, space.country].filter(Boolean).join(', ')}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                space.coordinates?.lat != null
                  ? `${space.coordinates.lat},${space.coordinates.lng}`
                  : [space.address, space.city, space.country].filter(Boolean).join(', '),
              )}`}
              target="_blank"
              rel="noreferrer noopener"
              size="sm"
              variant="secondary"
              leftIcon={<MapPin className="size-3.5" aria-hidden="true" />}
            >
              Directions
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => downloadCalendarFile(booking, space)}
              leftIcon={<CalendarPlus className="size-3.5" aria-hidden="true" />}
            >
              Add to calendar
            </Button>
          </div>
        </div>
      )}

      {/*
        Messaging is property-only server-side — `MessageThread.booking` is a
        one-to-one on `bookings.Booking`, so a space booking has no thread to
        write into. Rather than show a box that cannot send, the guest is given
        the routes that do work, with the reference they will be asked for.
      */}
      <div className="mt-5 rounded-card border border-line bg-surface p-5 shadow-card">
        <h2 className="inline-flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
          <MessageSquare className="size-4 text-brand-600" aria-hidden="true" />
          Need to change something?
        </h2>
        <p className="mt-1 text-[12.5px] leading-5 text-ink-soft">
          Email us at{' '}
          <a href={`mailto:hello@alotelspaces.com?subject=${encodeURIComponent(`Space booking ${booking.id}`)}`} className="font-medium text-brand-700 hover:underline">
            hello@alotelspaces.com
          </a>{' '}
          quoting the reference above, and we will pick it up within a working day.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {/* Offered whenever money has settled — the same rule the property
            receipt follows, so neither promises a document for a booking that
            was never paid. */}
        {isConfirmed && (
          <Button
            variant="secondary"
            onClick={() => printSpaceReceipt({ booking, space, guest: user })}
            leftIcon={<Download className="size-3.5" aria-hidden="true" />}
          >
            Download receipt
          </Button>
        )}

        <Button to="/spaces" variant="secondary">
          Browse more spaces
        </Button>

        {/*
          Mirrors the server's two guards rather than letting the guest press a
          button that will 400: it refuses any status outside its cancellable
          set, and refuses once the booking has started. Hiding the control is
          kinder than explaining the rejection afterwards.
        */}
        {canCancel && (
          <Button variant="ghost" isLoading={cancelling} disabled={cancelling} onClick={() => cancel(booking.id)}>
            {isPending ? 'Withdraw request' : 'Cancel booking'}
          </Button>
        )}

        {!canCancel && hasStarted && !isDead && (
          <span className="self-center text-[12px] text-ink-muted">
            This booking has started — message the host to change it.
          </span>
        )}
      </div>
    </div>
  );
};
