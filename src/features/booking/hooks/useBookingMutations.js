import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from '@/stores/uiStore';
import { getErrorMessage } from '@/utils/errors';
import { nightsBetweenIso } from '@/lib/bookingSchema';

/**
 * Live availability for the dates and party size currently selected.
 *
 * Only runs once the selection could plausibly be valid — an incomplete or
 * backwards range would just earn a 400 from the API and flash an error in the
 * widget while the guest is still choosing.
 */
export const useAvailability = ({ propertyId, checkIn, checkOut, adults, children }) => {
  const nights = nightsBetweenIso(checkIn, checkOut);
  const enabled = Boolean(propertyId && checkIn && checkOut && nights > 0);

  return useQuery({
    queryKey: queryKeys.bookings.availability({ propertyId, checkIn, checkOut, adults, children }),
    queryFn: () => bookingService.checkAvailability({ propertyId, checkIn, checkOut, adults, children }),
    enabled,
    /**
     * Availability is a claim about the world right now — another guest can
     * take the dates at any moment — so it is never served from cache.
     */
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
};

/** The guest's own bookings, for the dashboard. */
export const useMyBookings = () =>
  useQuery({
    queryKey: queryKeys.bookings.list(),
    queryFn: () => bookingService.getBookings(),
  });

export const useBooking = (bookingId) =>
  useQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: () => bookingService.getBooking(bookingId),
    enabled: Boolean(bookingId),
  });

/** Create the booking. The API returns it in `pending_payment`. */
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: bookingService.createBooking,
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.setQueryData(queryKeys.bookings.detail(booking.id), booking);
    },
    onError: (error) => toast.error('Could not create booking', getErrorMessage(error)),
  });

  return {
    createBooking: mutation.mutate,
    createBookingAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ bookingId, reason }) => bookingService.cancelBooking(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      toast.success('Booking cancelled', 'You will receive a confirmation email shortly.');
    },
    onError: (error) => toast.error('Could not cancel booking', getErrorMessage(error)),
  });

  return { cancelBooking: mutation.mutate, isPending: mutation.isPending };
};

/**
 * Supported currencies and the currency→provider mapping.
 *
 * Cached for the session: it is configuration rather than live data, and every
 * visit to the payment step would otherwise refetch it.
 */
export const usePaymentOptions = (base = 'GBP') =>
  useQuery({
    queryKey: queryKeys.bookings.paymentOptions(base),
    queryFn: () => bookingService.getPaymentOptions(base),
    staleTime: 1000 * 60 * 30,
  });

/** Ask the server to open a payment. Returns a hosted checkout URL, if any. */
export const useInitiatePayment = () => {
  const mutation = useMutation({
    mutationFn: bookingService.initiatePayment,
    onError: (error) => toast.error('Could not start payment', getErrorMessage(error)),
  });

  return {
    initiatePayment: mutation.mutate,
    initiatePaymentAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

/**
 * Post-checkout reconciliation.
 *
 * Stripe returns the guest before its webhook has necessarily landed, so the
 * success page polls this until the booking leaves `pending_payment`.
 */
export const usePaymentStatus = (bookingId, { enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.bookings.paymentStatus(bookingId),
    queryFn: () => bookingService.getPaymentStatus(bookingId),
    enabled: Boolean(bookingId) && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling as soon as the booking has settled, either way.
      return status && status !== 'pending_payment' ? false : 3000;
    },
    retry: false,
  });

/**
 * Country tax rules, used only to name the tax line in a quote.
 *
 * Cached hard: these change about once a year, and the authoritative amount
 * always comes from the API's own pricing — this is presentation only.
 */
export const useTaxRules = () =>
  useQuery({
    queryKey: queryKeys.bookings.taxRules(),
    queryFn: () => bookingService.getTaxRules(),
    staleTime: 1000 * 60 * 60,
  });

/** Open a Stripe Identity verification session for this booking. */
export const useStartIdentity = () => {
  const mutation = useMutation({
    mutationFn: bookingService.startIdentity,
    onError: (error) => toast.error('Could not start verification', getErrorMessage(error)),
  });

  return {
    startIdentity: mutation.mutate,
    startIdentityAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
