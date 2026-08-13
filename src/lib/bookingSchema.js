/**
 * Translation between the API's booking vocabulary and the shape the guest UI
 * renders, mirroring what `propertySchema` does for listings.
 *
 * The API talks snake_case dates and decimal strings; the components want
 * numbers, labels and a single `pricing` object they can render without
 * re-deriving anything.
 */

/** Booking lifecycle, as the API models it. */
export const BOOKING_STATUS_LABELS = {
  pending_payment: 'Payment pending',
  pending_approval: 'Awaiting approval',
  pending_kyc: 'Verification pending',
  confirmed: 'Confirmed',
  active: 'Checked in',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

/** Which statuses mean the guest still owes us an action. */
export const OPEN_STATUSES = ['pending_payment', 'pending_approval', 'pending_kyc'];

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * The API returns the same six totals from availability, booking creation and
 * booking detail — under two different names for the grand total. Normalising
 * here means the summary panel is written once.
 */
const toPricing = (raw, currency) => {
  if (!raw) return null;

  return {
    currency,
    nightlyTotal: toNumber(raw.nightly_total) ?? 0,
    discountTotal: toNumber(raw.discount_total) ?? 0,
    cleaningFee: toNumber(raw.cleaning_fee) ?? 0,
    taxTotal: toNumber(raw.tax_total) ?? 0,
    securityDeposit: toNumber(raw.security_deposit) ?? 0,
    totalDueNow: toNumber(raw.total_due_now ?? raw.estimated_total_due_now) ?? 0,
  };
};

/** `POST /availability/check/` */
export const toAvailability = (raw) => {
  if (!raw) return null;

  return {
    propertyId: raw.property_id,
    isAvailable: Boolean(raw.available),
    checkIn: raw.check_in_date,
    checkOut: raw.check_out_date,
    nights: raw.nights ?? 0,
    currency: raw.currency,
    conflicts: raw.conflict_reasons ?? [],
    pricing: toPricing(raw.pricing_hint, raw.currency),
  };
};

/** `POST /bookings/` and `GET /bookings/{id}/` share a shape. */
export const toBooking = (raw) => {
  if (!raw) return null;

  return {
    id: raw.id,
    propertyId: raw.property_id,
    guestId: raw.guest_id,
    status: raw.status,
    statusLabel: BOOKING_STATUS_LABELS[raw.status] ?? raw.status,

    checkIn: raw.check_in_date,
    checkOut: raw.check_out_date,
    nights: raw.nights ?? 0,
    adults: raw.adults ?? 1,
    children: raw.children ?? 0,
    infants: raw.infants ?? 0,

    currency: raw.currency,
    pricing: toPricing(raw.pricing, raw.currency),

    /**
     * Compliance state. `contractRequired` is decided server-side from the
     * stay length (183 nights or more) and decides which of the two agreement
     * routes applies: a signed contract, or the checkbox the API records
     * directly on the booking.
     */
    contractRequired: Boolean(raw.contract_required),
    agreementAccepted: Boolean(raw.agreement_accepted),
    agreementAcceptedAt: raw.agreement_accepted_at ?? null,
    isCommercial: Boolean(raw.is_commercial),
    kycLevelRequired: raw.kyc_level_required ?? null,

    lineItems: (raw.line_items ?? []).map((item) => ({
      id: item.id,
      type: item.line_type,
      label: item.label,
      unitAmount: toNumber(item.unit_amount) ?? 0,
      quantity: toNumber(item.quantity) ?? 1,
      total: toNumber(item.total_amount) ?? 0,
      currency: item.currency,
    })),

    statusHistory: (raw.status_history ?? []).map((event) => ({
      from: event.from_status,
      to: event.to_status,
      toLabel: BOOKING_STATUS_LABELS[event.to_status] ?? event.to_status,
      reason: event.reason,
      triggeredBy: event.triggered_by,
      at: event.created_at,
    })),

    createdAt: raw.created_at,
    updatedAt: raw.updated_at,

    /**
     * The cancellation, pulled out of the status history so the UI does not
     * have to hunt for it. `triggered_by` is what distinguishes a guest
     * cancelling from staff cancelling on their behalf — worth showing, since
     * the two mean very different things to the person reading it.
     */
    cancellation: toCancellation(raw),
  };
};

/** The event that moved a booking to cancelled or refunded, if any. */
const toCancellation = (raw) => {
  if (!['cancelled', 'refunded'].includes(raw.status)) return null;

  const event = (raw.status_history ?? [])
    .filter((entry) => ['cancelled', 'refunded'].includes(entry.to_status))
    .pop();

  if (!event) return { at: null, reason: '', by: null, wasByGuest: null };

  const by = event.triggered_by ?? null;
  return {
    at: event.created_at ?? null,
    reason: event.reason ?? '',
    by,
    /** Compared against the booking's own guest, which the payload includes. */
    wasByGuest: by ? by === raw.guest_email || by === raw.guest_id : null,
    fromStatus: event.from_status,
    wasPaid: ['confirmed', 'active', 'completed'].includes(event.from_status),
  };
};

/**
 * `GET /bookings/{id}/timeline/` — the stay's progress, as the API models it.
 *
 * The server owns the step list and which are done, so the tracker renders
 * whatever it is given rather than hardcoding a journey that could drift.
 */
export const toTimeline = (raw) => ({
  bookingId: raw?.booking_id,
  status: raw?.status,
  steps: (raw?.steps ?? []).map((step) => ({
    id: step.step,
    label: step.label,
    isComplete: Boolean(step.completed),
    completedAt: step.completed_at ?? null,
  })),
});

/** `GET /bookings/{id}/receipt/` — what the guest downloads. */
export const toReceipt = (raw) => {
  if (!raw) return null;

  return {
    bookingId: raw.booking_id,
    status: raw.status,
    statusLabel: BOOKING_STATUS_LABELS[raw.status] ?? raw.status,
    currency: raw.currency,
    totals: toPricing(raw.totals, raw.currency),
    lineItems: (raw.line_items ?? []).map((item) => ({
      type: item.line_type,
      label: item.label,
      unitAmount: toNumber(item.unit_amount) ?? 0,
      quantity: toNumber(item.quantity) ?? 1,
      total: toNumber(item.total_amount) ?? 0,
      currency: item.currency,
    })),
    payments: (raw.payments ?? []).map((payment) => ({
      id: payment.id ?? payment.transaction_id,
      provider: payment.provider,
      status: payment.status,
      amount: toNumber(payment.amount) ?? 0,
      currency: payment.currency,
      reference: payment.provider_reference ?? null,
      createdAt: payment.created_at ?? null,
    })),
    generatedAt: raw.generated_at,
  };
};

/** `GET /messages/{bookingId}/` */
export const toMessage = (raw) => ({
  id: raw.id,
  threadId: raw.thread,
  senderId: raw.sender,
  senderEmail: raw.sender_email,
  body: raw.body,
  isStaff: Boolean(raw.is_staff ?? raw.is_support),
  readAt: raw.read_at ?? null,
  createdAt: raw.created_at ?? raw.createdAt ?? null,
});

/** `GET /notifications/{guestId}/` */
export const toNotification = (raw) => ({
  id: raw.id,
  channel: raw.channel,
  trigger: raw.trigger_key,
  title: raw.title,
  body: raw.body,
  status: raw.status,
  isRead: Boolean(raw.read_at) || raw.status === 'read',
  createdAt: raw.created_at ?? raw.createdAt ?? null,
});

/** `GET /guest/bookings/` — a slimmer row than the detail payload. */
export const toBookingSummary = (raw) => ({
  id: raw.id,
  propertyId: raw.property_id,
  propertyName: raw.property_name,
  propertyImage: raw.property_main_image ?? null,
  checkIn: raw.check_in_date,
  checkOut: raw.check_out_date,
  status: raw.status,
  statusLabel: BOOKING_STATUS_LABELS[raw.status] ?? raw.status,
  nights: raw.nights ?? 0,
  currency: raw.currency,
  createdAt: raw.created_at,

  /**
   * Present only if the list endpoint grows these fields; the dashboard falls
   * back to the detail payload when they are absent.
   */
  contractRequired: raw.contract_required ?? null,
  agreementAccepted: raw.agreement_accepted ?? null,
  agreementAcceptedAt: raw.agreement_accepted_at ?? null,
});

/**
 * `POST /payments/initiate/`.
 *
 * The endpoint reports success under the key `error` — `{"error": "Payment
 * initiated successfully."}` — so the HTTP status is the only reliable signal.
 * Treating a populated `error` key as a failure here would break every payment.
 */
export const toPaymentIntent = (raw) => ({
  bookingId: raw.booking_id,
  transactionId: raw.transaction_id,
  provider: raw.provider,
  amount: toNumber(raw.amount) ?? 0,
  currency: raw.currency,
  status: raw.status,
  bookingStatus: raw.booking_status,
  providerReference: raw.provider_reference ?? null,
  /** Stripe Checkout / Flutterwave hosted page. Absent means nothing to redirect to. */
  paymentUrl: raw.payment_url || null,
  lineItems: (raw.pricing_breakdown ?? []).map((item) => ({
    id: item.id,
    type: item.line_type,
    label: item.label,
    total: toNumber(item.total_amount) ?? 0,
    currency: item.currency,
  })),
  detail: raw.detail ?? raw.error ?? '',
});

/* -------------------------------------------------------------------------- */
/* Payment providers                                                           */
/* -------------------------------------------------------------------------- */

export const PROVIDERS = {
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    blurb: 'Card, Apple Pay and Google Pay',
    regions: 'UK, Europe, US and UAE',
  },
  flutterwave: {
    id: 'flutterwave',
    name: 'Flutterwave',
    blurb: 'Card, bank transfer and USSD',
    regions: 'Nigeria',
  },
};

