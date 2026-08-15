import { apiClient } from '@/lib/apiClient';
import { env } from '@/lib/env';
import { ApiError } from '@/utils/errors';
import { clone, createId, delay } from '@/lib/mock/utils';
import { jsonStorage } from '@/lib/storage';
import { spaceBookings, spaces } from '@/lib/mock/spaces';
import {
  BLOCKING_STATUSES,
  toMinutes,
  hoursForDay,
  isBlackout,
  openWindows,
  quoteFor,
  toSpace,
  toSpaceBooking,
} from '@/lib/spaceSchema';

/**
 * Spaces — discovery, availability, quoting and booking.
 *
 * Mirrors every other service here: one mock implementation, one real one, the
 * same surface. The difference is that the real half has nothing to talk to
 * yet — there is no Spaces app in the backend — so `env.useMockSpaces` defaults
 * to `true` and the real paths below are written to the briefing's contract,
 * ready for the day it lands.
 */

const KEY = 'alotel.mock.spaceBookings';

const readBookings = () => {
  const stored = jsonStorage.read(KEY, null);
  if (stored) return stored;
  const seeded = clone(spaceBookings);
  jsonStorage.write(KEY, seeded);
  return seeded;
};

const writeBookings = (rows) => jsonStorage.write(KEY, rows);

const findSpace = (id) => spaces.find((space) => space.id === id);

const matches = (space, filters) => {
  const { query, city, category, minCapacity, maxPrice } = filters;

  if (query) {
    const haystack = `${space.title} ${space.location.city} ${space.location.country} ${space.category}`.toLowerCase();
    if (!haystack.includes(query.toLowerCase().trim())) return false;
  }
  if (city && space.location.city !== city) return false;
  if (category && category !== 'All' && space.category !== category) return false;

  if (minCapacity) {
    const best = Math.max(0, ...space.layouts.map((layout) => layout.max_capacity));
    if (best < Number(minCapacity)) return false;
  }
  if (maxPrice && space.base_rate > Number(maxPrice)) return false;

  return true;
};

