import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { queryKeys } from '@/lib/queryKeys';
import { selectUser, useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/uiStore';
import { getErrorMessage } from '@/utils/errors';

/**
 * The signed-in user's notifications.
 *
 * Polled rather than pushed — there is no websocket — but at a minute, which is
 * often enough for a booking approval to feel prompt without hammering the API.
 * Disabled entirely when signed out, since the endpoint is user-scoped.
 */
export const useNotifications = () => {
  const user = useAuthStore(selectUser);
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: queryKeys.notifications.list(userId),
    queryFn: () => notificationService.list(userId),
    enabled: Boolean(userId),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const items = query.data ?? [];

  return {
    ...query,
    notifications: items,
    /* Derived, because there is no unread-count endpoint to ask. */
    unreadCount: items.filter((notification) => !notification.isRead).length,
  };
};

export const useNotificationMutations = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(selectUser);
  const userId = user?.id ?? null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });

  const markRead = useMutation({
    mutationFn: notificationService.markRead,
    /*
     * Optimistic: marking read is the one action a reader expects to be
     * instant, and a round-trip before the dot disappears feels broken.
     */
    onMutate: async (id) => {
      const key = queryKeys.notifications.list(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);

      queryClient.setQueryData(key, (current = []) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, isRead: true, status: 'read' } : notification,
        ),
      );

      return { previous, key };
    },
    onError: (error, id, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
      toast.error('Could not mark as read', getErrorMessage(error));
    },
    onSettled: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: (result) => {
      invalidate();
      if (result.count) toast.success('All caught up', `${result.count} marked as read.`);
    },
    onError: (error) => toast.error('Could not mark all as read', getErrorMessage(error)),
  });

  return {
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
    isMarkingAll: markAllRead.isPending,
  };
};

export const useNotificationPreferences = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(selectUser);
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: queryKeys.notifications.preferences(userId),
    queryFn: () => notificationService.getPreferences(userId),
    enabled: Boolean(userId),
  });

  const update = useMutation({
    mutationFn: (patch) => notificationService.updatePreferences(userId, patch),
    onSuccess: (preferences) => {
      queryClient.setQueryData(queryKeys.notifications.preferences(userId), preferences);
      toast.success('Preferences saved');
    },
    onError: (error) => toast.error('Could not save preferences', getErrorMessage(error)),
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    updatePreferences: update.mutate,
    isSaving: update.isPending,
  };
};
