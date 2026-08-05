import { useState } from 'react';
import { useNavigate, createSearchParams } from 'react-router-dom';
import { CalendarDays, MapPin, Search, Users } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { paths } from '@/routes/paths';

const FIELD_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted';
/** Taller on touch so the input itself — not just its cell — is a easy target. */
const FIELD_INPUT =
  'h-8 w-full bg-transparent text-[13px] text-ink placeholder:text-ink-muted focus:outline-none lg:h-6';
/** Roomy on touch, compact once the four fields sit side by side. */
const FIELD_CELL = 'bg-surface px-4 py-3 lg:py-2.5';

/**
 * The four-part booking search used on both hero sections.
 *
 * Layout: one field per row on phones, 2×2 on small tablets, and a single
 * horizontal bar from `lg` up — matching the design's desktop treatment.
 *
 * Submitting pushes the criteria into the URL, which `SearchPage` reads back —
 * so searches are shareable and survive a refresh.
 */
export const SearchBar = ({ defaultValues = {}, className }) => {
  const navigate = useNavigate();
  const [criteria, setCriteria] = useState({
    where: defaultValues.where ?? '',
    checkIn: defaultValues.checkIn ?? '',
    checkOut: defaultValues.checkOut ?? '',
    guests: defaultValues.guests ?? '2',
  });

  const update = (field) => (event) => setCriteria((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = Object.fromEntries(Object.entries(criteria).filter(([, value]) => value));
    navigate({ pathname: paths.search, search: `?${createSearchParams(params)}` });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'grid w-full gap-px overflow-hidden rounded-xl bg-line p-px shadow-raised',
        'sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]',
        className,
      )}
      role="search"
      aria-label="Search available stays"
    >
      <div className={FIELD_CELL}>
        <label htmlFor="search-where" className={FIELD_LABEL}>
          Where
        </label>
        <div className="mt-1 flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <input
            id="search-where"
            value={criteria.where}
            onChange={update('where')}
            placeholder="Search Destinations"
            className={FIELD_INPUT}
          />
        </div>
      </div>

      <div className={FIELD_CELL}>
        <label htmlFor="search-checkin" className={FIELD_LABEL}>
          Check-in
        </label>
        <div className="mt-1 flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <input
            id="search-checkin"
            type="date"
            value={criteria.checkIn}
            onChange={update('checkIn')}
            className={cn(FIELD_INPUT, 'min-w-0')}
          />
        </div>
      </div>

      <div className={FIELD_CELL}>
        <label htmlFor="search-checkout" className={FIELD_LABEL}>
          Check-out
        </label>
        <div className="mt-1 flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <input
            id="search-checkout"
            type="date"
            min={criteria.checkIn || undefined}
            value={criteria.checkOut}
            onChange={update('checkOut')}
            className={cn(FIELD_INPUT, 'min-w-0')}
          />
        </div>
      </div>

      <div className={FIELD_CELL}>
        <label htmlFor="search-guests" className={FIELD_LABEL}>
          Guests
        </label>
        <div className="mt-1 flex items-center gap-2">
          <Users className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <select
            id="search-guests"
            value={criteria.guests}
            onChange={update('guests')}
            className={cn(FIELD_INPUT, 'min-w-0 appearance-none')}
          >
            {[1, 2, 3, 4, 5, 6, 8, 10].map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? 'Guest' : 'Guests'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Spans the full width while the fields are stacked or in a 2×2 grid. */}
      <div className="flex items-center bg-surface p-2 sm:col-span-2 lg:col-span-1">
        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-800 lg:h-10 lg:text-[13px]"
        >
          <Search className="size-4 lg:size-3.5" aria-hidden="true" />
          Search
        </button>
      </div>
    </form>
  );
};
