import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { spaceService } from '../services/spaceService';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from '@/stores/uiStore';
import { getErrorMessage } from '@/utils/errors';

export const useSpaces = (filters = {}) =>
  useQuery({
    queryKey: queryKeys.spaces.list(filters),
    queryFn: () => spaceService.getSpaces(filters),
    placeholderData: keepPreviousData,
  });

export const useSpace = (id) =>
  useQuery({
    queryKey: queryKeys.spaces.detail(id),
    queryFn: () => spaceService.getSpace(id),
    enabled: Boolean(id),
  });

/**
 * What is free on a given date.
 *
 * `staleTime: 0` on purpose. Availability is the one thing here that must never
 * be served from cache — a window that was open when the page loaded may not be
 * by the time the guest picks it.
 */
export const useSpaceAvailability = (id, date) =>
  useQuery({
    queryKey: queryKeys.spaces.availability(id, date),
    queryFn: () => spaceService.getAvailability(id, date),
    enabled: Boolean(id && date),
    staleTime: 0,
  });

export const useSpaceBookings = () =>
  useQuery({
    queryKey: queryKeys.spaces.bookings(),
    queryFn: spaceService.getMySpaceBookings,
  });

export const useSpaceBooking = (id) =>
  useQuery({
    queryKey: queryKeys.spaces.booking(id),
    queryFn: () => spaceService.getSpaceBooking(id),
    enabled: Boolean(id),
  });

/**
 * Quoting is a mutation, not a query: it is an explicit "price this" action
 * tied to a selection the guest is still editing, and it must not be refetched
 * on window focus behind their back.
 */
export const useSpaceQuote = (spaceId) => {
  const quote = useMutation({
    mutationFn: (selection) => spaceService.getQuote(spaceId, selection),
  });

  return { getQuote: quote.mutate, result: quote.data, isPending: quote.isPending, reset: quote.reset };
};

/**
 * Book, then pay.
 *
 * The API creates every space booking as `pending_payment` — the
 * instant-versus-request split only happens once payment clears. So booking is
 * two calls: create, then exchange the booking for a Stripe Checkout URL and
 * hand the browser over, exactly as property bookings already do.
 *
 * If the server returns no payment URL (the mock, or a zero-value booking) the
 * flow falls through to the confirmation page instead of stalling on a
 * redirect that is never coming.
 */
export const useBookSpace = (spaceId) => {
  const queryClient = useQueryClient();

  const book = useMutation({
    mutationFn: async (selection) => {
      const booking = await spaceService.bookSpace(spaceId, selection);

      if (booking.status !== 'pending_payment') return { booking, paymentUrl: null };

      const payment = await spaceService.initiateSpacePayment({
        bookingId: booking.id,
        currency: booking.currency,
      });

      return { booking, paymentUrl: payment?.paymentUrl ?? null };
    },
    onSuccess: ({ booking, paymentUrl }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.all() });

      if (paymentUrl) {
        toast.info('Taking you to payment', 'Your slot is held while you pay.');
        window.location.assign(paymentUrl);
        return;
      }

      /* The two outcomes are genuinely different news — "confirmed" and "the
         host has 24 hours" must not share a message. */
      if (booking.status === 'confirmed') {
        toast.success('Your space is booked', `${booking.startTime}–${booking.endTime}`);
      } else if (booking.status === 'pending_host_approval') {
        toast.info('Request sent', 'The host will confirm — you will hear either way.');
      }
    },
    onError: (error) => toast.error('Could not complete the booking', getErrorMessage(error)),
  });

  return { book: book.mutate, isPending: book.isPending, booking: book.data?.booking };
};

export const useCancelSpaceBooking = () => {
  const queryClient = useQueryClient();

  const cancel = useMutation({
    mutationFn: spaceService.cancelSpaceBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.all() });
      toast.info('Booking cancelled', 'The time slot has been released.');
    },
    onError: (error) => toast.error('Could not cancel', getErrorMessage(error)),
  });

  return { cancel: cancel.mutate, isPending: cancel.isPending };
};
