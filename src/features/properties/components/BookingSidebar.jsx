import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Minus,
  Plus,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/classNames';
import { formatCurrency, formatDate } from '@/utils/format';
import { paths } from '@/routes/paths';
import { toast } from '@/stores/uiStore';
import { useAuth } from '@/features/auth';
import { useClickOutside } from '@/hooks/useClickOutside';
import { PriceSummary, useAvailability } from '@/features/booking';
import { useBookingStore } from '@/stores/bookingStore';
import { addDays, nightsBetweenIso, todayIso } from '@/lib/bookingSchema';
import { DateRangeCalendar } from './DateRangeCalendar';
import { usePropertyAvailability } from '../hooks/useProperty';

/* -------------------------------------------------------------------------- */
/* Controls                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The two date fields that open the calendar.
 *
 * They are buttons rather than inputs: the dates are only ever chosen from the
 * calendar, and a text field would invite typing that then has to be rejected.
 *
 * The year is spelled out because the calendar happily runs a year ahead, and
 * "12 Aug" alone is ambiguous once you have paged past December.
 */
const RangeSummary = ({ checkIn, checkOut, nights, isOpen, onOpen }) => (
  <div className="flex items-stretch gap-2">
    {[
      { id: 'check-in', label: 'Check-in', value: checkIn },
      { id: 'check-out', label: 'Check-out', value: checkOut },
    ].map((field) => (
      <button
        key={field.id}
        type="button"
        onClick={onOpen}
        aria-expanded={isOpen}
        aria-label={`${field.label}${field.value ? `: ${formatDate(field.value, 'd MMM yyyy')}` : ' — select a date'}`}
        className={cn(
          'min-w-0 flex-1 rounded-lg border px-3 py-2 text-left transition-colors',
          isOpen ? 'border-brand-600 ring-2 ring-brand-600/15' : 'border-line hover:border-brand-300',
        )}
      >
        {/* `whitespace-nowrap` is load-bearing: at this width "Check-out" plus
            the icon wraps to two lines and the two fields stop matching. */}
        <span className="flex items-center gap-1 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.05em] text-ink-muted">
          <CalendarDays className="size-2.5 shrink-0" aria-hidden="true" />
          {field.label}
        </span>
        <span className={cn('mt-0.5 block truncate text-[12.5px]', field.value ? 'text-ink' : 'text-ink-muted')}>
          {field.value ? formatDate(field.value, 'd MMM yyyy') : 'Select a date'}
        </span>
      </button>
    ))}

    {nights > 0 && (
      <div className="flex shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 px-3">
        <span className="font-display text-[15px] font-bold leading-none text-brand-700">{nights}</span>
        <span className="text-[10px] text-brand-700">{nights === 1 ? 'night' : 'nights'}</span>
      </div>
    )}
  </div>
);

