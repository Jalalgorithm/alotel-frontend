import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/classNames';
import { queryKeys } from '@/lib/queryKeys';
import { spaceService } from '../services/spaceService';

/**
 * A month of availability for one space.
 *
 * Replaces a bare `<input type="date">`, which told a guest nothing until they
 * had already picked a day and been refused. The whole month arrives in a
 * single range request, so every day can say up front whether it is free,
 * partly taken, or shut.
 *
 * Four states, deliberately distinguished rather than collapsed into
 * "unavailable" — they lead to different decisions. A partly-booked day is
 * still worth clicking; a closed weekday means never try this day of the week;
 * a blackout is a one-off the host declared and next week may be fine.
 */

/** Monday-first, matching how the API indexes weekdays. */
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const iso = (date) => {
  /* Local date parts, not toISOString — that converts to UTC and can roll the
     date backwards for anyone west of Greenwich. */
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

/** JS `getDay()` is Sunday-first; the grid is Monday-first. */
const mondayIndex = (date) => (date.getDay() + 6) % 7;

const STATE_STYLES = {
  free: 'text-ink hover:border-brand-400 hover:bg-brand-50',
  partial: 'text-ink hover:border-brand-400 hover:bg-brand-50',
  full: 'cursor-not-allowed text-ink-muted line-through',
  closed: 'cursor-not-allowed text-ink-muted',
  past: 'cursor-not-allowed text-ink-muted/50',
};

export const SpaceMonthCalendar = ({ spaceId, value, onSelect, className }) => {
  const [cursor, setCursor] = useState(() => (value ? new Date(`${value}T00:00:00`) : new Date()));

  const from = iso(startOfMonth(cursor));
  const to = iso(endOfMonth(cursor));

  const { data: days = [], isLoading } = useQuery({
    queryKey: queryKeys.spaces.availabilityRange(spaceId, from, to),
    queryFn: () => spaceService.getSpaceAvailabilityRange(spaceId, from, to),
    enabled: Boolean(spaceId),
  });

  const byDate = useMemo(() => Object.fromEntries(days.map((day) => [day.date, day])), [days]);

  const todayIso = iso(new Date());

  /* Leading blanks so the 1st lands under its real weekday. */
  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    const out = Array.from({ length: mondayIndex(first) }, () => null);

    for (let day = 1; day <= last.getDate(); day += 1) {
      out.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    }
    return out;
  }, [cursor]);

  const stateFor = (date) => {
    const key = iso(date);
    if (key < todayIso) return 'past';

    const day = byDate[key];
    if (!day) return 'closed';
    if (day.isBlackedOut || day.isClosed) return 'closed';
    if (!day.hasSpace) return 'full';
    return day.bookedWindows.length > 0 ? 'partial' : 'free';
  };

  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const shiftMonth = (delta) =>
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  /* Never let the guest page back before the current month. */
  const isAtStart = cursor.getFullYear() === new Date().getFullYear() && cursor.getMonth() === new Date().getMonth();

  return (
    <div className={cn('rounded-lg border border-line bg-surface p-3', className)}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={isAtStart}
          aria-label="Previous month"
          className="rounded-md p-1.5 text-ink-soft transition-colors hover:bg-line-soft disabled:opacity-30"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <p className="text-[13px] font-semibold text-ink">{monthLabel}</p>

        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
          className="rounded-md p-1.5 text-ink-soft transition-colors hover:bg-line-soft"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-2.5 grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="pb-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
            {label}
          </span>
        ))}

        {isLoading
          ? Array.from({ length: 35 }).map((_, index) => <Skeleton key={index} className="aspect-square rounded-md" />)
          : cells.map((date, index) => {
              if (!date) return <span key={`blank-${index}`} aria-hidden="true" />;

              const key = iso(date);
              const state = stateFor(date);
              const isSelected = key === value;
              const isDisabled = ['full', 'closed', 'past'].includes(state);
              const day = byDate[key];

              const title = {
                free: 'Free all day',
                partial: `${day?.bookedWindows.length ?? 0} booking${day?.bookedWindows.length === 1 ? '' : 's'} — some hours still free`,
                full: 'Fully booked',
                closed: day?.isBlackedOut ? 'Closed on this date' : 'Closed on this day of the week',
                past: 'In the past',
              }[state];

              return (
                <button
                  key={key}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onSelect(key)}
                  aria-label={`${date.getDate()} — ${title}`}
                  aria-pressed={isSelected}
                  title={title}
                  className={cn(
                    'relative aspect-square rounded-md border border-transparent text-[12.5px] transition-colors',
                    STATE_STYLES[state],
                    isSelected && 'border-brand-700 bg-brand-700 font-semibold text-white hover:bg-brand-700',
                  )}
                >
                  {date.getDate()}

                  {/* A dot rather than a colour swap: the day number must stay
                      readable, and colour alone would not survive a colourblind
                      reader or a greyscale print. */}
                  {state === 'partial' && !isSelected && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-gold"
                    />
                  )}
                  {state === 'free' && !isSelected && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand-600"
                    />
                  )}
                </button>
              );
            })}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-2.5 text-[10.5px] text-ink-muted">
        <li className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-brand-600" aria-hidden="true" />
          Free
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
          Partly booked
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="text-ink-muted line-through" aria-hidden="true">
            00
          </span>
          Fully booked
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="text-ink-muted" aria-hidden="true">
            00
          </span>
          Closed
        </li>
      </ul>
    </div>
  );
};
