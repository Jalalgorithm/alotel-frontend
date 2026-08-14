import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Skeleton } from '@/components/ui/Skeleton';
import { SpaceCard } from '@/features/spaces/components/SpaceCard';
import { useSpaces } from '@/features/spaces/hooks/useSpaces';
import { paths } from '@/routes/paths';

/**
 * "Need a room for the afternoon?" — the spaces rail.
 *
 * Placed after the residences because stays are the primary product, and named
 * around the *unit of time* rather than the product name: someone scrolling a
 * homepage does not yet know that "Spaces" means an hourly boardroom, and the
 * whole point of this rail is to teach them that in one line.
 *
 * Renders nothing at all when there are no published spaces. An empty rail with
 * a heading is worse than no rail — it advertises a gap.
 */
export const FeaturedSpaces = () => {
  const { data, isLoading } = useSpaces({});
  const spaces = (data?.items ?? []).slice(0, 3);

  if (!isLoading && !spaces.length) return null;

  return (
    <section className="shell py-14 sm:py-16">
      <SectionHeading
        title="Need a room for the afternoon?"
        subtitle="Meeting rooms, studios and event halls, booked by the hour or the day — not the night."
      />

      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-72 rounded-card" />)
          : spaces.map((space) => <SpaceCard key={space.id} space={space} />)}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-[12.5px] text-ink-muted">
          <Clock className="size-3.5 text-brand-600" aria-hidden="true" />
          Instant booking on many spaces — the rest confirm within a day.
        </p>

        <Link
          to={paths.spaces}
          className="inline-flex items-center gap-2 py-2 font-display text-[13px] font-semibold italic text-brand-700 hover:underline"
        >
          Browse all spaces
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
};
