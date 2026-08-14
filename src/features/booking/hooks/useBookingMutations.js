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

/**
 * The agreement text for a booking.
 *
 * Resolves to null for a short stay, where no contract is issued and the
 * checkbox applies instead — that is a normal state, not an error.
 */
export const useContractText = (bookingId) =>
  useQuery({
    queryKey: queryKeys.bookings.contractText(bookingId),
    queryFn: () => bookingService.getContractText(bookingId),
    enabled: Boolean(bookingId),
    staleTime: 1000 * 60 * 5,
  });

/** Signature status, once a contract exists to have a status. */
export const useContractStatus = (contractId) =>
  useQuery({
    queryKey: queryKeys.bookings.contractStatus(contractId),
    queryFn: () => bookingService.getContractStatus(contractId),
    enabled: Boolean(contractId),
  });

/**
 * Record acceptance of the booking agreement.
 *
 * The booking is refetched rather than patched locally: the API stamps
 * `agreement_accepted_at` server-side, and that timestamp is the record we
 * display everywhere afterwards.
 */
export const useAcceptAgreement = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (bookingId) => bookingService.acceptAgreement(bookingId),
    onSuccess: (_result, bookingId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
    },
    onError: (error) => toast.error('Could not record your agreement', getErrorMessage(error)),
  });

  return {
    acceptAgreement: mutation.mutate,
    acceptAgreementAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
};

/**
 * What staff recorded for a stage. Null when they have not started.
 *
 * Short staleness: photos appear as staff work through the property, and a
 * guest refreshing mid-inspection should see them.
 */
export const useInspection = (bookingId, stage) =>
  useQuery({
    queryKey: queryKeys.bookings.inspection(bookingId, stage),
    queryFn: () => bookingService.getInspection(bookingId, stage),
    enabled: Boolean(bookingId && stage),
    staleTime: 1000 * 30,
  });

/**
 * Acknowledge a completed check-in or check-out.
 *
 * The booking and its timeline are refetched afterwards rather than patched
 * locally — acknowledgement state lives server-side, and guessing at it here
 * would be the frontend inventing a fact it cannot see.
 */
export const useAcknowledgeInspection = (bookingId) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (stage) => bookingService.acknowledgeInspection(bookingId, stage),
    onSuccess: (inspection) => {
      const stage = inspection?.stage;
      // The POST returns the updated inspection, so seed it rather than
      // refetching only to learn what we already have.
      if (stage) queryClient.setQueryData(queryKeys.bookings.inspection(bookingId, stage), inspection);
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.timeline(bookingId) });
      toast.success(
        stage === 'checkin' ? 'Check-in confirmed' : 'Check-out confirmed',
        'Thank you — this is now on your booking record.',
      );
    },
    onError: (error) => toast.error('Could not confirm', getErrorMessage(error)),
  });

  return { acknowledge: mutation.mutate, isPending: mutation.isPending, stage: mutation.variables };
};

/** The stay's progress steps, owned by the server. */
export const useBookingTimeline = (bookingId) =>
  useQuery({
    queryKey: queryKeys.bookings.timeline(bookingId),
    queryFn: () => bookingService.getTimeline(bookingId),
    enabled: Boolean(bookingId),
  });

/** Line items and settled payments — the basis of the downloadable receipt. */
export const useBookingReceipt = (bookingId) =>
  useQuery({
    queryKey: queryKeys.bookings.receipt(bookingId),
    queryFn: () => bookingService.getReceipt(bookingId),
    enabled: Boolean(bookingId),
  });

/** The support thread for one booking. */
export const useBookingMessages = (bookingId) =>
  useQuery({
    queryKey: queryKeys.bookings.messages(bookingId),
    queryFn: () => bookingService.getMessages(bookingId),
    enabled: Boolean(bookingId),
    /** A conversation is worth keeping fresh while the guest is reading it. */
    refetchInterval: 30000,
  });

export const useSendMessage = (bookingId) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (body) => bookingService.sendMessage(bookingId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookings.messages(bookingId) }),
    onError: (error) => toast.error('Message not sent', getErrorMessage(error)),
  });

  return { sendMessage: mutation.mutate, isPending: mutation.isPending };
};

/** In-app notifications for the signed-in guest. */
export const useNotifications = (guestId) =>
  useQuery({
    queryKey: queryKeys.bookings.notifications(guestId),
    queryFn: () => bookingService.getNotifications(guestId),
    enabled: Boolean(guestId),
    staleTime: 1000 * 60,
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
