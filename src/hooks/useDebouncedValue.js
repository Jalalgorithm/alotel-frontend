import { useEffect, useState } from 'react';

/**
 * Debounce a rapidly-changing value — used by the search field so React Query
 * only refetches once the guest stops typing.
 *
 * @template T
 * @param {T} value
 * @param {number} [delay=350]
 * @returns {T}
 */
export const useDebouncedValue = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
