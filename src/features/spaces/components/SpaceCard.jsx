import { Link } from 'react-router-dom';
import { MapPin, Users, Zap } from 'lucide-react';
import { SpaceImage } from './SpaceImage';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/format';
import { rateSuffix } from '@/lib/spaceSchema';

/**
 * One space in the results grid.
 *
 * The price carries the host's own unit — "from £65 / hour", "from €2,400 /
 * day" — never a nightly rate. Capacity is the headline number a space is
 * actually shopped on, so it sits beside the price rather than in a detail
 * list nobody scans.
 */
export const SpaceCard = ({ space }) => {
  /* The API computes this across every layout, so it is not derived here. */
  const capacity = space.maxCapacity ?? Math.max(0, ...space.layouts.map((layout) => layout.maxCapacity));

  return (
    <Link
      to={`/spaces/${space.id}`}
      className="group block overflow-hidden rounded-card border border-line bg-surface shadow-card transition-shadow hover:shadow-raised"
    >
      <div className="relative">
        <SpaceImage space={space} wrapperClassName="aspect-4/3 w-full" />

        {space.bookingMode === 'instant' && (
          <Badge variant="brand" className="absolute left-3 top-3 shadow-sm">
            <Zap className="mr-1 size-2.5" aria-hidden="true" />
            Instant book
          </Badge>
        )}
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate font-display text-[14px] font-semibold text-ink group-hover:text-brand-700">
            {space.name}
          </h3>
        </div>

        <p className="mt-0.5 inline-flex items-center gap-1 truncate text-[11.5px] text-ink-muted">
          <MapPin className="size-3 shrink-0 text-brand-600" aria-hidden="true" />
          {[space.city, space.country].filter(Boolean).join(', ')}
        </p>

        <div className="mt-3 flex items-end justify-between gap-2 border-t border-line pt-2.5">
          <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-soft">
            <Users className="size-3 text-ink-muted" aria-hidden="true" />
            Up to {capacity}
          </span>

          <span className="text-right">
            <span className="block text-[10px] uppercase tracking-[0.06em] text-ink-muted">from</span>
            <span className="font-display text-[14px] font-semibold text-ink">
              {formatCurrency(space.baseRate, space.currency, { decimals: 0 })}
              <span className="text-[11px] font-normal text-ink-muted"> / {rateSuffix(space)}</span>
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
};
