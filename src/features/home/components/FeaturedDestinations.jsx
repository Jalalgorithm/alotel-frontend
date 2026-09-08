import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { Skeleton } from '@/components/ui/Skeleton';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { useDestinations } from '../hooks/useHomeContent';
import { paths } from '@/routes/paths';

/**
 * "Featured Destinations" — the eight cities in scope.
 *
 * Each tile carries the client's own Tile Copy line rather than a listing
 * count. The count that used to sit here was a fixture number invented per
 * city — "60 Properties", "100 Properties" — which was both untrue and the
 * least interesting thing the tile could say. The copy is the same string the
 * city guide opens with, so the two can never disagree.
 */
export const FeaturedDestinations = () => {
  const { data: destinations = [], isLoading } = useDestinations(8);

  return (
    <section className="shell py-14 sm:py-16">
      <SectionHeading title="Featured Destinations" subtitle="Eight cities, each known properly" />

      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="aspect-4/5 rounded-card" />)
          : destinations.map((destination) => (
              <Link
                key={destination.id}
                /* Sends people to the city guide rather than a bare search —
                   the guide is what makes choosing a destination easier. */
                to={paths.destinationDetail(destination.id)}
                className="group relative overflow-hidden rounded-card"
              >
                {/*
                  Decorative: the city and country are written across the tile
                  immediately below. Naming the image as well made a screen
                  reader — and the gradient fallback, which prints its alt text
                  as visually-hidden copy — announce "Malaga, Spain" twice.
                */}
                <Image
                  src={destination.image}
                  alt=""
                  wrapperClassName="aspect-4/5 w-full"
                  className="transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-x-0 bottom-0 card-scrim px-4 pb-4 pt-12">
                  <p className="flex items-center gap-2 font-display text-[15px] font-semibold text-white">
                    {destination.city}, {destination.country}
                    {/* ISO country code rather than a flag emoji — Windows has no
                        flag glyphs and would render the raw letters instead. */}
                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium tracking-wide">
                      {destination.code}
                    </span>
                  </p>
                  <p className="mt-1 text-[11.5px] italic leading-4 text-white/80">{destination.tagline}</p>
                </div>
              </Link>
            ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Link
          to={paths.destinations}
          className="inline-flex items-center gap-2 py-2 font-display text-[13px] font-semibold italic text-brand-700 hover:underline"
        >
          View all destinations
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
};
