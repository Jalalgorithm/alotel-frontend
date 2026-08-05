import { useEffect, useState } from 'react';

/**
 * Track whether the page has scrolled past `threshold` — the landing header
 * uses it to swap from transparent to solid.
 *
 * @param {number} [threshold=24]
 * @returns {boolean}
 */
export const useHasScrolled = (threshold = 24) => {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return hasScrolled;
};
