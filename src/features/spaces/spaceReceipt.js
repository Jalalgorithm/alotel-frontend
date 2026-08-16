import { printReceipt } from '@/features/booking/receiptDocument';
import { formatDate } from '@/utils/format';
import { formatTime, rateSuffix } from '@/lib/spaceSchema';

/**
 * A receipt for a space booking.
 *
 * There is no `/spaces/bookings/{id}/receipt/` endpoint, but the booking
 * already carries every figure one needs — base, add-ons, tax and total, plus
 * the add-on lines at the price they were booked at. So the receipt is
 * assembled here into the same shape the property receipt endpoint returns,
 * and rendered by the same template.
 *
 * Sharing the template rather than writing a second one is deliberate: a guest
 * who books a residence and a space should be able to file both without
 * noticing they came from different code.
 *
 * A server-rendered receipt would still be better — this one cannot show the
 * payment provider's reference, because the booking payload does not carry the
 * transaction. That gap is on the pending list rather than papered over.
 */

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );

/** Statuses where money has actually settled. */
const SETTLED = ['confirmed', 'completed'];

export const toSpaceReceipt = (booking, space) => {
  const lineItems = [
    {
      label: space ? `${space.name} — ${rateSuffix(space)}` : 'Space hire',
      unitAmount: booking.basePrice,
      quantity: 1,
      total: booking.basePrice,
      currency: booking.currency,
    },
    ...booking.addons.map((addon) => ({
      label: addon.name,
      unitAmount: addon.priceAtBooking,
      quantity: addon.qty,
      total: addon.priceAtBooking * addon.qty,
      currency: booking.currency,
    })),
  ];

  /* Tax is a line rather than a total, matching how the property receipt
     itemises it — a guest reconciling expenses needs it broken out. */
  if (booking.taxTotal > 0) {
    lineItems.push({
      label: 'Tax',
      unitAmount: booking.taxTotal,
      quantity: 1,
      total: booking.taxTotal,
      currency: booking.currency,
    });
  }

  return {
    bookingId: booking.id,
    status: booking.status,
    currency: booking.currency,
    lineItems,
    /* The template reads `totalDueNow` — matching the property receipt's own
       pricing shape. Naming it `total` here silently rendered a £0 total under
       correct line items. */
    totals: { totalDueNow: booking.totalPrice },
    /*
     * A settled booking gets one line stating what was paid, with no provider
     * or reference — the booking payload carries no transaction, and inventing
     * a reference would falsify the one field people quote when querying a
     * charge. Leaving the list empty was worse: the template then printed
     * "no payment has settled" directly beneath a PAID stamp.
     */
    payments: SETTLED.includes(booking.status)
      ? [{ amount: booking.totalPrice, currency: booking.currency, status: 'succeeded' }]
      : [],
    isPaid: SETTLED.includes(booking.status),
  };
};

export const printSpaceReceipt = ({ booking, space, guest }) => {
  const receipt = toSpaceReceipt(booking, space);

  const stayLine = `${escapeHtml(formatDate(booking.date))}<br>
    <small style="color:#7c8a83">${escapeHtml(formatTime(booking.startTime))} – ${escapeHtml(
      formatTime(booking.endTime),
    )} · ${escapeHtml(booking.layoutName || 'Layout')} · ${escapeHtml(booking.guestCount)} ${
      booking.guestCount === 1 ? 'guest' : 'guests'
    }</small>`;

  printReceipt({
    receipt,
    property: space
      ? { name: space.name, city: space.city, country: space.country }
      : { name: booking.spaceName },
    guest,
    labels: { subject: 'Space', period: 'Booked for' },
    stayLine,
  });
};