/**
 * The currency→provider mapping is the server's decision, not ours: it comes
 * from `GET /payments/fx-rate/` and the initiate endpoint enforces the same
 * rule. Reading it rather than hardcoding NGN→Flutterwave means the UI can
 * never drift from what the backend will actually accept.
 *
 * @param {Record<string,string>} providerByCurrency
 * @param {string} currency
 */
export const providerOptionsFor = (providerByCurrency = {}, currency) => {
  const preferred = providerByCurrency[currency];

  return Object.values(PROVIDERS).map((provider) => ({
    ...provider,
    isDefault: provider.id === preferred,
    /**
     * Anything the server would reject for this currency is shown but
     * disabled — a greyed option explains the constraint far better than an
     * option that simply isn't there.
     */
    isDisabled: Boolean(preferred) && provider.id !== preferred,
    disabledReason: `Not available for ${currency} — use ${PROVIDERS[preferred]?.name ?? 'the default provider'}.`,
  }));
};

/** Default provider for a currency, falling back to Stripe. */
export const defaultProviderFor = (providerByCurrency = {}, currency) =>
  providerByCurrency[currency] ?? 'stripe';

/* -------------------------------------------------------------------------- */
/* Dates                                                                       */
/* -------------------------------------------------------------------------- */

/** `yyyy-MM-dd` in local time — `toISOString` would shift the day west of UTC. */
export const toDateInput = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export const addDays = (isoDate, days) => {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateInput(date);
};

