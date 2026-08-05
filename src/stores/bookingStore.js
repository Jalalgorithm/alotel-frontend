import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Draft state for the multi-step booking wizard.
 *
 * Persisted to sessionStorage so a refresh — or the detour through the login
 * screen, or the round trip out to Stripe Checkout — never costs the guest the
 * details they already entered.
 */
export const BOOKING_STEPS = [
  { id: 'details', label: 'Guest Details' },
  { id: 'review', label: 'Review Booking' },
  { id: 'identity', label: 'Verify Identity' },
  { id: 'payment', label: 'Payment' },
  { id: 'success', label: 'Confirmation' },
];

const emptyDraft = {
  propertyId: null,

  guest: { firstName: '', lastName: '', email: '', phone: '' },

  /**
   * Mirrors the API's booking fields exactly. Infants are counted separately
   * because the API excludes them from the property's guest cap.
   */
  stay: {
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0,
    infants: 0,
    specialRequests: '',
    isCommercial: false,
  },

  /** Set once `POST /bookings/` succeeds — every later step keys off it. */
  bookingId: null,

  identity: { status: 'unstarted', sessionId: null },

  payment: { provider: '', transactionId: null, status: '' },
};

export const useBookingStore = create(
  persist(
    (set, get) => ({
      stepIndex: 0,
      draft: emptyDraft,

      /**
       * Start (or resume) a booking for a property.
       *
       * Switching listings resets everything: a booking id, identity session
       * and payment intent all belong to one property, and carrying them over
       * would attach a payment to the wrong stay.
       */
      startBooking: (propertyId) =>
        set((state) =>
          state.draft.propertyId === propertyId
            ? state
            : { stepIndex: 0, draft: { ...emptyDraft, propertyId } },
        ),

      /** Seed the stay from the property page's availability widget. */
      setStay: (stay) =>
        set((state) => ({ draft: { ...state.draft, stay: { ...state.draft.stay, ...stay } } })),

      /** Shallow-merge a slice of the draft, e.g. `updateDraft('guest', { email })`. */
      updateDraft: (section, values) =>
        set((state) => ({
          draft: { ...state.draft, [section]: { ...state.draft[section], ...values } },
        })),

      setBookingId: (bookingId) => set((state) => ({ draft: { ...state.draft, bookingId } })),

      goToStep: (index) =>
        set({ stepIndex: Math.max(0, Math.min(index, BOOKING_STEPS.length - 1)) }),

      nextStep: () => get().goToStep(get().stepIndex + 1),
      previousStep: () => get().goToStep(get().stepIndex - 1),

      reset: () => set({ stepIndex: 0, draft: emptyDraft }),
    }),
    {
      name: 'alotel.booking.draft',
      /**
       * Bumped when the draft shape changed (a single `guests` count became
       * adults/children/infants, and `bookingId` was added). Without this, a
       * persisted older draft would rehydrate with fields the wizard no longer
       * understands and silently book the wrong party size.
       */
      version: 1,
      migrate: () => ({ stepIndex: 0, draft: emptyDraft }),
      storage: {
        getItem: (name) => {
          const value = sessionStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    },
  ),
);
