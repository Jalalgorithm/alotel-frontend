import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BadgeCheck, Bath, BedDouble, Expand, SlidersHorizontal, Users } from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { SearchBar } from '@/components/shared/SearchBar';
import { FavoriteButton } from './FavoriteButton';
import { useProperties } from '../hooks/useProperties';
import { searchFilters } from '@/lib/mock/data';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/classNames';
import { paths } from '@/routes/paths';

/** Wide result row: photo on the left, details on the right. */
const SearchResultCard = ({ property }) => (
  <article className="relative flex gap-3 border-b border-line py-5 last:border-b-0 sm:gap-4">
    <Link to={paths.propertyDetail(property.id)} className="shrink-0">
      <Image
        src={property.images?.[0]}
        alt={property.name}
        wrapperClassName="h-24 w-28 rounded-lg xs:w-32 sm:h-32 sm:w-48"
      />
    </Link>

    <div className="min-w-0 flex-1">
      {property.verified && (
        <Badge variant="verified" icon={<BadgeCheck className="size-3" aria-hidden="true" />}>
          Verified Property
        </Badge>
      )}

      <h3 className="mt-1.5 truncate pr-8 font-display text-[15px] font-semibold">
        <Link to={paths.propertyDetail(property.id)} className="transition-colors hover:text-brand-700">
          {property.name}
        </Link>
      </h3>

      <p className="mt-0.5 truncate text-[12px] text-ink-soft">
        {property.city}, {property.country}
      </p>

      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
        <span className="inline-flex items-center gap-1">
          <Users className="size-3" aria-hidden="true" />
          {property.guests} guests
        </span>
        <span className="inline-flex items-center gap-1">
          <BedDouble className="size-3" aria-hidden="true" />
          {property.beds} beds
        </span>
        <span className="inline-flex items-center gap-1">
          <Bath className="size-3" aria-hidden="true" />
          {property.baths} bath
        </span>
        <span className="inline-flex items-center gap-1">
          <Expand className="size-3" aria-hidden="true" />
          {property.areaSqm} m2
        </span>
      </p>

      {/* Wraps on narrow columns — without it the rating + price row sets a
          min-content width that pushes the whole page into horizontal scroll. */}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-1.5">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] text-ink-muted">
          {property.rating ? (
            <>
              <StarRating value={property.rating} size="size-3" />
              <span className="font-medium text-ink">{property.rating.toFixed(1)}</span>
              <span className="truncate">({property.reviewCount} reviews)</span>
            </>
          ) : (
            <span className="font-medium text-brand-600">New listing</span>
          )}
        </span>

        <p className="font-display text-[16px] font-bold text-ink">
          {formatCurrency(property.price, property.currency)}
          <span className="ml-1 text-[11px] font-normal text-ink-muted">/night</span>
        </p>
      </div>
    </div>

    <FavoriteButton propertyId={property.id} className="absolute right-0 top-5 bg-transparent shadow-none" />
  </article>
);

/**
 * Decorative results map with price pins.
 * A real tile provider drops in here; the pin layout stays the same.
 */
const ResultsMap = ({ properties }) => {
  // Deterministic scatter so pins do not jump between renders.
  const pins = useMemo(
    () =>
      properties.slice(0, 12).map((property, index) => ({
        id: property.id,
        label: formatCurrency(property.price, property.currency),
        top: `${12 + ((index * 37) % 74)}%`,
        left: `${10 + ((index * 53) % 76)}%`,
      })),
    [properties],
  );

  return (
    <div className="relative size-full overflow-hidden rounded-card bg-[#c9dfea]">
      <svg viewBox="0 0 400 600" className="size-full" aria-hidden="true" preserveAspectRatio="none">
        <rect width="400" height="600" fill="#cfe3ec" />
        <path d="M180 0 Q120 120 170 240 T140 460 Q160 540 120 600 L400 600 L400 0 Z" fill="#e9ece4" />
        <path d="M180 0 Q120 120 170 240 T140 460 Q160 540 120 600" fill="none" stroke="#b9cfd9" strokeWidth="3" />
        {[90, 210, 330, 450].map((y) => (
          <line key={y} x1="200" y1={y} x2="400" y2={y - 40} stroke="#dcd9cd" strokeWidth="2" />
        ))}
      </svg>

      {pins.map((pin) => (
        <span
          key={pin.id}
          style={{ top: pin.top, left: pin.left }}
          className="absolute -translate-x-1/2 rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-semibold text-ink shadow-sm"
        >
          {pin.label}
        </span>
      ))}
    </div>
  );
};

/** Search results route: filter chips, result list, and a live map panel. */
export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchOnMapMove, setSearchOnMapMove] = useState(true);

  const where = searchParams.get('where') ?? '';
  const guests = searchParams.get('guests') ?? '';

  const { data, isLoading } = useProperties({
    query: where || undefined,
    guests: guests || undefined,
    pageSize: 24,
  });

  const results = data?.items ?? [];

  const toggleFilter = (filter) =>
    setActiveFilters((current) =>
      current.includes(filter) ? current.filter((entry) => entry !== filter) : [...current, filter],
    );

  return (
    <div className="shell py-6">
      <SearchBar className="max-w-5xl" defaultValues={{ where, guests: guests || '2' }} />

      {/* Filter chips — the rail scrolls edge to edge on touch; the Filters
          button sits outside it so it stays reachable without scrolling. */}
      <div className="mt-5 flex items-center gap-3">
        <div className="scrollbar-none -mx-4 flex min-w-0 flex-1 gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {searchFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => toggleFilter(filter)}
              aria-pressed={activeFilters.includes(filter)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-2 text-[12px] transition-colors sm:py-1.5',
                activeFilters.includes(filter)
                  ? 'border-brand-700 bg-brand-50 text-brand-700'
                  : 'border-line bg-white text-ink-soft hover:border-brand-300',
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[12px] text-ink-soft transition-colors hover:border-brand-300 sm:py-1.5"
        >
          <SlidersHorizontal className="size-3" aria-hidden="true" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* `grid-cols-1` (= minmax(0,1fr)) is load-bearing: without an explicit
          template the implicit column is auto-sized, and the truncating result
          titles then force the whole page into horizontal scroll on phones. */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* Results */}
        <div>
          <h1 className="text-[15px] font-semibold">
            {isLoading ? 'Searching…' : `${data?.total ?? 0}+ stays${where ? ` in ${where}` : ''}`}
          </h1>

          {isLoading ? (
            <div className="mt-4 space-y-5">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex gap-4">
                  <Skeleton className="h-28 w-40 shrink-0" />
                  <div className="flex-1 space-y-2.5 py-1">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length ? (
            <div className="mt-2">
              {results.map((property) => (
                <SearchResultCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No stays match this search"
              description="Try a different destination or clear a filter to see more residences."
            />
          )}
        </div>

        {/* Map */}
        <div className="relative hidden lg:block">
          <div className="sticky top-24 h-[calc(100vh-8rem)]">
            <ResultsMap properties={results} />

            <label className="absolute left-4 top-4 flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-[12px] shadow-card">
              <input
                type="checkbox"
                checked={searchOnMapMove}
                onChange={(event) => setSearchOnMapMove(event.target.checked)}
                className="size-3.5 accent-brand-700"
              />
              Search as I move the map
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
