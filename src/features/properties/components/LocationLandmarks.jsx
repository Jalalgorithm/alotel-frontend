import { BadgeCheck, ExternalLink, Info, MapPin, Navigation } from 'lucide-react';
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
 * 2. **No embedded map.** Rendering real tiles needs a Mapbox public token,
 *    and none is configured. Rather than ship a broken map or a fake one
 *    pretending to be real, this shows a stylised locator that is honest about
 *    being approximate, and hands off to a real map provider with the actual
 *    coordinates the API holds.
 */

/** Where the pin sits within the panel, derived from real coordinates. */
const pinPosition = (coordinates) => {
  if (!coordinates) return { left: '50%', top: '50%' };

  // Fractional parts only — enough to vary the placement per property without
  // implying the panel is a real projection of anywhere.
  const fraction = (value) => Math.abs(value % 1);
  return {
    left: `${28 + fraction(coordinates.lng) * 44}%`,
    top: `${30 + fraction(coordinates.lat) * 40}%`,
  };
};

const LocatorPanel = ({ property }) => {
  const position = pinPosition(property.coordinates);
  const label = [property.city, property.country].filter(Boolean).join(', ');

  return (
    <div
      className="relative h-56 overflow-hidden rounded-lg bg-[#dfe8e2]"
      role="img"
      aria-label={`Approximate location of this residence in ${label}`}
    >
      <svg viewBox="0 0 400 200" className="size-full" aria-hidden="true">
        <rect width="400" height="200" fill="#dbe7e0" />
        <path d="M0 140 Q80 110 160 145 T400 120 L400 200 L0 200 Z" fill="#bcd6e8" />
        <path d="M0 60 Q120 90 240 55 T400 70" fill="none" stroke="#c6dcd0" strokeWidth="10" />
        {[40, 90, 150].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#ffffff" strokeWidth="2" opacity="0.7" />
        ))}
        {[70, 150, 230, 310].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="200" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
        ))}
        {[
          [20, 20],
          [180, 25],
          [260, 95],
          [90, 105],
        ].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="42" height="26" rx="4" fill="#cddcd3" />
        ))}
      </svg>

      {/* Approximate-area ring rather than a precise pin — the exact address is
          shared on booking, and a hard pin would overstate what this shows. */}
      <span
        className="pointer-events-none absolute size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-600/30 bg-brand-600/10"
        style={position}
        aria-hidden="true"
      />
      <span
        className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-brand-700 px-3 py-1.5 text-[11px] font-medium text-white shadow-raised"
        style={position}
      >
        <MapPin className="size-3" aria-hidden="true" />
        {label}
      </span>
    </div>
  );
};

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

      <div className="mt-4">
        <LocatorPanel property={property} />
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

      <p className="mt-3 inline-flex items-start gap-1.5 text-[11.5px] text-ink-muted">
        <Info className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
        The map shows the approximate area. The exact address and access details are shared once your booking is
        confirmed.
      </p>

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
