import { Link } from 'react-router-dom';
import { Bath, BedDouble, MapPin, Ruler, Users } from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { FavoriteButton } from './FavoriteButton';
import { cn } from '@/utils/classNames';
import { formatCurrency } from '@/utils/format';
import { paths } from '@/routes/paths';

/** The bed / bath / area strip repeated on every card. */
const SpecStrip = ({ property, tone = 'light' }) => (
  <div
    className={cn(
      'flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]',
      tone === 'dark' ? 'text-white' : 'text-ink-soft',
    )}
  >
    <span className="inline-flex items-center gap-1">
      <BedDouble className="size-3.5" aria-hidden="true" />
      {property.beds} {tone === 'dark' ? '' : 'Beds'}
    </span>
    <span className="inline-flex items-center gap-1">
      <Bath className="size-3.5" aria-hidden="true" />
      {property.baths} {tone === 'dark' ? '' : 'Baths'}
    </span>
    <span className="inline-flex items-center gap-1">
      {tone === 'dark' ? (
        <>
          <Ruler className="size-3.5" aria-hidden="true" />
          {property.areaSqm} m2
        </>
      ) : (
        <>
          <Users className="size-3.5" aria-hidden="true" />
          {property.guests} Guest
        </>
      )}
    </span>
  </div>
);

/**
 * Property card.
 *
 * @param {{ property: object, variant?: 'listing' | 'discover' }} props
 *  - `listing`  — the "Our Properties" grid (stars, price, View Details).
 *  - `discover` — the landing-page grid (specs overlaid on the photo, Book Now).
 */
export const PropertyCard = ({ property, variant = 'listing', className }) => {
  const detailUrl = paths.propertyDetail(property.id);
  const priceLabel = formatCurrency(property.price, property.currency);

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-shadow hover:shadow-raised',
        className,
      )}
    >
      <Link to={detailUrl} className="relative block" aria-label={`View ${property.name}`}>
        <Image
          src={property.images?.[0]}
          alt={property.name}
          wrapperClassName="aspect-4/3 w-full"
          className="transition-transform duration-500 group-hover:scale-105"
        />

        {property.verified && variant === 'listing' && (
          <Badge variant="gold" className="absolute left-3 top-3 shadow-sm">
            Verified Property
          </Badge>
        )}

        {variant === 'discover' && (
          <div className="absolute inset-x-0 bottom-0 card-scrim px-3 pb-2.5 pt-8">
            <SpecStrip property={property} tone="dark" />
          </div>
        )}
      </Link>

      <FavoriteButton propertyId={property.id} className="absolute right-3 top-3" />

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-[15px] font-semibold leading-snug text-ink">
          <Link to={detailUrl} className="transition-colors hover:text-brand-700">
            {property.shortName ?? property.name}
          </Link>
        </h3>

        <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-ink-soft">
          <MapPin className="size-3 shrink-0 text-brand-600" aria-hidden="true" />
          {property.city}, {property.country}
        </p>

        {variant === 'listing' && (
          <>
            <div className="mt-2.5">
              <SpecStrip property={property} />
            </div>

            {/* A listing has no rating until it has been reviewed — say so
                rather than rendering an empty five-star row. */}
            <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-muted">
              {property.rating ? (
                <>
                  <StarRating value={property.rating} />
                  <span className="font-medium text-ink">{property.rating.toFixed(1)}</span>
                  <span>({property.reviewCount} reviews)</span>
                </>
              ) : (
                <span className="font-medium text-brand-600">New listing</span>
              )}
            </div>
          </>
        )}

        <div
          className={cn(
            'mt-auto flex items-center justify-between gap-3 pt-3',
            variant === 'discover' && 'border-t border-line',
          )}
        >
          <p className="font-display text-[17px] font-bold text-brand-700">
            {priceLabel}
            <span className="ml-1 text-[11px] font-normal text-ink-muted">/night</span>
          </p>

          {variant === 'discover' && (
            <Button to={paths.booking(property.id)} size="sm">
              Book Now
            </Button>
          )}
        </div>

        {variant === 'listing' && (
          <Button to={detailUrl} size="sm" fullWidth className="mt-3">
            View Details
          </Button>
        )}
      </div>
    </article>
  );
};
