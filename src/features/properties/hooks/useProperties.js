import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { propertyService } from '../services/propertyService';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Paginated / filtered property list.
 *
 * `keepPreviousData` holds the current page on screen while the next one loads,
 * so paginating and filtering never flash an empty grid.
 *
 * @param {object} [filters]
 */
export const useProperties = (filters = {}) =>
  useQuery({
    queryKey: queryKeys.properties.list(filters),
    queryFn: () => propertyService.getProperties(filters),
    placeholderData: keepPreviousData,
  });

/** The curated set behind "Discover Your Perfect Space" on the landing page. */
export const useFeaturedProperties = (limit = 8) =>
  useQuery({
    queryKey: queryKeys.properties.list({ featured: true, limit }),
    queryFn: () => propertyService.getFeaturedProperties(limit),
    staleTime: 1000 * 60 * 10,
  });
