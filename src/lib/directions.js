/**
 * A directions link, handed to whatever map app the visitor uses.
 *
 * Google Maps takes a plain text query, so this works from an address alone —
 * which matters, because not every listing the API returns has been geocoded.
 * Coordinates are preferred when we have them: they cannot be misparsed.
 */
export const directionsUrl = ({ coordinates, address } = {}) => {
  const query =
    coordinates?.lat != null && coordinates?.lng != null
      ? `${coordinates.lat},${coordinates.lng}`
      : address;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query ?? '')}`;
};
