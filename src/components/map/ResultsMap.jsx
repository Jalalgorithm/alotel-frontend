import { useEffect, useMemo, useRef, useState } from 'react';
import { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, MapPin } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { env } from '@/lib/env';
import { mapStyle } from '@/lib/mapStyle';

/**
 * A page of results on a map.
 *
 * Takes plain points — `{ id, lat, lng, label }` — rather than listings, so the
 * residence search and the spaces search can share one map instead of keeping
 * two near-identical copies of the MapLibre lifecycle. Callers map their own
 * domain object into that shape and decide what the pill says.
 *
 * Rendering is MapLibre GL — the open fork of Mapbox GL v1 — so there is no
 * per-map-load licence fee. The Mapbox token pays only for tiles and geocoding.
 * Swapping the style URL is all that is needed to move to another tile vendor.
 *
 * Without a token the component renders nothing and the caller falls back, so a
 * missing key degrades to a list rather than a broken grey canvas.
 */

/** A label pill, built as a DOM node because MapLibre markers take elements. */
const buildMarkerElement = (point, { isActive }) => {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = [
    'rounded-full border px-2.5 py-1 text-[11.5px] font-semibold shadow-sm transition-transform',
    isActive
      ? 'z-10 scale-110 border-brand-700 bg-brand-700 text-white'
      : 'border-line bg-white text-ink hover:scale-105 hover:border-brand-400',
  ].join(' ');
  element.textContent = point.label;
  element.setAttribute('aria-label', point.description ?? point.label);
  return element;
};

const ACTIVE_CLASSES = [
  'z-10',
  'scale-110',
  'border-brand-700',
  'bg-brand-700',
  'text-white',
];
const IDLE_CLASSES = ['bg-white', 'text-ink', 'border-line'];

/** Great-circle distance in kilometres, good enough for an outlier test. */
const distanceKm = (a, b) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

/**
 * Drop points that cannot plausibly belong with the rest.
 *
 * A city map framed with `fitBounds` is only as good as its worst coordinate:
 * one listing mis-geocoded to another continent drags the view out to a world
 * map, and every real pin collapses into a dot. That is not hypothetical here —
 * several seeded listings carry London coordinates while being filed under
 * Lagos, Dubai and New York, which turned the Lagos guide's map into a view of
 * the Atlantic.
 *
 * The median point is the reference because a mean would be dragged by the very
 * outliers being tested for. Anything beyond `withinKm` of it is set aside, and
 * the caller reports the count rather than hiding it.
 */
const withoutOutliers = (points, withinKm) => {
  if (!withinKm || points.length < 2) return { kept: points, dropped: 0 };

  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  const centre = {
    lat: median(points.map((point) => point.lat)),
    lng: median(points.map((point) => point.lng)),
  };

  const kept = points.filter((point) => distanceKm(centre, point) <= withinKm);
  /* Never return an empty map because the threshold was unlucky. */
  if (!kept.length) return { kept: points, dropped: 0 };

  return { kept, dropped: points.length - kept.length };
};

export const ResultsMap = ({
  points = [],
  total,
  activeId,
  onHover,
  onSelect,
  /**
   * Kilometres from the median point beyond which a marker is treated as
   * mis-geocoded. Set it on a single-city map; leave it off for a search that
   * legitimately spans countries.
   */
  withinKm,
  className,
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const [isReady, setIsReady] = useState(false);

  const token = env.mapboxToken;

  /** Only points the API has actually geocoded can be placed. */
  const geocoded = useMemo(
    () => points.filter((point) => point.lat != null && point.lng != null),
    [points],
  );

  const { kept: mappable, dropped: misplaced } = useMemo(
    () => withoutOutliers(geocoded, withinKm),
    [geocoded, withinKm],
  );

  /* ------------------------------------------------------------- create map */
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return undefined;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: mapStyle(token),
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

    mappable.forEach((point) => {
      const element = buildMarkerElement(point, { isActive: point.id === activeId });

      element.addEventListener('mouseenter', () => onHover?.(point.id));
      element.addEventListener('mouseleave', () => onHover?.(null));
      element.addEventListener('click', () => onSelect?.(point.id));

      const marker = new Marker({ element }).setLngLat([point.lng, point.lat]).addTo(map);
      markersRef.current.set(point.id, marker);
    });

    // Frame the results, but never zoom so far in that a single result loses
    // all context.
    if (mappable.length) {
      const bounds = new LngLatBounds();
      mappable.forEach((point) => bounds.extend([point.lng, point.lat]));
      map.fitBounds(bounds, { padding: 64, maxZoom: 14, duration: 600 });
    }
  }, [mappable, isReady, activeId, onHover, onSelect]);

  /* ------------------------------------------------- reflect the active pin */
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const element = marker.getElement();
      const isActive = id === activeId;
      ACTIVE_CLASSES.forEach((name) => element.classList.toggle(name, isActive));
      IDLE_CLASSES.forEach((name) => element.classList.toggle(name, !isActive));
    });
  }, [activeId]);

  if (!token) return null;

  const shown = mappable.length;
  const count = total ?? points.length;
  const hidden = count - shown;

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
          {shown} of {count} shown on the map —{' '}
          {misplaced > 0 && (
            <>
              {misplaced} {misplaced === 1 ? 'is' : 'are'} recorded well outside this area
              {hidden > misplaced && ', and '}
            </>
          )}
          {hidden > misplaced && (
            <>
              {hidden - misplaced} {hidden - misplaced === 1 ? 'has' : 'have'} no location recorded yet
            </>
          )}
          .
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
