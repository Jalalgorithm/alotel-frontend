import { apiClient } from '@/lib/apiClient';
import { toContractStatus, toContractText } from '@/lib/agreementSchema';
import { toContractSummary, toInspection } from '@/lib/bookingSchema';
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

  /* Mock mode has no templates, so it behaves like an unpublished cell and
     the agreement step shows its built-in terms. */
  async contractText() {
    await delay(250);
    return { state: 'unpublished' };
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
    return {
      bookingId,
      agreementAccepted: true,
      agreementAcceptedAt: new Date().toISOString(),
      template: null,
      termsChanged: false,
    };
  },

  /* Signing needs Dropbox Sign; there is nothing honest to fake here. */
  async startContract() {
    await delay(300);
    throw new ApiError('Signing is not available in mock mode.', 502);
  },

  async contractSignUrl() {
    throw new ApiError('Signing is not available in mock mode.', 502);
  },

  async resendContract() {
    throw new ApiError('Signing is not available in mock mode.', 502);
  },

  async contractDocument() {
    throw new ApiError('Signing is not available in mock mode.', 502);
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
    return { booking_id: bookingId, status: 'confirmed', payment_status: 'succeeded', kind: 'property' };
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
    return { status: 'verified', verifiedAt: new Date().toISOString(), validUntil: null };
  },

  async identityAttempts() {
    await delay(150);
    return { attempts: 1, failedAttempts: 0, lastFailure: null };
  },

  async taxRules() {
    await delay(200);
    return [];
  },
};

/**
 * The machine-readable `code` the contract and verification endpoints send
 * beside their message, e.g. `no_published_template`. Components branch on
 * this rather than on wording, which the backend is free to change.
 */
