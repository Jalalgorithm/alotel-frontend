import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { addDays, nextBlockedNight, todayIso } from '@/lib/bookingSchema';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const MONTH_LABEL = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
const FULL_DATE = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const toIso = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

/**
 * Days for one month grid, padded so the 1st lands on the right weekday.
 * Monday-first, matching the rest of the site's European framing.
 */
const buildMonth = (year, month) => {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7;

  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => toIso(year, month, index + 1)),
  ];
};

/* -------------------------------------------------------------------------- */
/* Month                                                                       */
/* -------------------------------------------------------------------------- */

const Month = ({ year, month, state }) => {
  const days = useMemo(() => buildMonth(year, month), [year, month]);
  const label = MONTH_LABEL.format(new Date(year, month, 1));

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-2 text-center text-[12.5px] font-semibold text-ink">{label}</p>

      <div className="grid grid-cols-7 gap-y-0.5" role="grid" aria-label={label}>
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="pb-1 text-center text-[10px] font-bold uppercase tracking-[0.04em] text-ink-muted"
          >
            {day}
          </span>
        ))}

        {days.map((iso, index) => {
          if (!iso) return <span key={`pad-${index}`} aria-hidden="true" />;

          const day = state.describe(iso);

          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              disabled={day.isDisabled}
              aria-label={`${FULL_DATE.format(new Date(`${iso}T00:00:00`))}${day.hint ? ` — ${day.hint}` : ''}`}
              aria-pressed={day.isCheckIn || day.isCheckOut}
              title={day.hint}
              onClick={() => state.onSelect(iso)}
              onMouseEnter={() => state.onHover(iso)}
              className={cn(
                'relative flex h-9 items-center justify-center text-[12.5px] transition-colors',
                // The in-range band is drawn on the cell itself so consecutive
                // days join up with no gaps.
                day.isInRange && !day.isCheckIn && !day.isCheckOut && 'bg-brand-50 text-brand-700',
                day.isCheckIn && 'rounded-l-full bg-brand-700 font-semibold text-white',
                day.isCheckOut && 'rounded-r-full bg-brand-700 font-semibold text-white',
                day.isCheckIn && day.isCheckOut && 'rounded-full',
                !day.isDisabled && !day.isInRange && !day.isCheckIn && !day.isCheckOut &&
                  'rounded-full text-ink hover:bg-brand-50 hover:text-brand-700',
                // Guard on the endpoints: a selected cell keeps its white text
                // even when it is no longer clickable, otherwise the label goes
                // grey-on-dark-green and stops being readable.
                day.isDisabled && !day.isCheckIn && !day.isCheckOut && 'cursor-not-allowed text-ink-muted/60',
                day.isBooked && !day.isCheckIn && !day.isCheckOut && 'rounded-full bg-danger/[0.06] text-danger/70',
                day.isDisabled && (day.isCheckIn || day.isCheckOut) && 'cursor-default',
                day.isToday && !day.isCheckIn && !day.isCheckOut && 'font-semibold',
              )}
            >
              {day.date}

              {/* Booked nights are struck through — the clearest signal that a
                  date exists but cannot be chosen. Not on the endpoints of the
                  chosen range though: checking out on the morning a booked
                  night begins is legitimate, and striking a cell the guest has
                  just successfully selected reads as a contradiction. */}
              {day.isBooked && !day.isCheckIn && !day.isCheckOut && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-[20%] top-1/2 h-[1.5px] -translate-y-1/2 -rotate-12 rounded-full bg-danger"
                />
              )}

              {day.isToday && !day.isCheckIn && !day.isCheckOut && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 size-1 rounded-full bg-brand-600"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Calendar                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Two-month range picker with booked nights struck out.
 *
 * Selection follows the usual hotel model: the first click sets check-in, the
 * second sets check-out, and clicking again starts over. A range may not span a
 * booked night, so once check-in is chosen every date past the next booked
 * night is disabled — that makes an impossible range unpickable rather than
 * letting the guest select one and then be told no.
 *
 * @param {{ blockedDates: Set<string>, checkIn: string, checkOut: string,
 *           onChange: ({ checkIn, checkOut }) => void, minStay?: number, maxStay?: number|null }} props
 */
export const DateRangeCalendar = ({
  blockedDates = new Set(),
  checkIn,
  checkOut,
  onChange,
  minStay = 1,
  maxStay = null,
  monthsToShow = 2,
  onDone,
  className,
}) => {
  const today = todayIso();

  const [cursor, setCursor] = useState(() => {
    const anchor = new Date(`${checkIn || today}T00:00:00`);
    return { year: anchor.getFullYear(), month: anchor.getMonth() };
  });

  /** Set when the guest has picked check-in and is choosing check-out. */
  const [pendingStart, setPendingStart] = useState(null);
  const [hovered, setHovered] = useState(null);

  const start = pendingStart ?? checkIn;
  const end = pendingStart ? null : checkOut;

  /**
   * While choosing a check-out, the stay cannot jump over a booked night, so
   * the first one after check-in becomes a hard ceiling.
   */
  const ceiling = useMemo(() => {
    if (!pendingStart) return null;
    const blocked = nextBlockedNight(blockedDates, pendingStart);
    const byMaxStay = maxStay ? addDays(pendingStart, maxStay) : null;

    if (blocked && byMaxStay) return blocked < byMaxStay ? blocked : byMaxStay;
    return blocked ?? byMaxStay;
  }, [pendingStart, blockedDates, maxStay]);

  const previewEnd = pendingStart && hovered && hovered > pendingStart ? hovered : null;

  const describe = (iso) => {
    const date = Number(iso.slice(8, 10));
    const isBooked = blockedDates.has(iso);
    const isPast = iso < today;

    let isDisabled = isPast || isBooked;
    let hint = isBooked ? 'Already booked' : isPast ? 'In the past' : '';

    if (pendingStart) {
      // Check-out must come after check-in, respect the minimum stay, and stop
      // at the first booked night.
      if (iso <= pendingStart) {
        isDisabled = true;
      } else if (iso < addDays(pendingStart, minStay)) {
        isDisabled = true;
        hint = `Minimum stay is ${minStay} night${minStay === 1 ? '' : 's'}`;
      } else if (ceiling && iso > ceiling) {
        isDisabled = true;
        hint = blockedDates.has(ceiling) ? 'The nights before this are booked' : 'Longer than the maximum stay';
      } else {
        // A check-out lands on a booked night's morning, which is allowed —
        // the guest leaves as the next one arrives.
        isDisabled = isPast;
      }
    }

    const rangeEnd = end ?? previewEnd;

    return {
      date,
      isBooked,
      isDisabled,
      hint,
      isToday: iso === today,
      isCheckIn: Boolean(start) && iso === start,
      isCheckOut: Boolean(rangeEnd) && iso === rangeEnd,
      isInRange: Boolean(start && rangeEnd) && iso > start && iso < rangeEnd,
    };
  };

  const onSelect = (iso) => {
    if (!pendingStart) {
      setPendingStart(iso);
      setHovered(null);
      // Clear the old range immediately so the widget never quotes a price for
      // a stay the guest has already moved on from.
      onChange({ checkIn: iso, checkOut: '' });
      return;
    }

    setPendingStart(null);
    setHovered(null);
    onChange({ checkIn: pendingStart, checkOut: iso });
  };

  /** Both ends chosen and no pick in flight. */
  const isComplete = Boolean(checkIn && checkOut && !pendingStart);

  const clear = () => {
    setPendingStart(null);
    setHovered(null);
    onChange({ checkIn: '', checkOut: '' });
  };

  const shiftMonth = (delta) =>
    setCursor(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  const atStart =
    cursor.year < new Date().getFullYear() ||
    (cursor.year === new Date().getFullYear() && cursor.month <= new Date().getMonth());

  return (
    <div className={cn('rounded-lg border border-line bg-white p-3', className)}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={atStart}
          aria-label="Previous month"
          className="flex size-7 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <p className="text-[11px] text-ink-muted" aria-live="polite">
          {pendingStart ? 'Now pick your check-out date' : 'Select your dates'}
        </p>

        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="flex size-7 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex gap-5" onMouseLeave={() => setHovered(null)}>
        {Array.from({ length: monthsToShow }, (_, offset) => {
          const date = new Date(cursor.year, cursor.month + offset, 1);
          return (
            <Month
              key={`${date.getFullYear()}-${date.getMonth()}`}
              year={date.getFullYear()}
              month={date.getMonth()}
              state={{ describe, onSelect, onHover: setHovered }}
            />
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-2.5">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] text-ink-muted">
          <span className="size-2.5 rounded-full bg-brand-700" aria-hidden="true" />
          Your stay
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10.5px] text-ink-muted">
          <span className="relative inline-block w-3 text-center text-danger/70" aria-hidden="true">
            9
            <span className="absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 -rotate-12 rounded-full bg-danger" />
          </span>
          Already booked
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <button
          type="button"
          onClick={clear}
          className="rounded-lg px-3 py-2 text-[12px] font-medium text-ink-soft transition-colors hover:bg-black/5 hover:text-ink"
        >
          Clear
        </button>

        {/*
          Enabled only once both ends are chosen. A half-picked range has no
          price and no meaning, so letting "Done" dismiss the calendar there
          would just hide an unfinished job.
        */}
        <button
          type="button"
          onClick={onDone}
          disabled={!isComplete}
          className={cn(
            'rounded-lg px-4 py-2 text-[12px] font-semibold transition-colors',
            isComplete
              ? 'bg-brand-700 text-white hover:bg-brand-800'
              : 'cursor-not-allowed bg-black/5 text-ink-muted',
          )}
        >
          Done
        </button>
      </div>
    </div>
  );
};
