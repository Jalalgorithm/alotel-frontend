import { apiClient } from '@/lib/apiClient';
import { toContractStatus, toContractText } from '@/lib/agreementSchema';
import { toInspection } from '@/lib/bookingSchema';
import { env } from '@/lib/env';
import { authStorage, jsonStorage } from '@/lib/storage';
import { ApiError } from '@/utils/errors';
import { clone, createId, delay } from '@/lib/mock/utils';
import {
  defaultProviderFor,
  toAvailability,
  toBooking,
  toBookingSummary,
  toMessage,
  toNotification,
  toPaymentIntent,
  toReceipt,
  toTimeline,
} from '@/lib/bookingSchema';

/**
 * Booking service — availability, booking lifecycle, identity verification and
 * payment initiation.
 *
 * Mock and real implementations share one surface, so components never learn
 * which backend is answering.
 */

const BOOKINGS_KEY = 'alotel.mock.bookings';

const readBookings = () => jsonStorage.read(BOOKINGS_KEY, []);
const writeBookings = (bookings) => jsonStorage.write(BOOKINGS_KEY, bookings);

const requireUser = () => {
  const user = authStorage.getUser();
  if (!user) throw new ApiError('Please sign in to manage bookings.', 401);
  return user;
};

const mockBookings = {
  async checkAvailability({ propertyId, checkIn, checkOut, adults = 1, children = 0 }) {
    await delay(400);

    const nights = Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 864e5));
    const nightlyTotal = 200 * nights;

    return {
      propertyId,
      isAvailable: nights > 0,
      checkIn,
      checkOut,
      nights,
      currency: 'GBP',
      conflicts: nights > 0 ? [] : ['Select at least one night.'],
      pricing: {
        currency: 'GBP',
        nightlyTotal,
        discountTotal: 0,
        cleaningFee: 45,
        taxTotal: nightlyTotal * 0.2,
        securityDeposit: 150,
        totalDueNow: nightlyTotal + 45 + nightlyTotal * 0.2,
      },
      guests: adults + children,
    };
  },

  async create(payload) {
    await delay(900);
    const user = requireUser();

    const booking = {
      id: createId('bkg'),
      userId: user.id,
      status: 'pending_payment',
      statusLabel: 'Payment pending',
      createdAt: new Date().toISOString(),
      lineItems: [],
      statusHistory: [],
      ...payload,
    };

    writeBookings([booking, ...readBookings()]);
    return clone(booking);
  },

  async list() {
    await delay(450);
    const user = requireUser();
    return clone(readBookings().filter((booking) => booking.userId === user.id));
  },

  async detail(bookingId) {
    await delay(300);
    const booking = readBookings().find((entry) => entry.id === bookingId);
    if (!booking) throw new ApiError('Booking not found.', 404);
    return clone(booking);
  },

  async timeline(bookingId) {
    await delay(200);
    return {
      bookingId,
      status: 'pending_payment',
      steps: [
        { id: 'booked', label: 'Booked', isComplete: true, completedAt: new Date().toISOString() },
        { id: 'paid', label: 'Paid', isComplete: false, completedAt: null },
        { id: 'checked_in', label: 'Checked In', isComplete: false, completedAt: null },
      ],
    };
  },

  async receipt(bookingId) {
    await delay(300);
    return {
      bookingId,
      status: 'pending_payment',
      statusLabel: 'Payment pending',
      currency: 'GBP',
      totals: null,
      lineItems: [],
      payments: [],
      generatedAt: new Date().toISOString(),
    };
  },

  async messages() {
    await delay(200);
    return [];
  },

  async contractText() {
    await delay(250);
    return null;
  },

  async inspection() {
    await delay(200);
    return null;
  },

  async acknowledgeInspection(bookingId, stage) {
    await delay(300);
    return { stage, isAcknowledged: true, acknowledgedAt: new Date().toISOString(), media: [] };
  },

  async contractStatus() {
    await delay(200);
    return null;
  },

  async acceptAgreement(bookingId) {
    await delay(300);
    return { bookingId, agreementAccepted: true, agreementAcceptedAt: new Date().toISOString() };
  },

  async sendMessage(bookingId, body) {
    await delay(300);
    return { id: createId('msg'), body, isStaff: false, createdAt: new Date().toISOString() };
  },

  async notifications() {
    await delay(200);
    return [];
  },

  async cancel(bookingId, reason) {
    await delay(500);

    const bookings = readBookings();
    const index = bookings.findIndex((entry) => entry.id === bookingId);
    if (index < 0) throw new ApiError('Booking not found.', 404);

    bookings[index] = { ...bookings[index], status: 'cancelled', statusLabel: 'Cancelled', reason };
    writeBookings(bookings);
    return clone(bookings[index]);
  },

  async paymentOptions() {
    await delay(200);
    return {
      supportedCurrencies: ['GBP', 'EUR', 'USD', 'AED', 'NGN'],
      providerByCurrency: { GBP: 'stripe', EUR: 'stripe', USD: 'stripe', AED: 'stripe', NGN: 'flutterwave' },
      rates: {},
      note: '',
    };
  },

  async initiatePayment({ bookingId, currency, provider }) {
    await delay(800);

    return {
      bookingId,
      transactionId: createId('txn'),
      provider: provider ?? defaultProviderFor({ NGN: 'flutterwave' }, currency),
      amount: 0,
      currency,
      status: 'initiated',
      bookingStatus: 'pending_payment',
      providerReference: null,
      /** No hosted page in mock mode — the wizard treats this as already paid. */
      paymentUrl: null,
      lineItems: [],
      detail: 'Mock payment initiated.',
    };
  },

  async paymentStatus(bookingId) {
    await delay(400);
    return { booking_id: bookingId, status: 'confirmed', payment_status: 'succeeded' };
  },

  async startIdentity(bookingId) {
    await delay(700);
    return {
      identityCheckId: createId('idc'),
      bookingId,
      sessionId: 'vs_mock',
      clientSecret: null,
      status: 'verified',
      detail: 'Mock verification passed.',
    };
  },

  async identityStatus() {
    await delay(200);
    return { status: 'verified' };
  },

  async taxRules() {
    await delay(200);
    return [];
  },
};

