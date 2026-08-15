import { useState } from 'react';
import { Search, SlidersHorizontal, Users } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/classNames';
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

  const spaces = data?.items ?? [];

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
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
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
