import { env } from '@/lib/env';

/**
 * Spaces vocabulary — meeting rooms, boardrooms, event halls.
 *
 * A Space is close to a Property in ownership and payment plumbing but is
 * booked completely differently: a Property blocks whole nights, a Space blocks
 * a *window inside a day*, and the same room can take several bookings in one
 * day as long as the windows do not overlap. Everything below exists to keep
 * that distinction honest.
 *
 * Nothing here is hardcoded from any one venue. Layout names, add-on categories
 * and the slot unit are all host-authored — the samples informed the shape of
 * the model, never its contents. That is why there is no `LAYOUTS` enum and no
 * fixed add-on category list.
 *
 * NOTE: there is no Spaces backend yet. This mirrors the contract in the Spaces
 * briefing so the screens can switch to the real API by flipping
 * `env.useMockSpaces`; every field name here is the one that contract specifies.
 */

/** How a host sells time. `base_rate` buys exactly one of these. */
export const SLOT_UNITS = [
  { value: 'hour', label: 'Per hour', short: 'hour', minutes: 60 },
  { value: 'half_day', label: 'Per half day', short: 'half-day', minutes: 240 },
  { value: 'full_day', label: 'Per full day', short: 'day', minutes: 480 },
  { value: 'custom_minutes', label: 'Custom', short: 'slot', minutes: null },
];

export const BOOKING_MODES = [
  { value: 'instant', label: 'Instant booking' },
  { value: 'request', label: 'Request to book' },
];

export const ADDON_UNIT_TYPES = [
  { value: 'flat', label: 'Flat fee' },
  { value: 'per_person', label: 'Per person' },
  { value: 'per_hour', label: 'Per hour' },
];

