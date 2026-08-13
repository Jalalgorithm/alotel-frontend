import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BadgeCheck, Bath, BedDouble, Expand, Loader2, LocateFixed, SlidersHorizontal, Users } from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { SearchBar } from '@/components/shared/SearchBar';
import { FavoriteButton } from './FavoriteButton';
import { useProperties } from '../hooks/useProperties';
import { PropertyMap, MapUnavailable } from './PropertyMap';
import { env } from '@/lib/env';
import { useGeolocation } from '@/hooks/useGeolocation';
import { searchFilters } from '@/lib/mock/data';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/classNames';
import { paths } from '@/routes/paths';

/** Wide result row: photo on the left, details on the right. */
const SearchResultCard = ({ property, isActive, onHover }) => (
  <article
    id={`result-${property.id}`}
    onMouseEnter={() => onHover?.(property.id)}
    onMouseLeave={() => onHover?.(null)}
    className={cn(
      'relative flex gap-3 border-b border-line py-5 last:border-b-0 sm:gap-4',
      // Only a tint: moving the card would make the list jump under the cursor.
      isActive && '-mx-3 rounded-lg bg-brand-50/60 px-3',
    )}
  >
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

/** Search results route: filter chips, result list, and a live map panel. */
export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchOnMapMove, setSearchOnMapMove] = useState(false);
  /** Shared between the list and the map so hovering either highlights both. */
  const [activeId, setActiveId] = useState(null);
  const { locate, isLocating, status: locationStatus, error: locationError, placeName } = useGeolocation();

  const where = searchParams.get('where') ?? '';
  const guests = searchParams.get('guests') ?? '';

  const { data, isLoading } = useProperties({
    query: where || undefined,
    guests: guests || undefined,
    pageSize: 24,
  });

  const results = data?.items ?? [];

  /**
   * Search near the guest.
   *
   * The place name drives the query because the list endpoint matches text,
   * not coordinates — there is no radius filter yet. When Mapbox cannot name
   * the spot we say so rather than searching for nothing.
   */
  const useMyLocation = async () => {
    const result = await locate();
    if (!result) return;

    if (result.placeName) {
      setSearchParams((params) => {
        params.set('where', result.placeName);
        return params;
      });
    }
  };

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

        {/*
          Location is requested on press, never on load — an unprompted
          permission dialog is the quickest route to a permanent denial.
        */}
        <button
          type="button"
          onClick={useMyLocation}
          disabled={isLocating}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[12px] text-ink-soft transition-colors hover:border-brand-300 disabled:opacity-60 sm:py-1.5"
        >
          {isLocating ? (
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="size-3" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">{isLocating ? 'Locating…' : 'Near me'}</span>
        </button>

        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[12px] text-ink-soft transition-colors hover:border-brand-300 sm:py-1.5"
        >
          <SlidersHorizontal className="size-3" aria-hidden="true" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {(locationError || (locationStatus === 'ready' && !placeName)) && (
        <p className="mt-2 text-[12px] text-ink-muted">
          {locationError || 'We found you, but could not name the area. Try typing a place instead.'}
        </p>
      )}

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
                <SearchResultCard
                  key={property.id}
                  property={property}
                  isActive={property.id === activeId}
                  onHover={setActiveId}
                />
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
            {env.mapboxToken ? (
              <PropertyMap
                properties={results}
                activeId={activeId}
                onHover={setActiveId}
                onSelect={(id) => {
                  setActiveId(id);
                  document.getElementById(`result-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="size-full"
              />
            ) : (
              <MapUnavailable className="size-full" />
            )}

            {/*
              Deliberately off and disabled: the list endpoint has no bounding-box
              filter, so re-querying on map movement could only narrow the page
              already fetched — panning to a new area would show nothing even
              where properties exist. Enable this the moment `?bbox=` lands.
            */}
            {env.mapboxToken && (
              <label
                className="absolute left-4 top-4 flex cursor-not-allowed items-center gap-2 rounded-lg bg-white px-3 py-2 text-[12px] text-ink-muted shadow-card"
                title="Available once the API supports searching by map area"
              >
                <input
                  type="checkbox"
                  checked={searchOnMapMove}
                  disabled
                  onChange={(event) => setSearchOnMapMove(event.target.checked)}
                  className="size-3.5 accent-brand-700"
                />
                Search as I move the map
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
