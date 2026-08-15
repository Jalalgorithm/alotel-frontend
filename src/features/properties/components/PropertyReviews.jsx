import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/classNames';
import { formatDate } from '@/utils/format';
import { queryKeys } from '@/lib/queryKeys';
import { bookingService } from '@/features/booking/services/bookingService';

/**
 * What previous guests said.
 *
 * `GET /reviews/{listing_id}/` is public and has been all along; the property
 * page simply never called it, so every listing looked as though nobody had
 * ever stayed.
 *
 * The five sub-scores are averaged into category bars rather than shown per
 * review — across a set of reviews the useful signal is "location scores well,
 * value less so", which a per-review breakdown buries.
 */

const CATEGORIES = [
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'location', label: 'Location' },
  { key: 'value', label: 'Value' },
  { key: 'communication', label: 'Communication' },
];

const average = (values) => {
  const scores = values.filter((value) => Number.isFinite(value) && value > 0);
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
};

/** Anonymised: "jane@example.com" becomes "Jane W." style initials only. */
const displayName = (email = '') => {
  const handle = email.split('@')[0] ?? '';
  if (!handle) return 'A guest';
  return `${handle.charAt(0).toUpperCase()}${handle.slice(1, 4).replace(/[._-]/g, '')}.`;
};

export const PropertyReviews = ({ property }) => {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: queryKeys.bookings.reviews(property?.id),
    queryFn: () => bookingService.getReviews(property.id).catch(() => []),
    enabled: Boolean(property?.id),
    retry: false,
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-card" />;

  /* A listing with no reviews yet says so plainly rather than showing an
     invented rating — a fake 4.9 is worse than an honest blank. */
  if (!reviews.length) {
    return (
      <section>
        <h2 className="font-display text-[18px] font-semibold text-ink">Reviews</h2>
        <p className="mt-2 rounded-card border border-dashed border-line p-5 text-[13px] text-ink-soft">
          No reviews yet. This residence is either new to us or between stays — the first review will appear here.
        </p>
      </section>
    );
  }

  const overall = average(reviews.map((review) => review.overall));

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-[18px] font-semibold text-ink">Reviews</h2>
        <p className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft">
          <Star className="size-4 fill-gold text-gold" aria-hidden="true" />
          <span className="font-semibold text-ink">{overall?.toFixed(1) ?? '—'}</span>
          from {reviews.length} stay{reviews.length === 1 ? '' : 's'}
        </p>
      </div>

      <dl className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {CATEGORIES.map((category) => {
          const score = average(reviews.map((review) => review.ratings[category.key]));
          if (score == null) return null;

          return (
            <div key={category.key} className="flex items-center gap-3">
              <dt className="w-32 shrink-0 text-[12.5px] text-ink-soft">{category.label}</dt>
              <dd className="flex flex-1 items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                  <span
                    className="block h-full rounded-full bg-brand-600"
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </span>
                <span className="w-7 shrink-0 text-right text-[12px] tabular-nums text-ink">{score.toFixed(1)}</span>
              </dd>
            </div>
          );
        })}
      </dl>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {reviews.slice(0, 6).map((review) => (
          <li key={review.id} className="rounded-card border border-line bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12.5px] font-semibold text-ink">{displayName(review.guestEmail)}</p>
              <span className="inline-flex items-center gap-1 text-[12px] text-ink-soft">
                <Star className="size-3 fill-gold text-gold" aria-hidden="true" />
                {review.overall}
              </span>
            </div>

            <p className={cn('mt-2 text-[12.5px] leading-5 text-ink-soft')}>{review.body}</p>

            {review.createdAt && (
              <p className="mt-2 text-[10.5px] text-ink-muted">{formatDate(review.createdAt)}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};
