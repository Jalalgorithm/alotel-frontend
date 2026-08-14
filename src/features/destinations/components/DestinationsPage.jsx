import { Link } from 'react-router-dom';
import { ArrowRight, Building2, MapPin, Presentation } from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/format';
import { useDestinationList } from '../hooks/useDestinations';

/**
 * Where you can go — the destinations index.
 *
 * Grouped by market rather than laid out as one flat grid of photo tiles. A
 * flat grid answers "which of these pictures do I like"; grouping answers
 * "where does Alotel actually operate", which is the question someone browsing
 * destinations is really asking.
 *
 * Every number on this page is live. A city with no listings says so rather
 * than showing a tempting photograph that leads to an empty search.
 */

const MARKET_ORDER = ['UK', 'Spain', 'US', 'UAE Dubai', 'Nigeria'];

const MARKET_LABELS = {
  UK: 'United Kingdom',
  Spain: 'Spain',
  US: 'United States',
  'UAE Dubai': 'United Arab Emirates',
  Nigeria: 'Nigeria',
};

const DestinationCard = ({ destination }) => {
  const hasStays = destination.stayCount > 0;

  return (
    <Link
      to={`/destinations/${destination.slug}`}
      className="group grid gap-4 rounded-card border border-line bg-surface p-3 shadow-card transition-shadow hover:shadow-raised sm:grid-cols-[180px_1fr] sm:p-4"
    >
      <Image
        src={destination.image}
        alt={destination.city}
        wrapperClassName="aspect-4/3 w-full overflow-hidden rounded-lg sm:aspect-square"
      />

      <div className="min-w-0">
        <h3 className="font-display text-[17px] font-semibold text-ink group-hover:text-brand-700">
          {destination.city}
        </h3>
        <p className="mt-0.5 text-[12px] italic text-ink-muted">{destination.tagline}</p>

        <p className="mt-2 line-clamp-2 text-[12.5px] leading-5 text-ink-soft">{destination.intro}</p>

        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-2.5">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.07em] text-ink-muted">Residences</dt>
            <dd className="mt-0.5 inline-flex items-center gap-1.5 font-display text-[14px] font-semibold text-ink">
              <Building2 className="size-3.5 text-brand-600" aria-hidden="true" />
              {hasStays ? destination.stayCount : '—'}
            </dd>
          </div>

          {destination.spaceCount > 0 && (
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.07em] text-ink-muted">Spaces</dt>
              <dd className="mt-0.5 inline-flex items-center gap-1.5 font-display text-[14px] font-semibold text-ink">
                <Presentation className="size-3.5 text-brand-600" aria-hidden="true" />
                {destination.spaceCount}
              </dd>
            </div>
          )}

          {destination.priceFrom != null && (
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.07em] text-ink-muted">From</dt>
              <dd className="mt-0.5 font-display text-[14px] font-semibold text-ink">
                {formatCurrency(destination.priceFrom, destination.currency, { decimals: 0 })}
                <span className="text-[11px] font-normal text-ink-muted"> / night</span>
              </dd>
            </div>
          )}
        </dl>

        {/* Said plainly rather than hidden — an empty city is a fact, not a bug. */}
        {!hasStays && !destination.spaceCount && (
          <p className="mt-2 text-[11.5px] text-ink-muted">No residences listed here yet — the guide is still worth a read.</p>
        )}
      </div>
    </Link>
  );
};

export const DestinationsPage = () => {
  const { data: destinations = [], isLoading } = useDestinationList();

  const byMarket = MARKET_ORDER.map((market) => ({
    market,
    label: MARKET_LABELS[market] ?? market,
    entries: destinations.filter((destination) => destination.market === market),
  })).filter((group) => group.entries.length);

  return (
    <div className="mx-auto max-w-shell px-4 py-8 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand-700">Destinations</p>
        <h1 className="mt-1.5 font-display text-[28px] font-semibold text-ink sm:text-[34px]">
          Five markets, chosen deliberately
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-ink-soft">
          We would rather know a handful of cities properly than list everywhere badly. Each guide below is written by
          people who have stayed there, with the neighbourhoods, the practicalities and the honest trade-offs.
        </p>
      </header>

      {isLoading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-card" />
          ))}
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {byMarket.map((group) => (
            <section key={group.market}>
              <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                <h2 className="inline-flex items-center gap-2 font-display text-[18px] font-semibold text-ink">
                  <MapPin className="size-4 text-brand-600" aria-hidden="true" />
                  {group.label}
                </h2>
                <span className="text-[11.5px] text-ink-muted">
                  {group.entries.reduce((sum, entry) => sum + entry.stayCount, 0)} residences
                </span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {group.entries.map((destination) => (
                  <DestinationCard key={destination.slug} destination={destination} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Link
          to="/properties"
          className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-[13px] font-medium text-ink transition-colors hover:border-brand-400 hover:text-brand-700"
        >
          Browse every residence
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};
