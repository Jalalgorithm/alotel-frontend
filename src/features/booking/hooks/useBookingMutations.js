import { useEffect, useRef } from 'react';
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
    /* PaymentStep raises the page banner, which carries the reassurance that
       nothing was charged; a toast alongside it would only repeat the words. */
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
export const usePaymentStatus = (bookingId, { enabled = true } = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
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

  /*
   * Drop the rest of the booking cache the moment payment settles.
   *
   * The booking was fetched seconds earlier, while it was still
   * `pending_payment`, and the client holds every query fresh for two minutes.
   * So without this the dashboard and the booking detail keep serving that
   * stale copy — a guest who has just paid sees "Payment pending" until they
   * reload the browser hard enough to drop the cache entirely, which is
   * exactly what was being reported.
   *
   * The ref makes this fire once per booking rather than on every poll tick:
   * invalidating `bookings.all` refetches this very query, and an unguarded
   * effect would chase its own tail.
   */
  const status = query.data?.status;
  const settled = Boolean(status) && status !== 'pending_payment';
  const flushedFor = useRef(null);

  useEffect(() => {
    if (!settled || !bookingId || flushedFor.current === bookingId) return;
    flushedFor.current = bookingId;
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
  }, [settled, bookingId, queryClient]);

  return query;
};

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
export const useContractText = (bookingId, { refetchInterval = false } = {}) =>
  useQuery({
    queryKey: queryKeys.bookings.contractText(bookingId),
    queryFn: () => bookingService.getContractText(bookingId),
    enabled: Boolean(bookingId),
    /* Short: a template can be published, or a contract signed, while the
       guest has the page open. */
    staleTime: 1000 * 30,
    refetchInterval,
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
    /* `terms` is `{ templateId, templateVersion }`, or `{ fallbackContent }`
       while nothing is published for the stay. */
    mutationFn: ({ bookingId, ...terms }) => bookingService.acceptAgreement(bookingId, terms),
    onSuccess: (result, { bookingId }) => {
      if (result?.termsChanged) {
        /* Not an error: the guest is shown the newer terms to read instead. */
        queryClient.setQueryData(queryKeys.bookings.contractText(bookingId), result.latest);
        return;
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.contractText(bookingId) });
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

/* -------------------------------------------------------------------------- */
/* Verification and signing                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The guest's identity check, as the server sees it.
 *
 * Pass `poll` while a submitted check is waiting on Stripe: each read makes
 * the server re-ask Stripe, so polling is how "submitted" becomes a decision.
 * Polling stops on its own once the answer is final.
 */
export const useIdentityStatus = (guestId, { enabled = true, poll = false } = {}) =>
  useQuery({
    queryKey: queryKeys.bookings.identityStatus(guestId),
    queryFn: () => bookingService.getIdentityStatus(guestId),
    enabled: Boolean(guestId) && enabled,
    refetchInterval: (query) => {
      if (!poll) return false;
      const status = query.state.data?.status;
      return status === 'verified' || status === 'failed' ? false : 4000;
    },
    retry: false,
  });

/**
 * The guest's identity attempts — why the last one failed, and how many there
 * have been. Only worth fetching once something has gone wrong.
 */
export const useIdentityAttempts = (guestId, { enabled = true } = {}) =>
  useQuery({
    queryKey: queryKeys.bookings.identityAttempts(guestId),
    queryFn: () => bookingService.getIdentityAttempts(guestId),
    enabled: Boolean(guestId) && enabled,
    retry: false,
  });

/**
 * The full check (AML, address, credit) for one booking. Null until started.
 *
 * Approval is a manual review, so this polls gently rather than quickly.
 */
export const useFullKycStatus = (guestId, bookingId, { enabled = true, poll = false } = {}) =>
  useQuery({
    queryKey: queryKeys.bookings.fullKyc(guestId, bookingId),
    queryFn: () => bookingService.getFullKycStatus(guestId, bookingId),
    enabled: Boolean(guestId && bookingId) && enabled,
    refetchInterval: (query) => {
      if (!poll) return false;
      const status = query.state.data?.status;
      return status === 'approved' || status === 'rejected' ? false : 20_000;
    },
    retry: false,
  });

/**
 * Create the long-stay contract, or pick up the one already out for signature.
 * Refreshes the booking so its contract summary is current.
 */
export const useStartContract = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (bookingId) => bookingService.startContract(bookingId),
    onSuccess: (_result, bookingId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.contractText(bookingId) });
    },
  });

  return { startContractAsync: mutation.mutateAsync, isPending: mutation.isPending };
};

/** Email the signing link again. Errors are handled by the caller. */
export const useResendContract = (bookingId) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (contractId) => bookingService.resendContract(contractId),
    onSuccess: () => {
      if (bookingId) queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
    },
  });

  return { resendContractAsync: mutation.mutateAsync, isPending: mutation.isPending };
};