/* -------------------------------------------------------------------------- */
/* Real API                                                                    */
/* -------------------------------------------------------------------------- */

const realBookings = {
  async checkAvailability({ propertyId, checkIn, checkOut, adults = 1, children = 0 }) {
    const { data } = await apiClient.post('/availability/check/', {
      property_id: propertyId,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults,
      children,
    });
    return toAvailability(data);
  },

  async create({ propertyId, checkIn, checkOut, adults, children, infants, specialRequests, isCommercial }) {
    const { data } = await apiClient.post('/bookings/', {
      property_id: propertyId,
      check_in_date: checkIn,
      check_out_date: checkOut,
      adults: Number(adults) || 1,
      children: Number(children) || 0,
      infants: Number(infants) || 0,
      is_commercial: Boolean(isCommercial),
      special_requests: specialRequests ?? '',
    });
    return toBooking(data);
  },

  async list() {
    const { data } = await apiClient.get('/guest/bookings/');
    return (data ?? []).map(toBookingSummary);
  },

  async detail(bookingId) {
    const { data } = await apiClient.get(`/bookings/${bookingId}/`);
    return toBooking(data);
  },

  async timeline(bookingId) {
    const { data } = await apiClient.get(`/bookings/${bookingId}/timeline/`);
    return toTimeline(data);
  },

  async receipt(bookingId) {
    const { data } = await apiClient.get(`/bookings/${bookingId}/receipt/`);
    return toReceipt(data);
  },

  /**
   * The agreement text for a booking, straight from the server.
   *
   * 404 means no contract has been issued — normal for a short stay, which is
   * covered by the checkbox instead — so it resolves to null rather than
   * throwing and blanking the page.
   */
  async contractText(bookingId) {
    try {
      const { data } = await apiClient.get(`/contracts/booking/${bookingId}/text/`);
      return toContractText(data);
    } catch (error) {
      if (error?.status === 404 || error?.response?.status === 404) return null;
      throw error;
    }
  },

  async contractStatus(contractId) {
    const { data } = await apiClient.get(`/contracts/${contractId}/status/`);
    return toContractStatus(data);
  },

  /**
   * Record that the guest accepted the booking agreement.
   *
   * The API refuses this for stays that need a signed contract, so the caller
   * must only offer the checkbox when `contractRequired` is false.
   */
  async acceptAgreement(bookingId) {
    const { data } = await apiClient.post(`/bookings/${bookingId}/accept-agreement/`);
    return {
      bookingId: data.booking_id,
      agreementAccepted: Boolean(data.agreement_accepted),
      agreementAcceptedAt: data.agreement_accepted_at ?? null,
    };
  },

  /**
   * What staff recorded for a stage — photos, video, and whether the guest has
   * already confirmed. Read-only: viewing never flips acknowledgement.
   *
   * 404 means staff have not started, which is a normal state rather than an
   * error, so it resolves to null.
   */
  async inspection(bookingId, stage) {
    try {
      const { data } = await apiClient.get(`/inspections/${bookingId}/${stage}/acknowledge/`);
      return toInspection(data);
    } catch (error) {
      if (error?.status === 404 || error?.response?.status === 404) return null;
      throw error;
    }
  },

  /**
   * Confirm a staff-completed check-in or check-out.
   *
   * The guest's only role in the inspection cycle: staff perform and complete
   * it, the guest acknowledges afterwards. The API rejects this until the
   * stage is complete, so the caller must gate on the timeline.
   */
  async acknowledgeInspection(bookingId, stage) {
    const { data } = await apiClient.post(`/inspections/${bookingId}/${stage}/acknowledge/`);
    return toInspection(data);
  },

  /** The support thread attached to a booking. */
  async messages(bookingId) {
    const { data } = await apiClient.get(`/messages/${bookingId}/`);
    return (data?.results ?? data ?? []).map(toMessage);
  },

  async sendMessage(bookingId, body) {
    const { data } = await apiClient.post(`/messages/${bookingId}/`, { body });
    return toMessage(data);
  },

  async notifications(guestId) {
    const { data } = await apiClient.get(`/notifications/${guestId}/`);
    return (data?.results ?? data ?? []).map(toNotification);
  },

  async cancel(bookingId, reason = '') {
    const { data } = await apiClient.post(`/bookings/${bookingId}/cancel/`, { reason });
    return data;
  },

  /**
   * Which provider handles which currency is the server's rule; the UI reads it
   * rather than restating it, so the two can never disagree.
   */
  async paymentOptions(base = 'GBP') {
    const { data } = await apiClient.get('/payments/fx-rate/', { params: { base } });
    return {
      supportedCurrencies: data.supported_currencies ?? [],
      providerByCurrency: data.payment_provider_by_currency ?? {},
      rates: data.rates ?? {},
      note: data.note ?? '',
    };
  },

  async initiatePayment({ bookingId, currency, provider }) {
    const { data } = await apiClient.post('/payments/initiate/', {
      booking_id: bookingId,
      currency,
      ...(provider ? { provider } : {}),
    });
    return toPaymentIntent(data);
  },

  /** Post-checkout reconciliation — also flips a paid booking to confirmed. */
  async paymentStatus(bookingId) {
    const { data } = await apiClient.get('/bookings/success/', { params: { booking_id: bookingId } });
    return data;
  },

  /**
   * Stripe Identity. The API returns a `client_secret` for
   * `stripe.verifyIdentity()`; a null secret means the guest is already
   * verified inside the 12-month window and no Stripe call is needed.
   */
  async startIdentity(bookingId) {
    const { data } = await apiClient.post('/kyc/short/start/', { booking_id: bookingId });
    return {
      identityCheckId: data.identity_check_id,
      bookingId: data.booking_id,
      sessionId: data.session_id,
      clientSecret: data.client_secret ?? null,
      status: data.status,
      detail: data.detail ?? '',
    };
  },

  /**
   * Country tax rules. Public, so the guest can be told *which* tax they are
   * paying rather than a bare "Taxes" line.
   */
  async taxRules() {
    const { data } = await apiClient.get('/properties/taxes/');
    return (data?.results ?? data ?? []).map((rule) => ({
      id: rule.id,
      country: rule.country,
      name: rule.name || `${rule.country} tax`,
      percentage: Number(rule.percentage) || 0,
    }));
  },

  async identityStatus(guestId) {
    const { data } = await apiClient.get(`/kyc/short/status/${guestId}/`);
    return data;
  },
};