const GuestRow = ({ label, hint, value, onChange, min = 0, max = 20, disabled }) => (
  <div className="flex items-center justify-between gap-3 py-2">
    <div className="min-w-0">
      <p className="text-[12.5px] font-medium text-ink">{label}</p>
      <p className="text-[11px] text-ink-muted">{hint}</p>
    </div>

    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label={`Fewer ${label.toLowerCase()}`}
        className="flex size-7 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-brand-400 hover:text-brand-700 disabled:opacity-40 disabled:hover:border-line"
      >
        <Minus className="size-3" />
      </button>
      <span className="min-w-6 text-center text-[13px] font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label={`More ${label.toLowerCase()}`}
        className="flex size-7 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-brand-400 hover:text-brand-700 disabled:opacity-40 disabled:hover:border-line"
      >
        <Plus className="size-3" />
      </button>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Sticky booking widget on the property detail page.
 *
 * Dates and party size are checked against the API on every change, so the
 * guest learns a stay is unavailable — or too long, or over the guest cap —
 * before they commit to it rather than at the end of the wizard.
 */
export const BookingSidebar = ({ property }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const setStay = useBookingStore((state) => state.setStay);
  const startBooking = useBookingStore((state) => state.startBooking);

  const today = todayIso();

  const [checkIn, setCheckIn] = useState(() => addDays(today, 7));
  const [checkOut, setCheckOut] = useState(() => addDays(today, 7 + Math.max(1, property.minStay ?? 1)));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  const { data: calendar, isLoading: isLoadingCalendar } = usePropertyAvailability(property.id);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  // Closes on an outside click *and* on Escape — both live in the hook.
  const calendarRef = useClickOutside(() => setIsCalendarOpen(false), isCalendarOpen);

  /**
   * The default range is nudged past any nights that are already booked, so a
   * busy listing does not open on an unbookable selection.
   */
  useEffect(() => {
    if (!calendar?.blockedDates?.size) return;

    setCheckIn((current) => {
      if (!current || !calendar.blockedDates.has(current)) return current;

      let day = current;
      for (let step = 0; step < 400 && calendar.blockedDates.has(day); step += 1) {
        day = addDays(day, 1);
      }
      setCheckOut(addDays(day, Math.max(1, property.minStay ?? 1)));
      return day;
    });
    // Only realign against a freshly loaded calendar, never against the guest's
    // own later edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendar]);

  const nights = nightsBetweenIso(checkIn, checkOut);

  const { data: availability, isFetching, isError, error } = useAvailability({
    propertyId: property.id,
    checkIn,
    checkOut,
    adults,
    children,
  });

  const currency = availability?.currency ?? property.currency;
  const canBook = availability?.isAvailable && nights > 0;

  const nightlyFrom = useMemo(
    () => (availability?.pricing && nights ? availability.pricing.nightlyTotal / nights : property.price),
    [availability, nights, property.price],
  );

  const handleBook = () => {
    if (!canBook) return;

    // Carry the quote into the wizard so the first step opens with exactly
    // what the guest just saw priced.
    startBooking(property.id);
    setStay({ checkIn, checkOut, adults, children, infants });

    if (!isAuthenticated) {
      toast.info('Sign in to continue', 'Your dates and party size have been saved.');
      // `LoginPage` reads `state.from` as a plain path string, the same shape
      // `ProtectedRoute` hands it.
      navigate(paths.login, { state: { from: paths.booking(property.id) } });
      return;
    }

    navigate(paths.booking(property.id));
  };

  return (
    <aside className="lg:sticky lg:top-24">
      <div className="rounded-card border border-line bg-surface p-5 shadow-card">
        <p className="font-display text-[26px] font-bold text-ink">
          {formatCurrency(nightlyFrom, currency)}
          <span className="ml-1 text-[12px] font-normal text-ink-muted">/night</span>
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {property.availableForRent && (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-600">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Available for Rent
            </span>
          )}
          {property.instantBook && (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-soft">
              <Zap className="size-3.5 text-brand-600" aria-hidden="true" />
              Instant book
            </span>
          )}
        </div>

        {/* Dates — the calendar is a popover so the widget stays compact */}
        <div ref={calendarRef} className="relative mt-4">
          <RangeSummary
            checkIn={checkIn}
            checkOut={checkOut}
            nights={nights}
            isOpen={isCalendarOpen}
            onOpen={() => setIsCalendarOpen(true)}
          />

          {isCalendarOpen && (
            <div className="animate-fade-up absolute inset-x-0 top-full z-30 mt-2">
              {isLoadingCalendar ? (
                <div className="flex h-64 items-center justify-center rounded-lg border border-line bg-white shadow-raised">
                  <Loader2 className="size-4 animate-spin text-ink-muted" aria-hidden="true" />
                </div>
              ) : (
                <DateRangeCalendar
                  blockedDates={calendar?.blockedDates}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onChange={({ checkIn: from, checkOut: to }) => {
                    setCheckIn(from);
                    setCheckOut(to);
                  }}
                  minStay={property.minStay ?? 1}
                  maxStay={property.maxStay}
                  monthsToShow={1}
                  onDone={() => setIsCalendarOpen(false)}
                  className="shadow-raised"
                />
              )}
            </div>
          )}
        </div>

        {/* Party size */}
        <div className="mt-3 divide-y divide-line rounded-lg border border-line px-3">
          <GuestRow
            label="Adults"
            hint="Age 13 or above"
            value={adults}
            onChange={setAdults}
            min={1}
            max={property.guests || 20}
          />
          <GuestRow
            label="Children"
            hint="Ages 2–12"
            value={children}
            onChange={setChildren}
            max={property.guests || 20}
          />
          <GuestRow label="Infants" hint="Under 2 — not counted towards the guest limit" value={infants} onChange={setInfants} max={5} />
        </div>

        {/* Availability verdict */}
        <div className="mt-3 min-h-6" aria-live="polite">
          {isFetching && (
            <p className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Checking availability…
            </p>
          )}

          {!isFetching && isError && (
            <p className="inline-flex items-start gap-1.5 text-[12px] text-danger">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {error?.message ?? 'Could not check availability. Try different dates.'}
            </p>
          )}

          {!isFetching && !isError && availability && (
            availability.isAvailable ? (
              <p className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-600">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Available for these dates
              </p>
            ) : (
              <ul className="space-y-1">
                {availability.conflicts.map((reason) => (
                  <li key={reason} className="flex items-start gap-1.5 text-[12px] text-danger">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    {reason}
                  </li>
                ))}
              </ul>
            )
          )}
        </div>

        {availability?.isAvailable && (
          <PriceSummary
            pricing={availability.pricing}
            nights={availability.nights}
            currency={currency}
            country={property.location}
            className="mt-3 border-t border-line pt-3"
          />
        )}

        <Button
          fullWidth
          size="lg"
          className={cn('mt-4', !canBook && 'pointer-events-none opacity-55')}
          disabled={!canBook || isFetching}
          onClick={handleBook}
          leftIcon={<CalendarCheck className="size-4" aria-hidden="true" />}
        >
          {isAuthenticated ? 'Book now' : 'Sign in to book'}
        </Button>

        <p className="mt-2 text-center text-[11px] text-ink-muted">
          You won&apos;t be charged until you complete payment.
        </p>
      </div>

      {/* A manager is only assigned in the mock data — the API has no
          equivalent field yet, so the contact affordances go with it. */}
      {property.manager && (
        <div className="mt-4 rounded-card border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-600 text-[13px] font-semibold text-white">
              {property.manager.initials}
            </span>
            <div>
              <p className="text-sm font-semibold">{property.manager.name}</p>
              <p className="text-[12px] text-ink-muted">{property.manager.role}</p>
            </div>
          </div>

          <Button
            variant="secondary"
            fullWidth
            className="mt-4"
            leftIcon={<MessageSquare className="size-4" aria-hidden="true" />}
            onClick={() => toast.info('Message sent', `${property.manager.name} usually replies within an hour.`)}
          >
            Message Property Manager
          </Button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-ink-soft">
            <Clock className="size-3.5 text-brand-600" aria-hidden="true" />
            Get response within 1 hour
          </p>
        </div>
      )}
    </aside>
  );
};
