import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query.
 *
 * @param {string} query e.g. `'(min-width: 1024px)'`
 * @returns {boolean}
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};

/** Convenience wrappers matching the Tailwind breakpoints used in the designs. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
