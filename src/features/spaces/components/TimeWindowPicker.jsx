import { CalendarX, Clock } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { formatTime, isWindowFree, slotMinutes, toMinutes, toTimeString } from '@/lib/spaceSchema';

/**
 * Choosing a time window.
 *
 * The control follows how the host sells time rather than imposing one shape:
 * an hourly studio gets start/end selects stepped to the hour, a half-day
 * boardroom gets Morning/Afternoon/Full-day segments, a full-day hall gets a
 * single confirmation. Presenting a free-form time range for a space sold in
 * half-days invites a selection the host cannot honour.
 *
 * Unavailable windows are *blocked*, never merely rejected on submit — a guest
 * should not be able to build a booking that was never possible.
 */

/** Every slot boundary between open and close, as ["09:00", "10:00", …]. */
const boundaries = (open, close, step) => {
  const times = [];
  for (let minute = toMinutes(open); minute <= toMinutes(close); minute += step) {
    times.push(toTimeString(minute));
  }
  return times;
};

const Segment = ({ label, detail, isSelected, isDisabled, onSelect }) => (
  <button
    type="button"
    disabled={isDisabled}
    onClick={onSelect}
    aria-pressed={isSelected}
    className={cn(
      'flex-1 rounded-lg border px-3 py-2.5 text-left transition-colors',
      isSelected && 'border-brand-700 bg-brand-50',
      !isSelected && !isDisabled && 'border-line bg-surface hover:border-brand-300',
      isDisabled && 'cursor-not-allowed border-line bg-line-soft/60 opacity-60',
    )}
  >
    <span className={cn('block text-[12.5px] font-semibold', isSelected ? 'text-brand-700' : 'text-ink')}>
      {label}
    </span>
    <span className="mt-0.5 block text-[11px] text-ink-muted">{isDisabled ? 'Already booked' : detail}</span>
  </button>
);

export const TimeWindowPicker = ({ space, availability, value, onChange }) => {
  if (!availability) return null;

  if (availability.closedReason) {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-line p-3">
        <CalendarX className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
        <p className="text-[12.5px] text-ink-soft">{availability.closedReason}</p>
      </div>
    );
  }

  const { open, close } = availability.operatingHours;
  const step = slotMinutes(space) || 60;
  const windows = availability.openWindows;

  /* -------------------------------------------------- half-day / full-day */
  if (space.slotUnit === 'half_day' || space.slotUnit === 'full_day') {
    const openMin = toMinutes(open);
    const closeMin = toMinutes(close);
    const midpoint = toTimeString(openMin + Math.floor((closeMin - openMin) / 2 / 60) * 60);

    const options =
      space.slotUnit === 'half_day'
        ? [
            { label: 'Morning', start: open, end: midpoint },
            { label: 'Afternoon', start: midpoint, end: close },
            { label: 'Full day', start: open, end: close },
          ]
        : [{ label: 'Full day', start: open, end: close }];

    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Segment
            key={option.label}
            label={option.label}
            detail={`${formatTime(option.start)} – ${formatTime(option.end)}`}
            isSelected={value.startTime === option.start && value.endTime === option.end}
            isDisabled={!isWindowFree(option.start, option.end, windows)}
            onSelect={() => onChange({ startTime: option.start, endTime: option.end })}
          />
        ))}
      </div>
    );
  }

  /* ------------------------------------------------------ hourly / custom */
  const starts = boundaries(open, close, step).slice(0, -1);
  const minDuration = step * (space.minSlots || 1);
  const maxDuration = space.maxSlots ? step * space.maxSlots : Infinity;

  const ends = value.startTime
    ? boundaries(open, close, step).filter((time) => {
        const length = toMinutes(time) - toMinutes(value.startTime);
        return length >= minDuration && length <= maxDuration && isWindowFree(value.startTime, time, windows);
      })
    : [];

  return (
    <div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
            Starts
          </span>
          <select
            value={value.startTime ?? ''}
            onChange={(event) => onChange({ startTime: event.target.value, endTime: '' })}
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-[13px] text-ink focus:border-brand-600 focus:outline-none"
          >
            <option value="">Choose a start</option>
            {starts.map((time) => {
              /* A start with no legal end after it is offered but marked, so
                 the guest can see the room is busy rather than wondering why
                 the option vanished. */
              const isFree = windows.some(
                (window) => toMinutes(window.start) <= toMinutes(time) && toMinutes(window.end) > toMinutes(time),
              );
              return (
                <option key={time} value={time} disabled={!isFree}>
                  {formatTime(time)}
                  {!isFree ? ' — booked' : ''}
                </option>
              );
            })}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">Ends</span>
          <select
            value={value.endTime ?? ''}
            disabled={!value.startTime}
            onChange={(event) => onChange({ startTime: value.startTime, endTime: event.target.value })}
            className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-[13px] text-ink disabled:bg-line-soft/60 focus:border-brand-600 focus:outline-none"
          >
            <option value="">{value.startTime ? 'Choose an end' : 'Pick a start first'}</option>
            {ends.map((time) => (
              <option key={time} value={time}>
                {formatTime(time)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
        <Clock className="size-3" aria-hidden="true" />
        Minimum {space.minSlots} {space.minSlots === 1 ? 'slot' : 'slots'}
        {space.maxSlots ? `, maximum ${space.maxSlots}` : ''} · open {formatTime(open)}–{formatTime(close)}
      </p>

      {value.startTime && !ends.length && (
        <p className="mt-2 rounded-md bg-gold/10 p-2 text-[11.5px] text-ink-soft">
          Nothing long enough is free from {formatTime(value.startTime)}. Try an earlier start or another date.
        </p>
      )}
    </div>
  );
};
