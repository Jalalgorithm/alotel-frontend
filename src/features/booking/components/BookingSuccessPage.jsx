import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Download, Home, Loader2, MapPin, TriangleAlert, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Logo } from '@/components/shared/Logo';
import { formatDate } from '@/utils/format';
import { paths } from '@/routes/paths';
import { useBookingStore } from '@/stores/bookingStore';
import { useBooking, usePaymentStatus } from '../hooks/useBookingMutations';
import { PriceSummary } from './PriceSummary';
import { useProperty } from '@/features/properties';

/**
 * Where the guest lands after the provider's checkout page.
 *
 * The provider redirects back with only its own session id, so the booking id
 * is read from the draft the wizard stashed before leaving. The webhook that
 * actually confirms the booking may not have arrived yet, so this polls the
 * status endpoint until the booking settles rather than asserting success the
 * moment the guest reappears.
 *
 * Because that draft is the only carrier of the id, it is captured into local
 * state on arrival — see `bookingId` below.
 */
export const BookingSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const draftBookingId = useBookingStore((state) => state.draft.bookingId);
  const reset = useBookingStore((state) => state.reset);

  /*
   * The provider returns every guest to this one URL and names the parameter
   * after the kind of booking: `space_booking_id` for a space,
   * `booking_id` for a residence. Reading the space one first means a space
   * checkout is routed immediately, with no wasted lookup against the
   * property endpoint.
   */
  const spaceBookingId = searchParams.get('space_booking_id');
  const incomingId = spaceBookingId ?? searchParams.get('booking_id') ?? draftBookingId ?? null;

  /**
   * Latch the booking id the first time we see one, and never let go.
   *
   * This page clears the draft once the booking settles — and the provider
   * returns with only its own `session_id`, no `booking_id` — so re-deriving
   * the id on every render would hand back `null` the moment that reset lands,
   * and the page would tell a guest who has just paid that their booking
   * cannot be found. Holding it locally makes the reset harmless.
   */
  const [bookingId, setBookingId] = useState(incomingId);

  useEffect(() => {
    if (incomingId && !bookingId) setBookingId(incomingId);
  }, [incomingId, bookingId]);

  /*
   * A space is known from the URL, so it never needs the property endpoint.
   * The `kind` fallback below still covers checkout sessions created before
   * the backend started distinguishing the two — a guest mid-payment right
   * now will still come back on the old `booking_id` parameter.
   */
  const { data: status, isLoading: isChecking } = usePaymentStatus(bookingId, {
    enabled: !spaceBookingId,
  });

  /*
   * The provider returns every guest to this one URL, property or space alike,
   * so an id that turns out to belong to a space booking is handed straight to
   * the page that knows how to present one — countdown, host approval and all.
   * `replace` so Back does not bounce them here again.
   */
  useEffect(() => {
    const isSpace = spaceBookingId || status?.kind === 'space';
    if (isSpace && bookingId) {
      navigate(paths.spaceBooking(bookingId), { replace: true });
    }
  }, [spaceBookingId, status?.kind, bookingId, navigate]);
  const { data: booking } = useBooking(bookingId);
  // Only needed to name the tax line; the amounts all come from the booking.
  const { data: property } = useProperty(booking?.propertyId);

  const isSettled = status?.status && status.status !== 'pending_payment';

  /*
   * Payment succeeding and the stay being confirmed are not the same event.
   * A booking that needs identity verification or host approval lands on
   * `pending_kyc` / `pending_approval` — the money is taken, the stay is not
   * yet secured. Calling all of those "Booking confirmed" contradicted the
   * dashboard, which correctly showed them as pending, and left guests unsure
   * which screen to believe.
   */
  const isPaid = ['confirmed', 'active', 'completed', 'pending_kyc', 'pending_approval'].includes(status?.status);
  const isConfirmed = ['confirmed', 'active', 'completed'].includes(status?.status);
  const needsVerification = status?.status === 'pending_kyc';
  const needsApproval = status?.status === 'pending_approval';

  /*
   * The poll has no natural end if a provider webhook never lands, so after
   * half a minute the copy stops promising "a few seconds" and says what is
   * actually happening. Polling continues underneath.
   */
  const [isSlow, setSlow] = useState(false);
  useEffect(() => {
    if (isSettled) return undefined;
    const timer = setTimeout(() => setSlow(true), 30_000);
    return () => clearTimeout(timer);
  }, [isSettled]);

  // Once the booking is confirmed the draft has served its purpose; clearing it
  // stops a stale bookingId from hijacking the guest's next booking.
  useEffect(() => {
    if (isPaid) reset();
  }, [isPaid, reset]);

  if (!bookingId) {
    return (
      <div className="shell flex min-h-[70vh] flex-col items-center justify-center py-10 text-center">
        <Logo className="mb-6" />
        <Alert variant="warn" title="We could not identify this booking" className="max-w-md text-left">
          The confirmation link is missing a booking reference. Your bookings are listed on your dashboard.
        </Alert>
        <Button to={paths.dashboard} className="mt-6">
          Go to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="shell py-10">
      <div className="mx-auto max-w-lg">
        <div className="text-center">
          <Logo className="mx-auto mb-8" />

          {!isSettled && (
            <>
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50">
                <Loader2 className="size-6 animate-spin text-brand-600" aria-hidden="true" />
              </span>
              <h1 className="mt-4 font-display text-[24px] font-bold text-brand-700 sm:text-[28px]">
                Confirming your payment
              </h1>
              <p className="mt-2 text-[13px] text-ink-muted">
                {isSlow
                  ? 'This is taking longer than usual. Your payment is safe — we are still waiting on confirmation from the payment provider, and will email you as soon as it lands.'
                  : 'This usually takes a few seconds. You can safely leave this page — we will email you either way.'}
              </p>
            </>
          )}

          {isSettled && isConfirmed && (
            <>
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-ok-soft">
                <CheckCircle2 className="size-7 text-ok" aria-hidden="true" />
              </span>
              <h1 className="mt-4 font-display text-[24px] font-bold text-brand-700 sm:text-[28px]">
                Booking confirmed
              </h1>
              <p className="mt-2 text-[13px] text-ink-muted">
                Your payment went through. A confirmation email is on its way.
              </p>
            </>
          )}

          {isSettled && isPaid && !isConfirmed && (
            <>
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50">
                <CheckCircle2 className="size-7 text-brand-600" aria-hidden="true" />
              </span>
              <h1 className="mt-4 font-display text-[24px] font-bold text-brand-700 sm:text-[28px]">
                Payment received
              </h1>
              <p className="mt-2 text-[13px] text-ink-muted">
                {needsVerification
                  ? 'One step left — we need to verify your identity before this stay is confirmed. It takes a couple of minutes.'
                  : needsApproval
                    ? 'Your booking is with our team for final approval. We will confirm by email, usually within a day.'
                    : 'Your booking is being finalised. We will confirm by email shortly.'}
              </p>

              {needsVerification && (
                <Button to={paths.dashboard} className="mt-5">
                  Complete verification
                </Button>
              )}
            </>
          )}

          {isSettled && !isConfirmed && (
            <>
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-warn-soft">
                <TriangleAlert className="size-7 text-warn" aria-hidden="true" />
              </span>
              <h1 className="mt-4 font-display text-[24px] font-bold text-brand-700 sm:text-[28px]">
                Payment not completed
              </h1>
              <p className="mt-2 text-[13px] text-ink-muted">
                Your booking is still held. You can retry payment from your dashboard.
              </p>
            </>
          )}
        </div>

        {/* Booking summary */}
        {booking && (
          <div className="mt-8 rounded-card border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-ink-muted">Reference</span>
              <span className="truncate font-mono text-[12px] text-ink">{booking.id}</span>
            </div>

            <dl className="mt-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <dt className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-soft">
                  <CalendarDays className="size-3.5 text-brand-600" aria-hidden="true" />
                  Dates
                </dt>
                <dd className="text-right text-[12.5px] text-ink">
                  {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                  <span className="block text-[11px] text-ink-muted">
                    {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                  </span>
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-soft">
                  <Users className="size-3.5 text-brand-600" aria-hidden="true" />
                  Guests
                </dt>
                <dd className="text-right text-[12.5px] text-ink">
                  {booking.adults} {booking.adults === 1 ? 'adult' : 'adults'}
                  {booking.children > 0 && `, ${booking.children} children`}
                  {booking.infants > 0 && `, ${booking.infants} infants`}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-soft">
                  <MapPin className="size-3.5 text-brand-600" aria-hidden="true" />
                  Status
                </dt>
                <dd className="text-right text-[12.5px] font-medium text-ink">{booking.statusLabel}</dd>
              </div>
            </dl>

            {booking.pricing && (
              <PriceSummary
                pricing={booking.pricing}
                nights={booking.nights}
                currency={booking.currency}
                country={property?.location}
                className="mt-4 border-t border-line pt-3"
              />
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Button
            to={paths.dashboard}
            fullWidth
            className="min-w-0 sm:flex-1"
            size="lg"
            leftIcon={<Home className="size-4" aria-hidden="true" />}
          >
            Go to dashboard
          </Button>
          <Button
            variant="secondary"
            fullWidth
            className="min-w-0 sm:flex-1"
            size="lg"
            to={paths.properties}
            leftIcon={<Download className="size-4" aria-hidden="true" />}
          >
            Browse more stays
          </Button>
        </div>

        {isChecking && !isSettled && (
          <p className="mt-4 text-center text-[11.5px] text-ink-muted">Checking with the payment provider…</p>
        )}
      </div>
    </div>
  );
};