const mockSpaces = {
  async list(filters = {}) {
    await delay(400);
    const found = spaces.filter((space) => matches(space, filters));
    return { items: clone(found).map(toSpace), total: found.length };
  },

  async detail(id) {
    await delay(350);
    const space = findSpace(id);
    if (!space) throw new ApiError('We could not find that space.', 404);
    return toSpace(clone(space));
  },

  /**
   * What is bookable on one date.
   *
   * Computed live against current bookings, opening hours and blackout dates —
   * never cached. A stale availability response is how two guests end up in the
   * same room at the same time.
   */
  async availability(id, date) {
    await delay(250);

    const raw = findSpace(id);
    if (!raw) throw new ApiError('We could not find that space.', 404);

    const space = toSpace(clone(raw));
    const hours = hoursForDay(space, date);

    if (!hours || isBlackout(space, date)) {
      return {
        date,
        operatingHours: null,
        bookedWindows: [],
        openWindows: [],
        closedReason: isBlackout(space, date)
          ? space.blackoutDates.find((row) => row.date === date)?.reason || 'Closed on this date'
          : 'Closed on this day of the week',
      };
    }

    const booked = readBookings()
      .filter((booking) => booking.space_id === id && BLOCKING_STATUSES.includes(booking.status))
      .filter((booking) => booking.start_datetime.slice(0, 10) === date)
      .map((booking) => ({
        start: booking.start_datetime.slice(11, 16),
        end: booking.end_datetime.slice(11, 16),
      }));

    return {
      date,
      operatingHours: { open: hours.open, close: hours.close },
      bookedWindows: booked,
      openWindows: openWindows(hours.open, hours.close, booked),
      closedReason: null,
    };
  },

  /**
   * A price preview.
   *
   * Over-capacity returns a flag and no price rather than an error, so the form
   * can block submission itself instead of letting a guest fill everything in
   * and be rejected at the end.
   */
  async quote(id, selection) {
    await delay(300);

    const space = toSpace(clone(findSpace(id)));
    const layout = space.layouts.find((entry) => entry.id === selection.layoutId);

    /* Half- and full-day slots are relative to this host's opening hours. */
    const hours = hoursForDay(space, selection.date);
    const dayMinutes = hours ? toMinutes(hours.close) - toMinutes(hours.open) : null;

    if (layout && selection.guestCount > layout.maxCapacity) {
      return { capacityCheck: 'exceeds_layout', layout, taxLineItems: [], totalPrice: 0 };
    }

    const { basePrice, addonsPrice, slots, minutes } = quoteFor({
      space,
      startTime: selection.startTime,
      endTime: selection.endTime,
      guestCount: selection.guestCount,
      addons: selection.addons,
      dayMinutes,
    });

    /*
     * Tax comes from the same engine Properties use — a Space's location is
     * just another input. Until the Spaces backend exists there is nothing to
     * call, so this is shown as an explicit estimate rather than being quietly
     * folded into the total as though it were authoritative.
     */
    const taxLineItems = [{ label: 'Estimated tax', amount: Math.round((basePrice + addonsPrice) * 0.075 * 100) / 100 }];
    const taxTotal = taxLineItems.reduce((sum, line) => sum + line.amount, 0);

    return {
      capacityCheck: 'ok',
      layout,
      slots,
      minutes,
      basePrice,
      addonsPrice,
      taxLineItems,
      taxTotal,
      isTaxEstimated: true,
      totalPrice: basePrice + addonsPrice + taxTotal,
      currency: space.currency,
    };
  },

  async book(id, selection) {
    await delay(600);

    const raw = findSpace(id);
    const space = toSpace(clone(raw));
    const priced = await mockSpaces.quote(id, selection);

    if (priced.capacityCheck !== 'ok') {
      throw new ApiError('That layout does not hold this many guests.', 400);
    }

    const isRequest = space.bookingMode === 'request';

    const booking = {
      id: createId('sb'),
      space_id: id,
      space_name: space.name,
      guest_name: selection.guestName ?? 'You',
      start_datetime: `${selection.date}T${selection.startTime}:00`,
      end_datetime: `${selection.date}T${selection.endTime}:00`,
      layout_id: selection.layoutId,
      layout_name: priced.layout?.name ?? '',
      guest_count: selection.guestCount,
      status: isRequest ? 'pending_host_approval' : 'confirmed',
      base_price: priced.basePrice,
      addons_price: priced.addonsPrice,
      tax_total: priced.taxTotal,
      total_price: priced.totalPrice,
      currency: space.currency,
      approval_due_at: isRequest
        ? new Date(Date.now() + space.approvalExpiryHours * 3600 * 1000).toISOString()
        : null,
      created_at: new Date().toISOString(),
      /* Prices are snapshotted so a later catalogue change cannot rewrite what
         the guest agreed to pay. */
      addons: (selection.addons ?? []).map((line) => {
        const addon = space.addons.find((entry) => entry.id === line.addonId);
        return { addon_id: line.addonId, name: addon?.name ?? '', qty: line.qty, price_at_booking: addon?.price ?? 0 };
      }),
    };

    writeBookings([booking, ...readBookings()]);
    return toSpaceBooking(booking);
  },

  /** The mock has no payment provider; bookings are simply already paid. */
  async initiatePayment() {
    await delay(200);
    return { paymentUrl: null, status: 'succeeded', bookingStatus: 'confirmed' };
  },

  async myBookings() {
    await delay(300);
    return readBookings().map(toSpaceBooking);
  },

  async booking(id) {
    await delay(250);
    const found = readBookings().find((booking) => booking.id === id);
    if (!found) throw new ApiError('We could not find that booking.', 404);
    return toSpaceBooking(found);
  },

  async cancel(id) {
    await delay(400);
    const rows = readBookings().map((booking) =>
      booking.id === id ? { ...booking, status: 'cancelled' } : booking,
    );
    writeBookings(rows);
    return toSpaceBooking(rows.find((booking) => booking.id === id));
  },
};

/**
 * The real API.
 *
 * Paths verified against the shipped `spaces` app rather than the briefing —
 * they differ in several places (host creation lives under `/spaces/admin/`,
 * the guest cannot list bookings at all, and creating a booking returns a
 * payment envelope rather than the booking itself).
 */
