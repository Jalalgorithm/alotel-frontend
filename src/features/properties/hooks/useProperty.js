import { useQuery } from '@tanstack/react-query';
import { propertyService } from '../services/propertyService';
import { queryKeys } from '@/lib/queryKeys';

/** Single property detail. */
export const useProperty = (propertyId) =>
  useQuery({
    queryKey: queryKeys.properties.detail(propertyId),
    queryFn: () => propertyService.getProperty(propertyId),
    enabled: Boolean(propertyId),
  });

/** The "Similar Properties" rail on the detail page. */
export const useSimilarProperties = (propertyId, limit = 4) =>
  useQuery({
    queryKey: queryKeys.properties.similar(propertyId),
    queryFn: () => propertyService.getSimilarProperties(propertyId, limit),
    enabled: Boolean(propertyId),
    staleTime: 1000 * 60 * 10,
  });

/**
 * Booked and blocked nights for the booking calendar.
 *
 * Deliberately short-lived: another guest can take a date at any moment, and a
 * stale calendar would offer nights that are already gone.
 */
export const usePropertyAvailability = (propertyId) =>
  useQuery({
    queryKey: queryKeys.properties.calendar(propertyId),
    queryFn: () => propertyService.getPropertyAvailability(propertyId),
    enabled: Boolean(propertyId),
    staleTime: 1000 * 60,
  });

/** Walkthrough videos. Rarely change, so they are cached generously. */
export const usePropertyVideos = (propertyId) =>
  useQuery({
    queryKey: queryKeys.properties.videos(propertyId),
    queryFn: () => propertyService.getPropertyVideos(propertyId),
    enabled: Boolean(propertyId),
    staleTime: 1000 * 60 * 10,
  });
