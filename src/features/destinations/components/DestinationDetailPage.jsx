import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarRange,
  Clock3,
  Info,
  Languages,
  MapPin,
  Presentation,
  Train,
} from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { Skeleton } from '@/components/ui/Skeleton';
import { PropertyGrid } from '@/features/properties';
import { SpaceCard } from '@/features/spaces/components/SpaceCard';
import { cn } from '@/utils/classNames';
import { formatCurrency } from '@/utils/format';
import { useDestination } from '../hooks/useDestinations';

/**
 * One destination, in full.
 *
 * The bet here is that most destination pages are a photograph and a search
 * box, and that a traveller deciding between two cities is not short of
 * photographs. What they lack is someone telling them which part of the city to
 * sleep in and what will surprise them when they arrive — so neighbourhoods and
 * the practical notes are given real space rather than being a footer.
 *
 * Editorial content is authored (see `destinationContent`); every number,
 * listing and space on this page is live.
 */

/**
 * Cap a rail's width to the number of cards it actually has.
 *
 * These grids are sized for a full catalogue, but a city with two residences
 * left two cards adrift in four columns of empty page — which reads as a
 * loading failure rather than a small city. Constraining the container keeps a
 * short rail looking deliberate.
 */
const railWidth = (count) => {
  if (count <= 1) return 'max-w-sm';
  if (count === 2) return 'max-w-3xl';
  return '';
};

const Fact = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2.5">
    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
      <Icon className="size-3.5" aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-ink-muted">{label}</p>
      <p className="mt-0.5 text-[12.5px] leading-5 text-ink">{value}</p>
    </div>
  </div>
);

