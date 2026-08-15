import { useEffect } from 'react';
import { useBookingStore, BOOKING_STEPS } from '@/stores/bookingStore';
import { useProperty, usePropertyAvailability } from '@/features/properties';
import { useAuth } from '@/features/auth';
import { useAvailability } from './useBookingMutations';

/**
 * Wizard controller: owns the draft, the property being booked, and the live
 * quote for the selected stay.
 *
 * Pricing is never computed here. Only the API knows about seasonal rates,
 * discounts and per-market tax rules, so the wizard shows what the availability
 * endpoint quoted — the same numbers the booking will be created with.
 *
 * @param {string} propertyId
 */
export const useBookingWizard = (propertyId) => {
  const { user } = useAuth();
  const { data: property, isLoading } = useProperty(propertyId);

  /**
   * The property's blocked nights.
   *
   * The sidebar on the detail page already greys these out, but the wizard was
   * only running the *range* check for dates the guest had already picked — so
   * its own picker showed every night as free and the guest only discovered a
   * clash after choosing. Same source as the sidebar, so the two cannot
   * disagree about what is available.
   */
  const { data: calendar } = usePropertyAvailability(propertyId);

  const stepIndex = useBookingStore((state) => state.stepIndex);
  const draft = useBookingStore((state) => state.draft);
  const startBooking = useBookingStore((state) => state.startBooking);
  const updateDraft = useBookingStore((state) => state.updateDraft);
  const setBookingId = useBookingStore((state) => state.setBookingId);
  const goToStep = useBookingStore((state) => state.goToStep);
  const nextStep = useBookingStore((state) => state.nextStep);
  const previousStep = useBookingStore((state) => state.previousStep);
  const reset = useBookingStore((state) => state.reset);

  // Bind the draft to this property (resets if the guest switched listings).
  useEffect(() => {
    if (propertyId) startBooking(propertyId);
  }, [propertyId, startBooking]);

  // Prefill guest details from the session — the designs show them populated.
  useEffect(() => {
    if (!user || draft.guest.email) return;

    const [firstName = '', ...rest] = (user.fullName ?? '').split(' ');
    updateDraft('guest', {
      firstName,
      lastName: rest.join(' '),
      email: user.email,
      phone: user.phone ?? '',
    });
  }, [user, draft.guest.email, updateDraft]);

  const { stay } = draft;

  const availabilityQuery = useAvailability({
    propertyId,
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    adults: stay.adults,
    children: stay.children,
  });

  const availability = availabilityQuery.data ?? null;

  return {
    property,
    isLoading,
    steps: BOOKING_STEPS,
    step: BOOKING_STEPS[stepIndex],
    stepIndex,
    draft,

    availability,
    blockedDates: calendar?.blockedDates ?? new Set(),
    isCheckingAvailability: availabilityQuery.isFetching,
    /** The quote for the selected stay, or null until the API has answered. */
    pricing: availability?.pricing ?? null,
    currency: availability?.currency ?? property?.currency,
    nights: availability?.nights ?? 0,

    updateDraft,
    setBookingId,
    goToStep,
    nextStep,
    previousStep,
    reset,
  };
};
