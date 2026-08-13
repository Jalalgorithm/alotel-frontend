import { useEffect, useMemo, useRef, useState } from 'react';
import { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Layers } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { formatCurrency } from '@/utils/format';
import { env } from '@/lib/env';

/**
 * The results map.
 *
 * Rendering is MapLibre GL — the open fork of Mapbox GL v1 — so there is no
 * per-map-load licence fee. The Mapbox token pays only for tiles and geocoding.
 * Swapping the style URL is all that is needed to move to another tile vendor.
 *
 * Without a token the component renders nothing and the caller falls back, so a
 * missing key degrades to a list rather than a broken grey canvas.
 */

const styleUrl = (token) =>
  `https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=${token}`;

/** A price pill, built as a DOM node because MapLibre markers take elements. */
const buildMarkerElement = (property, { isActive }) => {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = [
    'rounded-full border px-2.5 py-1 text-[11.5px] font-semibold shadow-sm transition-transform',
    isActive
      ? 'z-10 scale-110 border-brand-700 bg-brand-700 text-white'
      : 'border-line bg-white text-ink hover:scale-105 hover:border-brand-400',
  ].join(' ');
  element.textContent = formatCurrency(property.price, property.currency, { decimals: 0 });
  element.setAttribute('aria-label', `${property.name} — ${formatCurrency(property.price, property.currency)} a night`);
  return element;
};

export const PropertyMap = ({ properties = [], activeId, onHover, onSelect, className }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const [isReady, setIsReady] = useState(false);

  const token = env.mapboxToken;

  /** Only properties the API has actually geocoded can be placed. */
  const mappable = useMemo(
    () => properties.filter((property) => property.coordinates?.lat != null && property.coordinates?.lng != null),
    [properties],
  );

  /* ------------------------------------------------------------- create map */
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return undefined;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: styleUrl(token),
      center: [-0.1276, 51.5072],
      zoom: 9,
      attributionControl: true,
    });

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => setIsReady(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [token]);

  /* --------------------------------------------------------------- markers */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    // Rebuild wholesale: the result set changes as a unit on every search, and
    // diffing markers would cost more than recreating a page of them.
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    mappable.forEach((property) => {
      const element = buildMarkerElement(property, { isActive: property.id === activeId });

      element.addEventListener('mouseenter', () => onHover?.(property.id));
      element.addEventListener('mouseleave', () => onHover?.(null));
      element.addEventListener('click', () => onSelect?.(property.id));

      const marker = new Marker({ element })
        .setLngLat([property.coordinates.lng, property.coordinates.lat])
        .addTo(map);

      markersRef.current.set(property.id, marker);
    });

    // Frame the results, but never zoom so far in that a single result loses
    // all context.
    if (mappable.length) {
      const bounds = new LngLatBounds();
      mappable.forEach((property) => bounds.extend([property.coordinates.lng, property.coordinates.lat]));
      map.fitBounds(bounds, { padding: 64, maxZoom: 14, duration: 600 });
    }
  }, [mappable, isReady, activeId, onHover, onSelect]);

  /* ------------------------------------------------- reflect the active pin */
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const element = marker.getElement();
      const isActive = id === activeId;
      element.classList.toggle('z-10', isActive);
      element.classList.toggle('scale-110', isActive);
      element.classList.toggle('border-brand-700', isActive);
      element.classList.toggle('bg-brand-700', isActive);
      element.classList.toggle('text-white', isActive);
      element.classList.toggle('bg-white', !isActive);
      element.classList.toggle('text-ink', !isActive);
      element.classList.toggle('border-line', !isActive);
    });
  }, [activeId]);

  if (!token) return null;

  const hidden = properties.length - mappable.length;

  return (
    <div className={cn('relative overflow-hidden rounded-card border border-line', className)}>
      <div ref={containerRef} className="size-full" />

      {/*
        Never silently drop a result. A listing the API has not geocoded still
        appears in the list, and the count says so rather than leaving the two
        panels quietly disagreeing.
      */}
      {hidden > 0 && (
        <p className="absolute inset-x-3 bottom-3 rounded-lg bg-surface/95 px-3 py-2 text-[11.5px] text-ink-soft shadow-card backdrop-blur">
          <MapPin className="mr-1 inline size-3 text-brand-600" aria-hidden="true" />
          {mappable.length} of {properties.length} shown on the map — {hidden} {hidden === 1 ? 'has' : 'have'} no
          location recorded yet.
        </p>
      )}
    </div>
  );
};

/** Shown in place of the map when no token is configured. */
export const MapUnavailable = ({ className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line bg-line-soft p-6 text-center',
      className,
    )}
  >
    <span className="flex size-10 items-center justify-center rounded-full bg-brand-50">
      <Layers className="size-4 text-brand-600" aria-hidden="true" />
    </span>
    <p className="text-[13px] font-semibold text-ink">Map not available</p>
    <p className="max-w-xs text-[11.5px] text-ink-muted">
      Add a Mapbox public token to enable the map. Results are unaffected — everything is listed alongside.
    </p>
  </div>
);
