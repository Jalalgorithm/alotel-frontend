import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '../services/wishlistService';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/features/auth';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { toast } from '@/stores/uiStore';
import { getErrorMessage } from '@/utils/errors';

/**
 * The guest's saved properties.
 *
 * Only fetched when signed in — the wishlist endpoint is authenticated, and
 * asking anonymously would just produce a 401 on every property page.
 */
export const useSavedProperties = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.properties.saved(),
    queryFn: () => wishlistService.getSaved(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  });
};

/**
 * Toggle a save.
 *
 * Signed in, this writes to the API and optimistically flips the heart, because
 * a save that waits on a round trip feels broken. Signed out it falls back to
 * the local store, so browsing still works and nothing is lost at sign-in —
 * `useMergeLocalFavorites` pushes those up later.
 */
export const useToggleFavorite = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const toggleLocal = useFavoritesStore((state) => state.toggle);

  const mutation = useMutation({
    mutationFn: ({ propertyId, isSaved }) =>
      isSaved ? wishlistService.unsave(propertyId) : wishlistService.save(propertyId),

    onMutate: async ({ propertyId, isSaved }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.properties.saved() });
      const previous = queryClient.getQueryData(queryKeys.properties.saved());

      queryClient.setQueryData(queryKeys.properties.saved(), (current = []) =>
        isSaved
          ? current.filter((entry) => entry.propertyId !== propertyId)
          : [...current, { id: propertyId, propertyId, name: '', city: '', price: 0, image: null }],
      );

      return { previous };
    },

    onError: (error, _variables, context) => {
      queryClient.setQueryData(queryKeys.properties.saved(), context?.previous);
      toast.error('Could not update your saved properties', getErrorMessage(error));
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.properties.saved() }),
  });

  return {
    toggleFavorite: ({ propertyId, isSaved }) => {
      if (!isAuthenticated) {
        toggleLocal(propertyId);
        return;
      }
      mutation.mutate({ propertyId, isSaved });
    },
    isPending: mutation.isPending,
  };
};

/** Whether one property is saved, from whichever store is authoritative. */
export const useIsFavorite = (propertyId) => {
  const { isAuthenticated } = useAuth();
  const { data: saved } = useSavedProperties();
  const localIds = useFavoritesStore((state) => state.ids);

  return isAuthenticated
    ? Boolean(saved?.some((entry) => entry.propertyId === propertyId))
    : localIds.includes(propertyId);
};

/**
 * Carry anything hearted while signed out into the account, once.
 *
 * Mounted by the dashboard rather than a provider: it only matters after a
 * sign-in, and that is where the guest lands.
 */
export const useMergeLocalFavorites = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const localCount = useFavoritesStore((state) => state.ids.length);

  useEffect(() => {
    if (!isAuthenticated || localCount === 0) return;

    wishlistService.mergeLocalInto().then(({ merged }) => {
      if (!merged) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.saved() });
      toast.success(
        `${merged} saved ${merged === 1 ? 'property' : 'properties'} added to your account`,
        'They will now follow you between devices.',
      );
    });
  }, [isAuthenticated, localCount, queryClient]);
};
