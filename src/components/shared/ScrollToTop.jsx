import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router preserves scroll position between routes; the designs expect a
 * fresh page to start at the top.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname]);

  return null;
};