export const SPACE_BOOKING_STATUSES = {
  /* A booking exists but is not paid for. The API creates every booking in
     this state; instant/request branching happens only after payment clears. */
  pending_payment: { label: 'Awaiting payment', tone: 'warn' },
  pending_host_approval: { label: 'Awaiting approval', tone: 'warn' },
  confirmed: { label: 'Confirmed', tone: 'ok' },
  declined: { label: 'Declined', tone: 'danger' },
  expired: { label: 'Expired', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  completed: { label: 'Completed', tone: 'ok' },
};

/** Statuses that still hold a time window against the calendar. */
export const BLOCKING_STATUSES = ['pending_payment', 'pending_host_approval', 'confirmed', 'completed'];

/**
 * Weekday names indexed the way the **API** indexes them: 0 = Monday.
 *
 * This is the single most dangerous mismatch in this module. Python's
 * `date.weekday()` starts the week on Monday; JavaScript's `Date.getDay()`
 * starts it on Sunday. Reading one with the other's index shifts every opening
 * hours row by a day — silently, and only visibly wrong to whoever turns up on
 * the day the space is shut. Convert at the boundary with `jsDayToApiDay`,
 * never by hand.
 */
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** JS `getDay()` (0 = Sunday) -> API `day_of_week` (0 = Monday). */
export const jsDayToApiDay = (jsDay) => (jsDay + 6) % 7;

/**
 * Resolve a media path against the API origin.
 *
 * `SpaceImageSerializer` returns a *relative* path (`/media/space_media/x.png`)
 * because it is not given `request` in its serializer context, while the
 * property serializers return absolute URLs. A relative path resolves against
 * the *frontend* origin, so the image 404s on localhost and would point at the
 * Vercel domain in production.
 *
 * Absolute URLs pass through untouched, so this keeps working the day the
 * backend starts sending them.
 */
export const mediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;

  try {
    return new URL(path, new URL(env.apiUrl, window.location.origin).origin).toString();
  } catch {
    return path;
  }
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Spaces carry no currency field; a booking gets one server-side from the
 * market. Mirrors the mapping Properties use so a price never renders in the
 * wrong symbol while a space is still being quoted.
 */
const LOCATION_CURRENCY = { UK: 'GBP', Spain: 'EUR', US: 'USD', 'UAE Dubai': 'AED', Nigeria: 'NGN' };
export const currencyForLocation = (location) => LOCATION_CURRENCY[location] ?? 'GBP';

const unitOf = (value) => SLOT_UNITS.find((entry) => entry.value === value) ?? SLOT_UNITS[0];

/**
 * How many minutes one slot is worth.
 *
 * `dayMinutes` matters more than it looks. A "half day" is half of *this
 * host's* operating day, not a fixed four hours — a room open 08:00–20:00 sells
 * two six-hour halves, and billing those against a 240-minute constant charged
 * two slots for one morning. Pass the day length whenever it is known; the
 * constants stay as the fallback for when it is not.
 */
export const slotMinutes = (space, dayMinutes = null) => {
  if (space.slotUnit === 'custom_minutes') return space.slotUnitMinutes || 60;
  if (dayMinutes) {
    if (space.slotUnit === 'half_day') return Math.round(dayMinutes / 2);
    if (space.slotUnit === 'full_day') return dayMinutes;
  }
  return unitOf(space.slotUnit).minutes;
};

/**
 * "from £700 / half-day" — never "/night".
 *
 * A Space priced by the hour and one priced by the day are different products,
 * and flattening both onto a nightly rate (the Property habit) would misprice
 * them by an order of magnitude in the guest's head.
 */
export const rateSuffix = (space) =>
  space.slotUnit === 'custom_minutes'
    ? `${space.slotUnitMinutes || 60} min`
    : unitOf(space.slotUnit).short;

/* -------------------------------------------------------------------------- */
/* Time helpers                                                                */
/* -------------------------------------------------------------------------- */

/** "09:00" -> 540. */
export const toMinutes = (time) => {
  const [hours, minutes] = String(time ?? '0:0').split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

/** 540 -> "09:00". */
export const toTimeString = (minutes) => {
  const whole = Math.max(0, Math.round(minutes));
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
};

/** "09:00" -> "9:00 am", for reading rather than for inputs. */
export const formatTime = (time) => {
  const total = toMinutes(time);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const suffix = hours >= 12 ? 'pm' : 'am';
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

/**
 * Subtract booked windows from opening hours to get what is actually bookable.
 *
 * The server computes this too (§A.3.2), but the guest picker needs it locally
 * as the selection moves — round-tripping on every drag would make the control
 * feel broken. Same algorithm, so the two cannot disagree.
 */
export const openWindows = (open, close, booked = []) => {
  const windows = [];
  let cursor = toMinutes(open);
  const end = toMinutes(close);

  const sorted = [...booked]
    .map((slot) => ({ start: toMinutes(slot.start), end: toMinutes(slot.end) }))
    .sort((a, b) => a.start - b.start);

  for (const slot of sorted) {
    if (slot.start > cursor) windows.push({ start: toTimeString(cursor), end: toTimeString(slot.start) });
    cursor = Math.max(cursor, slot.end);
  }

  if (cursor < end) windows.push({ start: toTimeString(cursor), end: toTimeString(end) });
  return windows;
};

/** Does [start, end) sit entirely inside one open window? */
export const isWindowFree = (start, end, windows = []) => {
  const from = toMinutes(start);
  const to = toMinutes(end);
  if (to <= from) return false;

  return windows.some((window) => toMinutes(window.start) <= from && toMinutes(window.end) >= to);
};

/* -------------------------------------------------------------------------- */
/* Normalisers                                                                 */
/* -------------------------------------------------------------------------- */

export const toLayout = (raw) => ({
  id: raw.id,
  name: raw.layout_name ?? raw.name ?? '',
  maxCapacity: raw.max_capacity ?? 0,
});

export const toAddon = (raw) => ({
  id: raw.id,
  category: raw.category ?? 'Other',
  name: raw.name ?? '',
  price: toNumber(raw.price),
  unitType: raw.unit_type ?? 'flat',
  minQty: raw.min_qty ?? 0,
  maxQty: raw.max_qty ?? null,
});

export const toSpace = (raw) => ({
  id: raw.id,
  name: raw.title ?? '',
  description: raw.description ?? '',
  /*
   * Ordered by the host's own `order` column, not upload time. The serializer
   * field is `image`, not `file` — the property gallery uses `file`, and the
   * two are easy to confuse when moving between them.
   */
  images: (raw.images ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((row) => ({ id: row.id, url: mediaUrl(row.image), caption: row.caption ?? '', order: row.order ?? 0 })),
  city: raw.city ?? '',
  state: raw.state ?? '',
  country: raw.country ?? '',
  address: raw.address ?? '',
  coordinates: raw.coordinates ?? null,
  /** The market, which is also what decides currency. */
  location: raw.location ?? null,
  currency: currencyForLocation(raw.location ?? raw.country),
  sizeSqm: raw.size_sqm == null ? null : toNumber(raw.size_sqm),
  baseRate: toNumber(raw.base_rate),
  slotUnit: raw.slot_unit ?? 'hour',
  slotUnitMinutes: raw.slot_unit_minutes ?? null,
  minSlots: raw.min_slots ?? 1,
  maxSlots: raw.max_slots ?? null,
  bookingMode: raw.booking_mode ?? 'instant',
  approvalExpiryHours: raw.approval_expiry_hours ?? 24,
  /*
   * Host-authored free text ("Boardroom", "Event Hall"). Distinct from
   * `SpaceAddon.category`, which is the add-on catalogue's grouping — search's
   * `?category=` parameter matches this field, not that one.
   */
  category: raw.space_type ?? '',
  status: raw.status ?? 'draft',
  publishedAt: raw.published_at ?? null,
  /** Computed server-side across every layout — no need to derive it here. */
  maxCapacity: raw.max_capacity ?? null,
  layouts: (raw.layouts ?? []).map(toLayout),
  addons: (raw.addons ?? []).map(toAddon),
  operatingHours: (raw.operating_hours ?? []).map((row) => ({
    dayOfWeek: row.day_of_week,
    open: (row.open_time ?? '').slice(0, 5),
    close: (row.close_time ?? '').slice(0, 5),
  })),
  /** One-off closures the host has declared. */
  blackoutDates: (raw.blackout_dates ?? []).map((row) => ({ date: row.date, reason: row.reason ?? '' })),
});

export const toSpaceBooking = (raw) => {
  /* Datetimes arrive as full ISO strings; the UI works in date + wall clock. */
  const start = raw.start_datetime ?? '';
  const end = raw.end_datetime ?? '';

  return {
    id: raw.id,
    /* Create returns `space_id`; reads return `space`. Same value, two names. */
    spaceId: raw.space ?? raw.space_id ?? null,
    guestId: raw.guest ?? null,
    layoutId: raw.layout ?? raw.layout_id ?? null,
    /*
     * The serializer returns bare ids for space, layout and guest. Callers that
     * can resolve them pass the names in; the rest degrade to a reference
     * rather than printing a raw UUID at a reader.
     */
    spaceName: raw.space_title ?? raw.space_name ?? '',
    layoutName: raw.layout_name ?? '',
    guestName: raw.guest_name ?? '',
    startDateTime: start,
    endDateTime: end,
    date: start.slice(0, 10),
    startTime: start.slice(11, 16),
    endTime: end.slice(11, 16),
    guestCount: raw.guest_count ?? 0,
    status: raw.status,
    basePrice: toNumber(raw.base_price),
    addonsPrice: toNumber(raw.addons_price),
    taxTotal: toNumber(raw.tax_total),
    totalPrice: toNumber(raw.total_price),
    currency: raw.currency ?? 'GBP',
    declineReason: raw.decline_reason ?? '',
    /** `approval_due_at` on the wire — null for instant-book spaces. */
    expiresAt: raw.approval_due_at ?? null,
    createdAt: raw.created_at,
    addons: (raw.addon_lines ?? raw.addons ?? []).map((row) => ({
      addonId: row.addon ?? row.addon_id,
      name: row.addon_name ?? row.name ?? '',
      qty: row.qty ?? 0,
      priceAtBooking: toNumber(row.price_at_booking),
    })),
    /* Present only on the create response — the next step is paying. */
    payment: raw.payment ?? null,
  };
};

/** The opening hours for one weekday, or null when the space is shut. */
export const hoursForDay = (space, date) => {
  const day = jsDayToApiDay(new Date(`${date}T00:00:00`).getDay());
  return space.operatingHours.find((row) => row.dayOfWeek === day) ?? null;
};

export const isBlackout = (space, date) => space.blackoutDates.some((row) => row.date === date);

/**
 * Price a selection the way §A.3.3 does.
 *
 * Slots are billed rounded **up** — a host selling half-days does not sell
 * three-quarters of one. Add-ons follow their own unit, which is why
 * `per_person` multiplies by the head count and `per_hour` by the duration.
 */
export const quoteFor = ({ space, startTime, endTime, guestCount, addons = [], dayMinutes = null }) => {
  const minutes = Math.max(0, toMinutes(endTime) - toMinutes(startTime));
  const perSlot = slotMinutes(space, dayMinutes) || 60;
  const slots = Math.max(space.minSlots || 1, Math.ceil(minutes / perSlot));

  const basePrice = slots * space.baseRate;

  const addonsPrice = addons.reduce((total, line) => {
    const addon = space.addons.find((entry) => entry.id === line.addonId);
    if (!addon) return total;

    const quantity = line.qty ?? 0;
    if (addon.unitType === 'per_person') return total + addon.price * Math.max(quantity, 0);
    if (addon.unitType === 'per_hour') return total + addon.price * (minutes / 60) * Math.max(quantity, 1);
    return total + addon.price * Math.max(quantity, 0);
  }, 0);

  return { minutes, slots, basePrice, addonsPrice, subtotal: basePrice + addonsPrice, guestCount };
};

/** Capacity is checked before submission, never after — §A.3.3. */
export const capacityCheck = (layout, guestCount) => {
  if (!layout) return 'no_layout';
  return guestCount > layout.maxCapacity ? 'exceeds_layout' : 'ok';
};
