import { useMemo } from 'react';
import { formatCurrency } from '@/utils/format';
import { ResultsMap } from '@/components/map/ResultsMap';

/**
 * The residence results map.
 *
 * All of the MapLibre lifecycle now lives in `ResultsMap`, which takes plain
 * points; this is just the adapter that decides a residence's pill says its
 * nightly price. The spaces search uses the same map with a different pill.
 */
export const PropertyMap = ({ properties = [], activeId, onHover, onSelect, className }) => {
  const points = useMemo(
    () =>
      properties.map((property) => ({
        id: property.id,
        lat: property.coordinates?.lat,
        lng: property.coordinates?.lng,
        label: formatCurrency(property.price, property.currency, { decimals: 0 }),
        description: `${property.name} — ${formatCurrency(property.price, property.currency)} a night`,
      })),
    [properties],
  );

  return (
    <ResultsMap
      points={points}
      total={properties.length}
      activeId={activeId}
      onHover={onHover}
      onSelect={onSelect}
      className={className}
    />
  );
};

export { MapUnavailable } from '@/components/map/ResultsMap';