const realSpaces = {
  async list(filters = {}) {
    const params = {};
    if (filters.query) params.city = filters.query;
    if (filters.city) params.city = filters.city;
    if (filters.minCapacity) params.min_capacity = filters.minCapacity;
    if (filters.date) params.date = filters.date;
    /* Matches `Space.space_type`, not the add-on catalogue's categories. */
    if (filters.category && filters.category !== 'All') params.category = filters.category;

    /* Plain array, not a paginated envelope. */
    const { data } = await apiClient.get('/spaces/search/', { params });
    const items = (data?.results ?? data ?? []).map(toSpace);

    /*
     * `city` is the only text filter the API offers, and it matches the city
     * column alone. A guest typing "boardroom" means the kind of room, so the
     * rest of the query is applied here rather than silently returning nothing.
     */
    const query = filters.query?.toLowerCase().trim();
    const matched = query
      ? items.filter((space) =>
          `${space.name} ${space.city} ${space.country}`.toLowerCase().includes(query),
        )
      : items;

    return { items: matched, total: matched.length };
  },

  async detail(id) {
    const { data } = await apiClient.get(`/spaces/${id}/`);
    return toSpace(data);
  },

  /**
   * The API distinguishes two kinds of closed, and so does this: a blackout is
   * a one-off the host declared, while no operating hours means the space
   * never opens that weekday. Telling a guest the wrong one sends them looking
   * on a day that will never work.
   */
  async availability(id, date) {
    const { data } = await apiClient.get(`/spaces/${id}/availability/`, { params: { date } });

    const hours = data?.operating_hours ?? null;
    return {
      date: data?.date ?? date,
      operatingHours: hours ? { open: hours.open.slice(0, 5), close: hours.close.slice(0, 5) } : null,
      bookedWindows: data?.booked_windows ?? [],
      openWindows: data?.open_windows ?? [],
      closedReason: hours
        ? null
        : data?.blacked_out
          ? 'Closed on this date'
          : 'Closed on this day of the week',
    };
  },

  async quote(id, selection) {
    const { data } = await apiClient.post(`/spaces/${id}/quote/`, {
      start_datetime: `${selection.date}T${selection.startTime}:00`,
      end_datetime: `${selection.date}T${selection.endTime}:00`,
      layout_id: selection.layoutId,
      guest_count: selection.guestCount,
      addons: (selection.addons ?? []).map((line) => ({ addon_id: line.addonId, qty: line.qty })),
    });

    /* Every money field is a DecimalField string — coerce before arithmetic. */
    const taxLineItems = (data?.tax_line_items ?? []).map((line) => ({
      label: line.label,
      amount: Number(line.amount) || 0,
    }));

    return {
      capacityCheck: data?.capacity_check ?? 'ok',
      basePrice: Number(data?.base_price) || 0,
      addonsPrice: Number(data?.addons_price) || 0,
      taxLineItems,
      taxTotal: taxLineItems.reduce((sum, line) => sum + line.amount, 0),
      /* Real figures from the tax engine, not an estimate. */
      isTaxEstimated: false,
      totalPrice: Number(data?.total_price) || 0,
      currency: data?.currency ?? 'GBP',
    };
  },

  /**
   * Create the booking.
   *
   * Every booking starts as `pending_payment` regardless of booking mode — the
   * instant/request split happens only once payment clears. The response is a
   * payment envelope, so the booking is re-read afterwards to get a consistent
   * shape for the caller.
   */
  async book(id, selection) {
    const { data } = await apiClient.post(`/spaces/${id}/bookings/`, {
      start_datetime: `${selection.date}T${selection.startTime}:00`,
      end_datetime: `${selection.date}T${selection.endTime}:00`,
      layout_id: selection.layoutId,
      guest_count: selection.guestCount,
      addons: (selection.addons ?? []).map((line) => ({ addon_id: line.addonId, qty: line.qty })),
    });

    return toSpaceBooking(data);
  },

  /** Exchanges a booking for a Stripe Checkout URL to redirect to. */
  async initiatePayment({ bookingId, currency }) {
    const { data } = await apiClient.post('/spaces/bookings/payments/initiate/', {
      space_booking_id: bookingId,
      currency,
    });

    return {
      transactionId: data?.transaction_id,
      provider: data?.provider,
      paymentUrl: data?.payment_url ?? null,
      status: data?.status,
      bookingStatus: data?.booking_status,
    };
  },

  /**
   * The guest's own space bookings.
   *
   * Note the separate path: `GET /spaces/bookings/` is the host approval queue
   * and is Level 1/2 only, so a guest calling it gets a 403 rather than an
   * empty list. `/mine/` is the guest-scoped equivalent.
   */
  async myBookings() {
    const { data } = await apiClient.get('/spaces/bookings/mine/');
    return (data?.results ?? data ?? []).map(toSpaceBooking);
  },

  /** A guest *can* read their own booking by id, just not list them. */
  async booking(id) {
    const { data } = await apiClient.get(`/spaces/bookings/${id}/`);
    return toSpaceBooking(data);
  },

  /**
   * Cancel your own booking.
   *
   * The server refuses once the booking has started, and on any status that is
   * not cancellable. The UI hides the button in those cases rather than relying
   * on the error — but the guard stays server-side, which is where it belongs.
   */
  async cancel(id) {
    const { data } = await apiClient.patch(`/spaces/bookings/${id}/cancel/`);
    return toSpaceBooking(data);
  },
};

const backend = env.useMockSpaces ? mockSpaces : realSpaces;

export const spaceService = {
  getSpaces: (filters) => backend.list(filters),
  initiateSpacePayment: (payload) => backend.initiatePayment?.(payload) ?? null,
  getSpace: (id) => backend.detail(id),
  getAvailability: (id, date) => backend.availability(id, date),
  getQuote: (id, selection) => backend.quote(id, selection),
  bookSpace: (id, selection) => backend.book(id, selection),
  getMySpaceBookings: () => backend.myBookings(),
  getSpaceBooking: (id) => backend.booking(id),
  cancelSpaceBooking: (id) => backend.cancel(id),
};