export const errorCode = (error) => error?.response?.data?.code ?? error?.data?.code ?? null;

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
   * The terms for a booking, filled in by the server.
   *
   * Resolves to one of three states rather than throwing for the two that are
   * part of normal operation:
   *  - `ready` — the text to show, plus the template it came from
   *  - `unpublished` — nothing is published for this region and stay length
   *    yet, so the agreement step falls back to its built-in terms
   *  - `render_failed` — a template is published but could not be filled in
   *    for this booking, which staff have to fix
   * Anything else (not found, not the owner) still throws.
   */
  async contractText(bookingId) {
    try {
      const { data } = await apiClient.get(`/contracts/booking/${bookingId}/text/`);
      return { state: 'ready', ...toContractText(data) };
    } catch (error) {
      const code = errorCode(error);
      if (code === 'no_published_template') return { state: 'unpublished' };
      if (code === 'template_render_failed') return { state: 'render_failed' };
      throw error;
    }
  },

  async contractStatus(contractId) {
    const { data } = await apiClient.get(`/contracts/${contractId}/status/`);
    return toContractStatus(data);
  },

  /**
   * Record that the guest accepted the terms.
   *
   * Sends the template and version they were shown, so the server stores a
   * copy of exactly those words. While nothing is published for the stay, the
   * built-in terms are sent as `fallback_content` instead.
   *
   * If a newer version was published while the guest was reading, the server
   * answers 409 `terms_changed` with the new text. That is returned rather
   * than thrown, because the right response is to show the new terms, not an
   * error.
   *
   * The API refuses this for stays that need a signed contract.
   */
  async acceptAgreement(bookingId, { templateId = null, templateVersion = null, fallbackContent = null } = {}) {
    const body = templateId
      ? { template_id: templateId, template_version: templateVersion }
      : { template_id: null, fallback_content: fallbackContent };

    try {
      const { data } = await apiClient.post(`/bookings/${bookingId}/accept-agreement/`, body);
      return {
        bookingId: data.booking_id,
        agreementAccepted: Boolean(data.agreement_accepted),
        agreementAcceptedAt: data.agreement_accepted_at ?? null,
        template: data.template ?? null,
        termsChanged: false,
      };
    } catch (error) {
      if (errorCode(error) === 'terms_changed') {
        const latest = error.response?.data?.latest;
        return {
          termsChanged: true,
          latest: latest ? { state: 'ready', ...toContractText(latest) } : { state: 'unpublished' },
        };
      }
      throw error;
    }
  },

  /**
   * Create the long-stay contract, or return the one already awaiting
   * signature. Safe to call every time the guest reaches the step.
   *
   * An already-signed contract comes back as `alreadySigned` rather than an
   * error, since it means the guest can move on.
   */
  async startContract(bookingId) {
    try {
      const { data } = await apiClient.post(`/contracts/booking/${bookingId}/start/`);
      return {
        alreadySigned: false,
        contractId: data.contract_id,
        bookingId: data.booking_id,
        status: data.status,
        isEmbedded: Boolean(data.is_embedded),
        sentAt: data.sent_at ?? null,
        expiresAt: data.expires_at ?? null,
        template: data.template ?? null,
      };
    } catch (error) {
      if (errorCode(error) === 'already_signed') {
        return { alreadySigned: true, contract: toContractSummary(error.response?.data?.contract) };
      }
      throw error;
    }
  },

  /**
   * A fresh signing URL for Dropbox Sign's embedded window. These expire
   * within minutes, so this is called every time the window opens and the
   * result is never cached. Guest-only on the server.
   */
  async contractSignUrl(contractId) {
    const { data } = await apiClient.get(`/contracts/${contractId}/sign-url/`);
    return {
      signUrl: data.sign_url,
      expiresAt: data.expires_at ?? null,
      clientId: data.client_id,
      testMode: Boolean(data.test_mode),
    };
  },

  /** Email the signing link. The server allows one per contract every 10 minutes. */
  async resendContract(contractId) {
    const { data } = await apiClient.post(`/contracts/${contractId}/resend/`);
    return {
      contractId: data.contract_id,
      lastEmailedAt: data.last_emailed_at ?? null,
      emailCount: data.email_count ?? 0,
      nextAllowedAt: data.next_allowed_at ?? null,
    };
  },

  /** A short-lived link to the signed PDF. Fetched on click, never stored. */
  async contractDocument(contractId, { download = false } = {}) {
    const { data } = await apiClient.get(`/contracts/${contractId}/document/`, {
      params: download ? { download: 1 } : undefined,
    });
    return { fileUrl: data.file_url, expiresAt: data.expires_at ?? null };
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
  /**
   * Post-checkout status for whatever kind of booking this id belongs to.
   *
   * The provider sends every guest back to the same URL. `_create_stripe_checkout_session`
   * is shared between property and space payments and always builds
   * `PAYMENT_SUCCESS_URL?booking_id=<id>` — so a space booking's id arrives on
   * the property success page, where `/bookings/success/` 404s and the page
   * polls for ever.
   *
   * Rather than strand a guest who has already paid, a 404 here is retried
   * against the space endpoint. The caller is told which kind it turned out to
   * be so it can route accordingly. Fixing the redirect server-side would make
   * this fallback dead code, which is the right end state.
   */
  async paymentStatus(bookingId) {
    try {
      const { data } = await apiClient.get('/bookings/success/', { params: { booking_id: bookingId } });
      return { ...data, kind: 'property' };
    } catch (error) {
      if (error?.status !== 404) throw error;

      const { data } = await apiClient.get(`/spaces/bookings/${bookingId}/payment-status/`);
      return {
        booking_id: data.space_booking_id,
        status: data.status,
        payment_status: data.payment_status ?? null,
        kind: 'space',
      };
    }
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
      /** Stripe's hosted page — used when Stripe.js cannot open the window here. */
      url: data.url ?? null,
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

  /**
   * The guest's identity verification, as the server sees it.
   *
   * This is the source of truth for whether a guest may continue. Reading it
   * also makes the server re-check a pending session with Stripe, so polling
   * it is how a submitted check turns into a decision.
   *
   * `status`: `verified` | `pending` | `failed` | `unverified`.
   *
   * Reads the profile status rather than `/kyc/short/status/{guestId}/`: that
   * one lists every check the guest has had, while this one applies the
   * server's own rule (a verified check inside the 12-month window wins over
   * newer failed ones) and is scoped to the signed-in guest. `guestId` only
   * keys the cache.
   */
  // eslint-disable-next-line no-unused-vars
  async identityStatus(guestId) {
    const { data } = await apiClient.get('/kyc/profile/status/');
    return {
      status: data.status ?? 'unverified',
      verifiedAt: data.verified_at ?? null,
      validUntil: data.valid_until ?? null,
    };
  },

  /* ------------------------------------------------------- full KYC ----- */

  /**
   * Start the full check for a long stay.
   *
   * Distinct from `kyc/short/`, which is the Stripe Identity selfie-and-ID
   * pass a short stay needs. Past the contract threshold a stay is closer to a
   * tenancy, so it also needs anti-money-laundering, address and credit
   * checks — run by Onfido or Credas rather than Stripe.
   */
  async startFullKyc({ bookingId, provider }) {
    const { data } = await apiClient.post('/kyc/full/start/', {
      booking_id: bookingId,
      ...(provider ? { provider } : {}),
    });

    return {
      kycCheckId: data.kyc_check_id,
      bookingId: data.booking_id,
      guestId: data.guest_id,
      provider: data.provider,
      providerApplicantId: data.provider_applicant_id ?? '',
      status: data.status,
      detail: data.detail ?? '',
    };
  },

  /**
   * Every identity attempt the guest has made, newest first.
   *
   * The profile status says whether they are verified; this says what went
   * wrong and how many times. Stripe's own reason is stored per attempt as
   * `result_code` (`document_expired`, `selfie_face_mismatch`, …), which is
   * what lets a failure name the actual problem instead of saying "failed".
   */
  async identityAttempts(guestId) {
    const { data } = await apiClient.get(`/kyc/short/status/${guestId}/`);
    const checks = data?.checks ?? [];
    const failed = checks.filter((check) => check.status === 'failed');

    return {
      attempts: checks.length,
      failedAttempts: failed.length,
      lastFailure: failed[0]
        ? { code: failed[0].result_code || '', at: failed[0].updated_at ?? failed[0].created_at ?? null }
        : null,
    };
  },

  /**
   * Where the full check for one booking has got to.
   *
   * The endpoint lists every full check the guest has ever had, newest first,
   * under `checks`. Approval is per booking on the server, so this picks the
   * check for the booking asked about — a check approved for an earlier stay
   * does not clear this one. Null when there is no check for it yet.
   *
   * The sub-checks move independently, so they stay separate rather than
   * being collapsed into the overall status.
   */
  async fullKycStatus(guestId, bookingId = null) {
    const { data } = await apiClient.get(`/kyc/full/status/${guestId}/`);
    const checks = data?.checks ?? [];
    const check = bookingId ? checks.find((entry) => entry.booking_id === bookingId) : checks[0];
    if (!check) return null;

    return {
      kycCheckId: check.kyc_check_id,
      bookingId: check.booking_id,
      provider: check.provider ?? '',
      status: check.status ?? 'not_started',
      amlStatus: check.aml_status ?? 'pending',
      addressStatus: check.address_status ?? 'pending',
      creditStatus: check.credit_status ?? 'pending',
      rightToRentRequired: Boolean(check.right_to_rent_required),
      reviewNotes: check.review_notes ?? '',
      completedAt: check.completed_at ?? null,
      createdAt: check.created_at ?? null,
    };
  },

  /* ------------------------------------------------- stay extras ------- */

  /**
   * The property guidebook.
   *
   * Carries wifi credentials and the door code, so the server restricts it to
   * guests with an active or completed booking. A 404 simply means the host
   * has not written one.
   */
  async guidebook(propertyId) {
    try {
      const { data } = await apiClient.get(`/stay/guidebook/${propertyId}/`);
      return {
        wifiName: data.wifi_name ?? '',
        wifiPassword: data.wifi_password ?? '',
        smartLockCode: data.smart_lock_code ?? '',
        checkinInstructions: data.checkin_instructions ?? '',
        checkoutInstructions: data.checkout_instructions ?? '',
        houseRules: data.house_rules ?? '',
        localTips: data.local_tips ?? '',
        emergencyContacts: data.emergency_contacts ?? [],
      };
    } catch (error) {
      if (error?.status === 404) return null;
      throw error;
    }
  },

  /**
   * Ask to stay longer.
   *
   * The server refuses anything that is not active/confirmed/pending approval,
   * and anything that is not at least one night later than the current
   * check-out. The UI mirrors both so the request is not offered when it
   * cannot succeed.
   */
  async requestExtension({ bookingId, requestedCheckOut, guestNote }) {
    const { data } = await apiClient.post('/stay/request-extension/', {
      booking_id: bookingId,
      requested_check_out: requestedCheckOut,
      guest_note: guestNote ?? '',
    });
    return data;
  },

  /**
   * The post-checkout report.
   *
   * Guest-scoped (`report/mine/`) — the staff route carries an internal email
   * delivery log this one strips. 404 is the normal state until staff have
   * generated it, so it resolves to null rather than throwing.
   *
   * Damage items arrive nested here, which matters: the standalone damage
   * endpoint is staff-only, so this report is the *only* way a guest can see
   * what was charged against their deposit and why.
   */
  async checkoutReport(bookingId) {
    try {
      const { data } = await apiClient.get(`/inspections/${bookingId}/report/mine/`);

      return {
        id: data.id,
        pdfUrl: data.pdf_url || null,
        sentToGuest: Boolean(data.sent_to_guest),
        sentAt: data.sent_at ?? null,
        generatedAt: data.generated_at ?? null,
        deductionTotal: Number(data.deposit_deduction_total) || 0,
        damageItems: (data.damage_items ?? []).map((item) => ({
          id: item.id,
          roomArea: item.room_area,
          description: item.description ?? '',
          severity: item.severity,
          photo: item.photo || null,
          estimatedCost: Number(item.estimated_cost) || 0,
          /* What was actually agreed, which may differ from the estimate. */
          approvedCost: item.approved_cost == null ? null : Number(item.approved_cost),
          currency: item.currency ?? 'GBP',
          deductFromDeposit: Boolean(item.deduct_from_deposit),
          loggedAt: item.logged_at ?? null,
        })),
      };
    } catch (error) {
      if (error?.status === 404) return null;
      throw error;
    }
  },

  /**
   * The security deposit's ledger.
   *
   * Readable by the booking's own guest as of the latest backend change — it
   * was Super-Admin-only before, which is why a guest could see the deposit
   * *amount* on their invoice but never learn whether it had been released.
   *
   * 404 means no deposit was taken for this booking, which is a normal state
   * rather than an error.
   */
  async deposit(bookingId) {
    try {
      const { data } = await apiClient.get(`/deposits/${bookingId}/`);
      const ledger = data.ledger ?? data;

      return {
        id: ledger.id,
        method: ledger.collection_method,
        status: ledger.status,
        currency: ledger.currency ?? 'GBP',
        authorized: Number(ledger.amount_authorized) || 0,
        captured: Number(ledger.amount_captured) || 0,
        deducted: Number(ledger.amount_deducted) || 0,
        released: Number(ledger.amount_released) || 0,
        releaseDueAt: ledger.release_due_at ?? null,
        releasedAt: ledger.released_at ?? null,
        claims: (data.claims ?? []).map((claim) => ({
          id: claim.id,
          amount: Number(claim.amount) || 0,
          reason: claim.reason ?? '',
          status: claim.status,
          createdAt: claim.created_at ?? null,
        })),
      };
    } catch (error) {
      if (error?.status === 404) return null;
      throw error;
    }
  },

  /** Marks the thread read. Note the verb: the endpoint is PUT, not POST. */
  async markMessagesRead(bookingId) {
    const { data } = await apiClient.put(`/messages/${bookingId}/read/`);
    return data;
  },

  /* ------------------------------------------------------- reviews ------ */

  /** Public — anyone can read a listing's reviews. */
  async reviews(listingId) {
    const { data } = await apiClient.get(`/reviews/${listingId}/`);
    return (data?.results ?? data ?? []).map((review) => ({
      id: review.id,
      bookingId: review.booking,
      propertyId: review.property,
      propertyName: review.property_name ?? '',
      guestEmail: review.guest_email ?? '',
      ratings: {
        cleanliness: review.rating_cleanliness,
        accuracy: review.rating_accuracy,
        location: review.rating_location,
        value: review.rating_value,
        communication: review.rating_communication,
      },
      overall: review.rating_overall,
      body: review.body ?? '',
      isFlagged: Boolean(review.is_flagged),
      createdAt: review.created_at,
    }));
  },

  /**
   * Leave a review.
   *
   * Five sub-ratings plus an overall, which is why the form is a set of rows
   * rather than one star control — the API models them separately and a single
   * score would have to be invented to fill the rest.
   */
  async createReview({ bookingId, ratings, overall, body }) {
    const { data } = await apiClient.post('/reviews/', {
      /* `booking_id`, not `booking`: the view reads `booking_id` from the body
         to find the booking, then fills in `booking`, `property` and `guest`
         itself from it. Sending `booking` alone looked up id `None` and came
         back "Booking not found." */
      booking_id: bookingId,
      rating_cleanliness: ratings.cleanliness,
      rating_accuracy: ratings.accuracy,
      rating_location: ratings.location,
      rating_value: ratings.value,
      rating_communication: ratings.communication,
      rating_overall: overall,
      body,
    });
    return data;
  },

  /** Records the referencing fee against the check once it has been paid. */
  async payReferencingFee({ bookingId, amount, currency, provider, providerReference }) {
    const { data } = await apiClient.post('/kyc/full/referencing-fee/', {
      booking_id: bookingId,
      amount: String(amount),
      currency,
      provider,
      ...(providerReference ? { provider_reference: providerReference } : {}),
    });

    return { kycCheckId: data.kyc_check_id, referenceFeeId: data.reference_fee_id, detail: data.detail ?? '' };
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
  getIdentityAttempts: (guestId) => backend.identityAttempts(guestId),

  /* Full KYC has no mock half — a faked compliance pass is worse than none. */
  startFullKyc: (payload) => realBookings.startFullKyc(payload),
  getFullKycStatus: (guestId, bookingId) => realBookings.fullKycStatus(guestId, bookingId),
  payReferencingFee: (payload) => realBookings.payReferencingFee(payload),

  /* Stay extras and reviews — real API only; there is nothing useful to mock. */
  getGuidebook: (propertyId) => realBookings.guidebook(propertyId),
  requestExtension: (payload) => realBookings.requestExtension(payload),
  getCheckoutReport: (bookingId) => realBookings.checkoutReport(bookingId),
  getDeposit: (bookingId) => realBookings.deposit(bookingId),
  markMessagesRead: (bookingId) => realBookings.markMessagesRead(bookingId),
  getReviews: (listingId) => realBookings.reviews(listingId),
  createReview: (payload) => realBookings.createReview(payload),
  getTaxRules: () => backend.taxRules(),
  getInspection: (bookingId, stage) => backend.inspection(bookingId, stage),
  acknowledgeInspection: (bookingId, stage) => backend.acknowledgeInspection(bookingId, stage),
  getContractText: (bookingId) => backend.contractText(bookingId),
  getContractStatus: (contractId) => backend.contractStatus(contractId),
  acceptAgreement: (bookingId, terms) => backend.acceptAgreement(bookingId, terms),
  startContract: (bookingId) => backend.startContract(bookingId),
  getContractSignUrl: (contractId) => backend.contractSignUrl(contractId),
  resendContract: (contractId) => backend.resendContract(contractId),
  getContractDocument: (contractId, options) => backend.contractDocument(contractId, options),
  getMessages: (bookingId) => backend.messages(bookingId),
  sendMessage: (bookingId, body) => backend.sendMessage(bookingId, body),
  getNotifications: (guestId) => backend.notifications(guestId),
};
