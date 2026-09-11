import { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ExternalLink, MapPin } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { env } from '@/lib/env';
import { mapStyle } from '@/lib/mapStyle';
import { directionsUrl } from '@/lib/directions';

/**
 * One place on a map.
 *
 * The results map in search plots a whole page of listings; this plots exactly
 * one, and is what a residence, a space or a booking needs. Rendering is
 * MapLibre GL against Mapbox tiles, same as the results map — no per-load
 * licence fee, and swapping the style URL moves us to another tile vendor.
 *
 * Three states, all of which happen with real data:
 *  - coordinates and a token: the map
 *  - coordinates but no token: the address, and a link out to a map
 *  - no coordinates: the address alone, saying so plainly
 *
 * The last one is not hypothetical — two of the ten live listings have an empty
 * `coordinates` object. Rendering a grey square centred on the ocean for those
 * would be worse than admitting we have not pinned it yet.
 */

/** A brand pin, built as a DOM node because MapLibre markers take elements. */
const buildPin = () => {
  const element = document.createElement('div');
  element.className = 'grid size-8 place-items-center rounded-full bg-brand-700 shadow-raised ring-2 ring-white';
  element.innerHTML =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
  return element;
};


export const LocationMap = ({
  coordinates,
  address,
  label,
  /** `approximate` shows the neighbourhood note — used before a booking is paid. */
  approximate = false,
  zoom = 14,
  className,
  height = 'h-[260px]',
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [isReady, setReady] = useState(false);

  const token = env.mapboxToken;
  const hasPoint = coordinates?.lat != null && coordinates?.lng != null;
  const canMap = Boolean(token && hasPoint);

  useEffect(() => {
    if (!canMap || !containerRef.current || mapRef.current) return undefined;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: mapStyle(token),
      center: [coordinates.lng, coordinates.lat],
      zoom,
      attributionControl: true,
      /* A single location is a reference, not something to explore — scroll
         should move the page, not the map. Drag and the controls still work. */
      scrollZoom: false,
    });

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => setReady(true));
    new Marker({ element: buildPin() }).setLngLat([coordinates.lng, coordinates.lat]).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [canMap, token, coordinates?.lat, coordinates?.lng, zoom]);

  /* Re-centre rather than rebuild when the same component is handed a new
     place — the space detail page does this when a guest switches listing. */
  useEffect(() => {
    if (!mapRef.current || !isReady || !hasPoint) return;
    mapRef.current.setCenter([coordinates.lng, coordinates.lat]);
  }, [isReady, hasPoint, coordinates?.lat, coordinates?.lng]);

  const line = [label, address].filter(Boolean).join(' · ');

  return (
    <div className={cn('overflow-hidden rounded-card border border-line bg-surface', className)}>
      {canMap ? (
        <div ref={containerRef} className={cn('w-full', height)} />
      ) : (
        <div className={cn('flex flex-col items-center justify-center gap-2 bg-brand-50/50 p-6 text-center', height)}>
          <span className="grid size-10 place-items-center rounded-full bg-brand-100 text-brand-700">
            <MapPin className="size-4" aria-hidden="true" />
          </span>
          <p className="text-[12.5px] font-semibold text-ink">
            {hasPoint ? 'Map unavailable' : 'Not pinned on a map yet'}
          </p>
          <p className="max-w-xs text-[11.5px] leading-5 text-ink-muted">
            {hasPoint
              ? 'The address below is correct; the map needs a Mapbox token to draw.'
              : 'We have the address but not its exact coordinates. Directions still work.'}
          </p>
        </div>
      )}

      {(line || address) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-t border-line p-4">
          <p className="min-w-0 text-[12.5px] leading-5 text-ink-soft">
            <MapPin className="mr-1.5 inline size-3.5 text-brand-600" aria-hidden="true" />
            {line}
            {approximate && (
              /* Said once, plainly. A pin that looks exact but is not is worse
                 than no pin — a guest planning a walk from the station needs to
                 know which they are looking at. */
              <span className="mt-1 block text-[11.5px] text-ink-muted">
                Approximate until your booking is confirmed. The exact address is in your confirmation.
              </span>
            )}
          </p>

          <a
            href={directionsUrl({ coordinates, address })}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[12px] font-medium text-ink transition-colors hover:border-brand-400 hover:text-brand-700"
          >
            Directions
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
  );
};
