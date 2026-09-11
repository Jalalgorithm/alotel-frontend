import { BadgeCheck, ExternalLink, Navigation } from 'lucide-react';
import { LocationMap } from '@/components/map/LocationMap';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/classNames';

/**
 * Where the property is.
 *
 * Two deliberate decisions here:
 *
 * 1. **No landmarks list.** The API models nothing of the sort — the old list
 *    came from mock fixtures and rendered as an empty `<ul>` against real data.
 *    An empty section is worse than no section.
 *
 * 2. **A real map.** This used to draw a stylised locator, because no Mapbox
 *    token was configured at the time. One is now, so it renders tiles — and
 *    `LocationMap` falls back to an address-only card if the token goes away
 *    or the API has no coordinates for a listing.
 */

export const LocationLandmarks = ({ property, className }) => {
  const { coordinates } = property;

  /** Real coordinates when we have them; otherwise the best address we can build. */
  const mapQuery = coordinates
    ? `${coordinates.lat},${coordinates.lng}`
    : [property.address, property.city, property.state, property.country].filter(Boolean).join(', ');

  const addressLine = [property.address, property.city, property.state].filter(Boolean).join(', ');

  return (
    <section className={cn('rounded-card border border-line bg-surface p-5 shadow-card', className)}>
      <h2 className="text-[15px] font-semibold text-brand-700">Location</h2>

      {/*
        A real map, not the stylised panel this used to draw.

        That panel placed its pin from the *fractional parts* of the
        coordinates — deliberately not a projection of anywhere — because when
        it was written no Mapbox token was configured. One is configured now,
        so the honest thing is tiles. `LocationMap` still degrades to an
        address-only card if the token is ever removed, or if the API has no
        coordinates for a listing (two of ten currently do not).

        `approximate` keeps the existing promise: a residence shows its area
        until the booking is confirmed, at which point the exact address is
        sent. Zoom is pulled back a step for the same reason.
      */}
      <div className="mt-4">
        <LocationMap
          coordinates={property.coordinates}
          address={addressLine || [property.city, property.country].filter(Boolean).join(', ')}
          approximate
          zoom={12.5}
          height="h-56"
        />
      </div>

      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.07em] text-ink-muted">Address</dt>
          <dd className="mt-1 text-[13px] text-ink">
            {addressLine || `${property.city}, ${property.country}`}
            {property.postalCode && (
              <span className="ml-1.5 inline-flex items-center gap-1 font-medium">
                {property.postalCode}
                {property.isPostalCodeVerified && (
                  <BadgeCheck
                    className="size-3.5 text-brand-600"
                    aria-label="Postcode verified"
                  />
                )}
              </span>
            )}
          </dd>
        </div>

        {coordinates && (
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.07em] text-ink-muted">Coordinates</dt>
            <dd className="mt-1 font-mono text-[12px] text-ink-soft">
              {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
          target="_blank"
          rel="noreferrer noopener"
          leftIcon={<ExternalLink className="size-3.5" aria-hidden="true" />}
        >
          View on map
        </Button>

        {coordinates && (
          <Button
            variant="secondary"
            size="sm"
            href={`https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`}
            target="_blank"
            rel="noreferrer noopener"
            leftIcon={<Navigation className="size-3.5" aria-hidden="true" />}
          >
            Directions
          </Button>
        )}
      </div>
    </section>
  );
};
