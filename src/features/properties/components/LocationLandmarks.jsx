import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Location panel.
 *
 * The map is a lightweight decorative rendering rather than an embedded tile
 * provider — no API key, no third-party script, and it never fails to load.
 * Swap `<MapCanvas>` for Mapbox/Google when a key is available.
 */
const MapCanvas = ({ label }) => (
  <div className="relative h-56 overflow-hidden rounded-lg bg-[#dfe8e2]" role="img" aria-label={`Map of ${label}`}>
    <svg viewBox="0 0 400 200" className="size-full" aria-hidden="true">
      <rect width="400" height="200" fill="#dbe7e0" />
      {/* Waterways */}
      <path d="M0 140 Q80 110 160 145 T400 120 L400 200 L0 200 Z" fill="#bcd6e8" />
      <path d="M0 60 Q120 90 240 55 T400 70" fill="none" stroke="#c6dcd0" strokeWidth="10" />
      {/* Streets */}
      {[40, 90, 150].map((y) => (
        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#ffffff" strokeWidth="2" opacity="0.7" />
      ))}
      {[70, 150, 230, 310].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="200" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
      ))}
      {/* Blocks */}
      {[
        [20, 20],
        [180, 25],
        [260, 95],
        [90, 105],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="42" height="26" rx="4" fill="#cddcd3" />
      ))}
    </svg>

    <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-brand-700 px-3 py-1.5 text-[11px] font-medium text-white shadow-raised">
      <MapPin className="size-3" aria-hidden="true" />
      {label}
    </span>
  </div>
);

export const LocationLandmarks = ({ property }) => (
  <section className="rounded-card border border-line bg-surface p-5 shadow-card">
    <h2 className="text-[15px] font-semibold text-brand-700">Location &amp; Landmarks</h2>

    <div className="mt-4">
      <MapCanvas label={`${property.city}, ${property.country}`} />
    </div>

    <ul className="mt-4 space-y-2.5">
      {property.landmarks?.map((landmark) => (
        <li key={landmark} className="flex items-start gap-2 text-[13px] text-ink-soft">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
          {landmark}
        </li>
      ))}
    </ul>

    <Button
      variant="secondary"
      size="sm"
      className="mt-4"
      href={`https://www.google.com/maps/search/${encodeURIComponent(`${property.name} ${property.city}`)}`}
      target="_blank"
      rel="noreferrer noopener"
    >
      View on Map
    </Button>
  </section>
);
