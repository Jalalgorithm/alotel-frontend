import { useParams } from 'react-router-dom';
import { Clock, Maximize2, Users } from 'lucide-react';
import { SpaceImage } from './SpaceImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { SpacesEmpty } from './SpacesEmpty';
import { formatCurrency } from '@/utils/format';
import { DAY_NAMES, formatTime } from '@/lib/spaceSchema';
import { useSpace } from '../hooks/useSpaces';
import { SpaceBookingPanel } from './SpaceBookingPanel';

/**
 * One space, in full.
 *
 * The layouts table is the thing a booker actually shops on — the same room
 * seats 18 as a boardroom and 40 as theatre, and that difference decides
 * whether the space works at all. It gets a real table rather than a line of
 * prose.
 *
 * Add-ons are shown here as a browsable catalogue only. Selection happens in
 * the booking panel, where it can affect the running total.
 */

/** "Mon–Fri 8:00 am – 8:00 pm" from the per-day rows the API returns. */
const summariseHours = (hours) => {
  if (!hours.length) return [];

  const byWindow = hours.reduce((groups, row) => {
    const key = `${row.open}-${row.close}`;
    (groups[key] ??= []).push(row.dayOfWeek);
    return groups;
  }, {});

  return Object.entries(byWindow).map(([window, days]) => {
    const sorted = [...days].sort((a, b) => a - b);
    const isRun = sorted.every((day, index) => index === 0 || day === sorted[index - 1] + 1);
    const [open, close] = window.split('-');

    return {
      days:
        sorted.length > 1 && isRun
          ? `${DAY_NAMES[sorted[0]].slice(0, 3)}–${DAY_NAMES[sorted.at(-1)].slice(0, 3)}`
          : sorted.map((day) => DAY_NAMES[day].slice(0, 3)).join(', '),
      hours: `${formatTime(open)} – ${formatTime(close)}`,
    };
  });
};

export const SpaceDetailPage = () => {
  const { spaceId } = useParams();
  const { data: space, isLoading, isError } = useSpace(spaceId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-shell px-4 py-8 sm:px-6">
        <Skeleton className="aspect-16/9 w-full rounded-card" />
        <Skeleton className="mt-4 h-8 w-2/3" />
      </div>
    );
  }

  if (isError || !space) {
    return (
      <div className="mx-auto max-w-shell px-4 py-16 sm:px-6">
        <SpacesEmpty title="We could not find that space" description="It may have been unlisted by the host." />
      </div>
    );
  }

  const hours = summariseHours(space.operatingHours);
  const addonGroups = space.addons.reduce((groups, addon) => {
    (groups[addon.category] ??= []).push(addon);
    return groups;
  }, {});

  return (
    <div className="mx-auto max-w-shell px-4 py-6 sm:px-6">
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
        <SpaceImage space={space} wrapperClassName="aspect-16/9 w-full overflow-hidden rounded-card" />
        {space.images[1] && (
          <SpaceImage space={space} index={1} wrapperClassName="hidden aspect-16/9 w-full overflow-hidden rounded-card sm:block" />
        )}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-brand-700">
            {space.bookingMode === 'instant' ? 'Instant book' : 'Request to book'}
          </p>
          <h1 className="mt-1 font-display text-[24px] font-semibold text-ink sm:text-[28px]">{space.name}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-ink-soft">
            <span>{[space.city, space.country].filter(Boolean).join(', ')}</span>
            {space.sizeSqm && (
              <span className="inline-flex items-center gap-1.5">
                <Maximize2 className="size-3.5 text-ink-muted" aria-hidden="true" />
                {space.sizeSqm} m²
              </span>
            )}
          </div>

          <p className="mt-4 whitespace-pre-line text-[13.5px] leading-6 text-ink-soft">{space.description}</p>

          <section className="mt-7">
            <h2 className="inline-flex items-center gap-2 font-display text-[16px] font-semibold text-ink">
              <Users className="size-4 text-brand-600" aria-hidden="true" />
              Layouts and capacity
            </h2>
            <div className="mt-2.5 overflow-hidden rounded-card border border-line">
              <table className="w-full text-left">
                <thead className="bg-line-soft">
                  <tr>
                    <th className="px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                      Layout
                    </th>
                    <th className="px-3.5 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                      Maximum capacity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {space.layouts.map((layout) => (
                    <tr key={layout.id} className="border-t border-line">
                      <td className="px-3.5 py-2.5 text-[13px] text-ink">{layout.name}</td>
                      <td className="px-3.5 py-2.5 text-right text-[13px] font-semibold tabular-nums text-ink">
                        {layout.maxCapacity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {Object.keys(addonGroups).length > 0 && (
            <section className="mt-7">
              <h2 className="font-display text-[16px] font-semibold text-ink">What you can add</h2>
              <p className="mt-1 text-[12px] text-ink-muted">Choose these when you book — they change the total.</p>

              <div className="mt-3 space-y-4">
                {Object.entries(addonGroups).map(([category, addons]) => (
                  <div key={category}>
                    <p className="text-[12px] font-semibold text-ink-soft">{category}</p>
                    <ul className="mt-1.5 divide-y divide-line rounded-card border border-line">
                      {addons.map((addon) => (
                        <li key={addon.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                          <span className="min-w-0 text-[13px] text-ink">{addon.name}</span>
                          <span className="shrink-0 text-[12.5px] tabular-nums text-ink-soft">
                            {formatCurrency(addon.price, space.currency)}
                            {addon.unitType === 'per_person' && ' pp'}
                            {addon.unitType === 'per_hour' && ' / hr'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-7">
            <h2 className="inline-flex items-center gap-2 font-display text-[16px] font-semibold text-ink">
              <Clock className="size-4 text-brand-600" aria-hidden="true" />
              Opening hours
            </h2>
            <ul className="mt-2 space-y-1">
              {hours.map((row) => (
                <li key={row.days} className="flex justify-between text-[13px]">
                  <span className="text-ink-soft">{row.days}</span>
                  <span className="text-ink">{row.hours}</span>
                </li>
              ))}
            </ul>

            {/*
              One-off closures are not returned by the detail endpoint, only
              reflected in availability. Rather than imply the list below is
              complete, the calendar is named as the authority.
            */}
            <p className="mt-2.5 rounded-lg bg-line-soft p-2.5 text-[11.5px] text-ink-soft">
              Individual dates may be closed. Pick a date in the panel to see exactly what is free.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-5 lg:self-start">
          <SpaceBookingPanel space={space} />
        </aside>
      </div>
    </div>
  );
};