const backend = env.useMockBookings ? mockBookings : realBookings;

export const bookingService = {
  checkAvailability: (params) => backend.checkAvailability(params),

  createBooking: (payload) => backend.create(payload),
  getBookings: () => backend.list(),
  getBooking: (bookingId) => backend.detail(bookingId),
  getTimeline: (bookingId) => backend.timeline(bookingId),
  getReceipt: (bookingId) => backend.receipt(bookingId),
  cancelBooking: (bookingId, reason) => backend.cancel(bookingId, reason),

  getPaymentOptions: (base) => backend.paymentOptions(base),
  initiatePayment: (payload) => backend.initiatePayment(payload),
  getPaymentStatus: (bookingId) => backend.paymentStatus(bookingId),

  startIdentity: (bookingId) => backend.startIdentity(bookingId),
  getIdentityStatus: (guestId) => backend.identityStatus(guestId),
  getTaxRules: () => backend.taxRules(),
  getInspection: (bookingId, stage) => backend.inspection(bookingId, stage),
  acknowledgeInspection: (bookingId, stage) => backend.acknowledgeInspection(bookingId, stage),
  getContractText: (bookingId) => backend.contractText(bookingId),
  getContractStatus: (contractId) => backend.contractStatus(contractId),
  acceptAgreement: (bookingId) => backend.acceptAgreement(bookingId),
  getMessages: (bookingId) => backend.messages(bookingId),
  sendMessage: (bookingId, body) => backend.sendMessage(bookingId, body),
  getNotifications: (guestId) => backend.notifications(guestId),
};