export const DestinationDetailPage = () => {
  const { slug } = useParams();
  const { data: destination, isLoading } = useDestination(slug);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-shell px-4 py-8 sm:px-6">
        <Skeleton className="aspect-21/9 w-full rounded-card" />
        <Skeleton className="mt-4 h-10 w-1/2" />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="mx-auto max-w-shell px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-[22px] font-semibold text-ink">We do not have a guide for that city</h1>
        <Link to="/destinations" className="mt-3 inline-block text-[13px] font-medium text-brand-700 hover:underline">
          See every destination
        </Link>
      </div>
    );
  }

  const searchHref = `/search?where=${encodeURIComponent(destination.city)}`;

  return (
    <div>
      {/* ------------------------------------------------------------ hero */}
      <header className="relative">
        <Image
          src={destination.image}
          alt={destination.city}
          wrapperClassName="aspect-16/9 w-full sm:aspect-21/9"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-transparent" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-shell px-4 pb-7 sm:px-6 sm:pb-9">
            <Link
              to="/destinations"
              className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-white/80 hover:text-white"
            >
              <MapPin className="size-3" aria-hidden="true" />
              Destinations
            </Link>

            <h1 className="mt-1.5 font-display text-[30px] font-semibold text-white sm:text-[42px]">
              {destination.city}
            </h1>
            <p className="mt-1 max-w-xl font-serif text-[15px] italic text-white/85 sm:text-[17px]">
              {destination.tagline}
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] text-white/85">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-3.5" aria-hidden="true" />
                {destination.stayCount} residence{destination.stayCount === 1 ? '' : 's'}
              </span>
              {destination.spaceCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Presentation className="size-3.5" aria-hidden="true" />
                  {destination.spaceCount} space{destination.spaceCount === 1 ? '' : 's'}
                </span>
              )}
              {destination.priceFrom != null && (
                <span>
                  From {formatCurrency(destination.priceFrom, destination.currency, { decimals: 0 })} a night
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-shell px-4 py-9 sm:px-6">
        {/*
          Intro and neighbourhoods share the left column so the "at a glance"
          card has something to sit beside. Kept apart, the short intro set a
          short row while the tall card set a tall one, leaving a band of dead
          space the width of the page.
        */}
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <p className="max-w-2xl font-serif text-[16px] leading-7 text-ink-soft">{destination.intro}</p>

            <section className="mt-8">
              <h2 className="font-display text-[21px] font-semibold text-ink">Where to stay</h2>
              <p className="mt-1 max-w-2xl text-[13px] text-ink-soft">
                In a city this size the neighbourhood matters more than the building. Here is how the main ones differ.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {destination.neighbourhoods.map((area) => (
                  <article key={area.name} className="rounded-card border border-line bg-surface p-4 shadow-card">
                    <h3 className="font-display text-[15px] font-semibold text-ink">{area.name}</h3>
                    <p className="mt-1.5 text-[12.5px] leading-5 text-ink-soft">{area.note}</p>
                    <p className="mt-3 border-t border-line pt-2 text-[11px] text-ink-muted">
                      <span className="font-semibold uppercase tracking-[0.06em]">Suits</span> · {area.suits}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-3.5 self-start rounded-card border border-line bg-surface p-4 shadow-card lg:sticky lg:top-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-muted">At a glance</p>
            <Fact icon={CalendarRange} label="Best months" value={destination.bestMonths} />
            <Fact icon={Languages} label="Language" value={destination.language} />
            <Fact icon={Clock3} label="Time zone" value={destination.timezone} />
            <Fact icon={Train} label="Getting around" value={destination.gettingAround} />

            {destination.priceFrom != null && (
              <div className="border-t border-line pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-ink-muted">Residences from</p>
                <p className="mt-0.5 font-display text-[19px] font-semibold text-ink">
                  {formatCurrency(destination.priceFrom, destination.currency, { decimals: 0 })}
                  <span className="text-[12px] font-normal text-ink-muted"> / night</span>
                </p>
              </div>
            )}

            <Link
              to={searchHref}
              className="mt-1 flex items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-brand-800"
            >
              Check dates
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </aside>
        </div>

        {/* ---------------------------------------------------- residences */}
        {destination.properties.length > 0 && (
          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-[21px] font-semibold text-ink">
                  Residences in {destination.city}
                </h2>
                <p className="mt-1 text-[13px] text-ink-soft">Everything we currently list here.</p>
              </div>
              <Link
                to={searchHref}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 hover:underline"
              >
                Search with dates
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className={cn('mt-5', railWidth(Math.min(destination.properties.length, 6)))}>
              <PropertyGrid properties={destination.properties.slice(0, 6)} variant="discover" />
            </div>
          </section>
        )}

        {/* --------------------------------------------------------- spaces */}
        {destination.spaces.length > 0 && (
          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-[21px] font-semibold text-ink">Spaces to hire</h2>
                <p className="mt-1 text-[13px] text-ink-soft">
                  Meeting rooms and venues in {destination.city}, booked by the hour or the day.
                </p>
              </div>
              <Link
                to="/spaces"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-700 hover:underline"
              >
                All spaces
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div
              className={cn(
                'mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
                railWidth(Math.min(destination.spaces.length, 3)),
              )}
            >
              {destination.spaces.slice(0, 3).map((space) => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          </section>
        )}

        {/* -------------------------------------------------- know before */}
        <section className="mt-12">
          <h2 className="font-display text-[21px] font-semibold text-ink">Know before you go</h2>
          <p className="mt-1 max-w-2xl text-[13px] text-ink-soft">
            The things that differ market to market, and that people find out too late.
          </p>

          <ul className="mt-4 grid gap-2.5 md:grid-cols-3">
            {destination.knowBefore.map((note) => (
              <li key={note} className="flex items-start gap-2.5 rounded-card border border-line bg-surface p-3.5">
                <Info className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
                <span className="text-[12.5px] leading-5 text-ink-soft">{note}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ----------------------------------------------------------- cta */}
        <div className="mt-12 rounded-card border border-line bg-brand-50/60 p-6 text-center">
          <h2 className="font-display text-[19px] font-semibold text-ink">Ready to look at dates?</h2>
          <p className="mx-auto mt-1 max-w-md text-[13px] text-ink-soft">
            Search {destination.city} with your check-in and check-out to see what is actually available.
          </p>
          <Link
            to={searchHref}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-700 px-6 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-800"
          >
            Search {destination.city}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
};
