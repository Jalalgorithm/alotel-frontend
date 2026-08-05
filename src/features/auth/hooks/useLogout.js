import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { toast } from '@/stores/uiStore';

/**
 * Sign-out mutation.
 *
 * Clearing the *entire* query cache matters: without it, the next user to sign
 * in on this device could briefly see the previous user's cached bookings.
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  const resetBooking = useBookingStore((state) => state.reset);

  const mutation = useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      clearSession();
      resetBooking();
      queryClient.clear();
      toast.info('Signed out', 'You have been signed out of Alotel Spaces.');
    },
  });

  return {
    logout: mutation.mutate,
    logoutAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
};
