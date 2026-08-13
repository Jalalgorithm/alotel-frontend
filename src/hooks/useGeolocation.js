import { useCallback, useState } from 'react';
import { env } from '@/lib/env';

/**
 * The guest's location, on request only.
 *
 * Never prompts on mount. A permission dialog nobody asked for is the fastest
 * way to get permanently denied, so the browser is only asked when the guest
 * presses the button.
 *
 * Coordinates come from the browser; turning them into a place name uses
 * Mapbox reverse geocoding, called directly with the public token — the
 * backend's own reverse-geocode endpoint is Super Admin only, so it is not an
 * option here.
 */

const REVERSE_GEOCODE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

/** The Mapbox feature types worth showing a guest, most specific first. */
const PLACE_TYPES = ['neighborhood', 'locality', 'place', 'district', 'region'];

const pickPlaceName = (features = []) => {
  for (const type of PLACE_TYPES) {
    const match = features.find((feature) => feature.place_type?.includes(type));
    if (match) return match.text || match.place_name;
  }
  return features[0]?.place_name ?? '';
};

export const useGeolocation = () => {
  const [state, setState] = useState({ status: 'idle', coordinates: null, placeName: '', error: '' });

  const locate = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'error', coordinates: null, placeName: '', error: 'This browser cannot share your location.' });
      return null;
    }

    setState((previous) => ({ ...previous, status: 'locating', error: '' }));

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000,
        });
      });

      const coordinates = { lat: position.coords.latitude, lng: position.coords.longitude };
      let placeName = '';

      // A name is a nicety — failing to get one must not fail the whole action.
      if (env.mapboxToken) {
        try {
          const response = await fetch(
            `${REVERSE_GEOCODE}/${coordinates.lng},${coordinates.lat}.json?access_token=${env.mapboxToken}&types=${PLACE_TYPES.join(',')}&limit=5`,
          );
          if (response.ok) placeName = pickPlaceName((await response.json()).features);
        } catch {
          /* keep the coordinates; the caller can still search by them */
        }
      }

      setState({ status: 'ready', coordinates, placeName, error: '' });
      return { coordinates, placeName };
    } catch (error) {
      /**
       * Denial is a decision, not a fault — say so plainly rather than showing
       * a red error, and never re-prompt automatically.
       */
      const isDenied = error?.code === 1;
      setState({
        status: isDenied ? 'denied' : 'error',
        coordinates: null,
        placeName: '',
        error: isDenied
          ? 'Location access is off. You can turn it on in your browser settings, or type a place instead.'
          : 'We could not get your location. Please type a place instead.',
      });
      return null;
    }
  }, []);

  return { ...state, locate, isLocating: state.status === 'locating' };
};
