import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Users } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/classNames';
import { MapUnavailable, ResultsMap } from '@/components/map/ResultsMap';
import { env } from '@/lib/env';
import { formatCurrency } from '@/utils/format';
import { rateSuffix } from '@/lib/spaceSchema';
import { SpacesEmpty } from './SpacesEmpty';
import { useSpaces } from '../hooks/useSpaces';
import { SpaceCard } from './SpaceCard';

/**
 * Spaces discovery — its own surface, deliberately not merged into stays search.
 *
 * "2-bedroom flat this weekend" and "boardroom for 40, Thursday 2–5pm" are not
 * the same search: different filters, different result cards, different
 * urgency. Merging them would mean a filter panel that is wrong for both.
 *
 * Categories are built from what hosts have actually listed rather than a fixed
 * enum, so a new kind of space appears here the day someone lists one.
 */
export const SpacesPage = () => {
  const [draft, setDraft] = useState({ query: '', minCapacity: '' });
  const [filters, setFilters] = useState({});
  const [category, setCategory] = useState('All');

  const { data, isLoading } = useSpaces({ ...filters, category });

  /* Memoised because `?? []` allocates a fresh array on every render, which
     would defeat the `points` memo underneath it. */
  const spaces = useMemo(() => data?.items ?? [], [data]);

  /* Which card the map is pointing at, and vice versa. */
  const [activeId, setActiveId] = useState(null);

  /*
   * The pill says the rate and its unit — "£120 / hour" — because that is the
   * number someone compares when they are choosing between two rooms in the
   * same part of town. A residence pill says a nightly price for the same
   * reason; the map component itself is indifferent.
   */
  const points = useMemo(
    () =>
      spaces.map((space) => ({
        id: space.id,
        lat: space.coordinates?.lat,
        lng: space.coordinates?.lng,
        label: `${formatCurrency(space.baseRate, space.currency, { decimals: 0 })} / ${rateSuffix(space)}`,
        description: `${space.name} — ${formatCurrency(space.baseRate, space.currency)} per ${rateSuffix(space)}`,
      })),
    [spaces],
  );

  /*
   * Built from what hosts have actually typed into `space_type` rather than a
   * fixed enum, so a new kind of space appears the day someone lists one.
   * Blank types are skipped — an unnamed chip filters to nothing useful.
   */
  const categories = ['All', ...new Set(spaces.map((space) => space.category).filter(Boolean))];

  const submit = (event) => {
    event.preventDefault();
    setFilters({
      query: draft.query.trim() || undefined,
      minCapacity: draft.minCapacity || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-shell px-4 py-8 sm:px-6">
      <header>
        <h1 className="font-display text-[26px] font-semibold text-ink sm:text-[30px]">Spaces</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] text-ink-soft">
          Meeting rooms, studios and event halls, booked by the hour or the day. Tell us how many people you need to
          seat and when.
        </p>
      </header>

      <form onSubmit={submit} className="mt-5 flex flex-wrap items-end gap-2.5">
        <Input
          containerClassName="min-w-[220px] flex-1"
          label="Where or what"
          leftIcon={<Search className="size-4" aria-hidden="true" />}
          placeholder="Lagos, boardroom, studio…"
          value={draft.query}
          onChange={(event) => setDraft((current) => ({ ...current, query: event.target.value }))}
        />
        <Input
          containerClassName="w-40"
          label="Minimum capacity"
          type="number"
          min="1"
          leftIcon={<Users className="size-4" aria-hidden="true" />}
          placeholder="e.g. 40"
          value={draft.minCapacity}
          onChange={(event) => setDraft((current) => ({ ...current, minCapacity: event.target.value }))}
        />
        <Button type="submit" size="lg" leftIcon={<SlidersHorizontal className="size-4" aria-hidden="true" />}>
          Search
        </Button>
      </form>

      {categories.length > 1 && (
        <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setCategory(entry)}
              aria-pressed={entry === category}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors',
                entry === category
                  ? 'border-brand-700 bg-brand-700 font-medium text-white'
                  : 'border-line bg-surface text-ink-soft hover:border-brand-300',
              )}
            >
              {entry}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-72 w-full rounded-card" />
          ))}
        </div>
      ) : spaces.length ? (
        <>
          <p className="mt-5 text-[12.5px] text-ink-muted">
            {spaces.length} space{spaces.length === 1 ? '' : 's'} available
          </p>

          {/*
            List and map, the same split the residence search uses. Where a
            space is matters more than where a residence is — it is booked in
            hours, usually around something else already fixed in the day — so
            the map is not an afterthought here.

            The map column is hidden below `lg`: a sticky half-screen map on a
            phone costs more room than it gives back.
          */}
          <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
            <div className="grid gap-4 sm:grid-cols-2">
              {spaces.map((space) => (
                <div
                  key={space.id}
                  id={`space-${space.id}`}
                  onMouseEnter={() => setActiveId(space.id)}
                  onMouseLeave={() => setActiveId(null)}
                  className={cn(
                    'rounded-card transition-shadow',
                    activeId === space.id && 'ring-2 ring-brand-500',
                  )}
                >
                  <SpaceCard space={space} />
                </div>
              ))}
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-24 h-[calc(100vh-8rem)]">
                {env.mapboxToken ? (
                  <ResultsMap
                    points={points}
                    total={spaces.length}
                    activeId={activeId}
                    onHover={setActiveId}
                    onSelect={(id) => {
                      setActiveId(id);
                      document
                        .getElementById(`space-${id}`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="size-full"
                  />
                ) : (
                  <MapUnavailable className="size-full" />
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <SpacesEmpty
          className="mt-8"
          title="No spaces match that search"
          description="Try a wider area, or lower the minimum capacity."
          action={
            <Button
              onClick={() => {
                setDraft({ query: '', minCapacity: '' });
                setFilters({});
                setCategory('All');
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}
    </div>
  );
};