export const todayIso = () => toDateInput(new Date());

/**
 * Normalise `GET /properties/{id}/availability/`.
 *
 * The endpoint answers with one row per pricing window, and each row's
 * `blockedDates` already merges admin blocks with the nights taken by live
 * bookings. Flattening them into a single set is all the calendar needs.
 *
 * Note the API blocks `[check_in, check_out)` — the night, not the day — so a
 * departure date is bookable by the next guest. The calendar inherits that.
 */
export const toAvailabilityCalendar = (rows) => {
  const list = Array.isArray(rows) ? rows : [rows].filter(Boolean);

  const blockedDates = new Set();
  list.forEach((row) => (row?.blockedDates ?? []).forEach((day) => blockedDates.add(day)));

  const windows = list
    .filter((row) => row?.startDate && row?.endDate)
    .map((row) => ({ start: row.startDate, end: row.endDate, isAvailable: row.isAvailable !== false }));

  return {
    blockedDates,
    windows,
    /** False when every window is closed — the listing takes no bookings at all. */
    isBookable: windows.length === 0 || windows.some((window) => window.isAvailable),
  };
};

/** True when any night in `[checkIn, checkOut)` is already taken. */
export const rangeHasBlockedNight = (blockedDates, checkIn, checkOut) => {
  if (!checkIn || !checkOut || !blockedDates?.size) return false;

  for (let day = checkIn; day < checkOut; day = addDays(day, 1)) {
    if (blockedDates.has(day)) return true;
  }
  return false;
};

/** The first taken night on or after `from` — where a stay must stop. */
export const nextBlockedNight = (blockedDates, from, horizonDays = 400) => {
  if (!blockedDates?.size || !from) return null;

  let day = from;
  for (let step = 0; step < horizonDays; step += 1) {
    if (blockedDates.has(day)) return day;
    day = addDays(day, 1);
  }
  return null;
};

export const nightsBetweenIso = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  return Math.max(0, Math.round((end - start) / 864e5));
};
