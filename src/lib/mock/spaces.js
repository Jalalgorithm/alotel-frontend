/**
 * Mock Spaces.
 *
 * Every layout name, add-on category and slot unit here is invented *per space*
 * rather than drawn from one shared list, because that is how the real product
 * works — hosts author their own. Three spaces across three markets, each
 * selling time a different way, so the UI is exercised against hourly,
 * half-day and full-day pricing rather than one comfortable case.
 */

const IMAGE = (seed) => `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=1200&q=70`;

/**
 * Mon–Fri, the common case; overridden per space where it differs.
 * 0–4 because the API indexes weekdays Monday-first, not Sunday-first.
 */
const weekdays = (open, close) =>
  [0, 1, 2, 3, 4].map((day) => ({ day_of_week: day, open_time: open, close_time: close }));

export const spaces = [
  {
    id: 'space-lagos-boardroom',
    title: 'Executive Boardroom, Ikoyi',
    description:
      'A quiet top-floor boardroom overlooking the lagoon, wired for hybrid meetings. Comes with a dedicated host on site for the duration of your booking.',
    category: 'Boardroom',
    location: { country: 'Nigeria', state: 'Lagos', city: 'Ikoyi' },
    currency: 'NGN',
    size_sqm: 41,
    base_rate: 700000,
    slot_unit: 'half_day',
    min_slots: 1,
    max_slots: 2,
    booking_mode: 'request',
    approval_expiry_hours: 24,
    rating: 4.8,
    review_count: 24,
    status: 'published',
    images: [IMAGE('photo-1497366754035-f200968a6e72'), IMAGE('photo-1517502884422-41eaead166d4')],
    layouts: [
      { id: 'lay-ik-board', layout_name: 'Boardroom', max_capacity: 18 },
      { id: 'lay-ik-theatre', layout_name: 'Theatre', max_capacity: 40 },
      { id: 'lay-ik-ushape', layout_name: 'U-Shape', max_capacity: 22 },
    ],
    addons: [
      { id: 'add-ik-tea', category: 'Catering', name: 'High Tea — Set 2', price: 11000, unit_type: 'per_person', min_qty: 5, max_qty: null },
      { id: 'add-ik-lunch', category: 'Catering', name: 'Working lunch', price: 18500, unit_type: 'per_person', min_qty: 5, max_qty: null },
      { id: 'add-ik-av', category: 'Equipment', name: 'Hybrid AV kit + operator', price: 95000, unit_type: 'flat', min_qty: 0, max_qty: 1 },
      { id: 'add-ik-scribe', category: 'Staffing', name: 'Minute-taker', price: 22000, unit_type: 'per_hour', min_qty: 0, max_qty: 1 },
    ],
    operating_hours: weekdays('08:00', '20:00'),
    blackout_dates: [{ date: '2026-09-25', reason: 'Carpet replacement' }],
  },
  {
    id: 'space-london-studio',
    title: 'Shoreditch Workshop Studio',
    description:
      'A daylight studio with a sprung floor and blackout blinds — used for workshops, rehearsals and photo shoots. Book by the hour, minimum two.',
    category: 'Studio',
    location: { country: 'UK', state: 'London', city: 'Shoreditch' },
    currency: 'GBP',
    size_sqm: 88,
    base_rate: 65,
    slot_unit: 'hour',
    min_slots: 2,
    max_slots: 10,
    booking_mode: 'instant',
    approval_expiry_hours: 24,
    rating: 4.6,
    review_count: 61,
    status: 'published',
    images: [IMAGE('photo-1524758631624-e2822e304c36'), IMAGE('photo-1505409628601-edc9af17fda6')],
    layouts: [
      { id: 'lay-sh-open', layout_name: 'Open floor', max_capacity: 60 },
      { id: 'lay-sh-cabaret', layout_name: 'Cabaret', max_capacity: 36 },
      { id: 'lay-sh-circle', layout_name: 'Circle', max_capacity: 24 },
    ],
    addons: [
      { id: 'add-sh-pa', category: 'Equipment', name: 'PA system + mics', price: 45, unit_type: 'per_hour', min_qty: 0, max_qty: 1 },
      { id: 'add-sh-chairs', category: 'Furniture', name: 'Extra stacking chairs (per 10)', price: 25, unit_type: 'flat', min_qty: 0, max_qty: 5 },
      { id: 'add-sh-coffee', category: 'Catering', name: 'Filter coffee & pastries', price: 6.5, unit_type: 'per_person', min_qty: 4, max_qty: null },
    ],
    operating_hours: [...weekdays('07:00', '22:00'), { day_of_week: 5, open_time: '09:00', close_time: '18:00' }],
    blackout_dates: [],
  },
  {
    id: 'space-madrid-hall',
    title: 'Salón Retiro Event Hall',
    description:
      'A restored ballroom five minutes from Retiro park, hired as a whole day. Suits receptions, launches and award dinners.',
    category: 'Event Hall',
    location: { country: 'Spain', state: 'Madrid', city: 'Madrid' },
    currency: 'EUR',
    size_sqm: 320,
    base_rate: 2400,
    slot_unit: 'full_day',
    min_slots: 1,
    max_slots: 3,
    booking_mode: 'request',
    approval_expiry_hours: 48,
    rating: 4.9,
    review_count: 12,
    status: 'published',
    images: [IMAGE('photo-1519167758481-83f550bb49b3'), IMAGE('photo-1464366400600-7168b8af9bc3')],
    layouts: [
      { id: 'lay-md-banquet', layout_name: 'Banquet', max_capacity: 220 },
      { id: 'lay-md-cocktail', layout_name: 'Cocktail', max_capacity: 400 },
      { id: 'lay-md-theatre', layout_name: 'Theatre', max_capacity: 300 },
    ],
    addons: [
      { id: 'add-md-catering', category: 'Catering', name: 'Three-course banquet', price: 62, unit_type: 'per_person', min_qty: 40, max_qty: null },
      { id: 'add-md-dj', category: 'Entertainment', name: 'DJ & lighting rig', price: 900, unit_type: 'flat', min_qty: 0, max_qty: 1 },
      { id: 'add-md-security', category: 'Staffing', name: 'Door security', price: 45, unit_type: 'per_hour', min_qty: 0, max_qty: 4 },
    ],
    operating_hours: [
      ...weekdays('09:00', '23:00'),
      { day_of_week: 5, open_time: '10:00', close_time: '02:00' },
      { day_of_week: 6, open_time: '10:00', close_time: '22:00' },
    ],
    blackout_dates: [{ date: '2026-12-24', reason: 'Closed for Nochebuena' }],
  },
];

/**
 * Existing bookings, used to carve holes in availability.
 *
 * Dated relative to today so the calendar always has something in it — a fixed
 * date would quietly stop demonstrating anything the week after it passed.
 */
const isoDay = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const spaceBookings = [
  {
    id: 'sb-001',
    space_id: 'space-lagos-boardroom',
    space_name: 'Executive Boardroom, Ikoyi',
    guest_name: 'Adaeze Nwosu',
    start_datetime: `${isoDay(3)}T09:00:00`,
    end_datetime: `${isoDay(3)}T13:00:00`,
    layout_id: 'lay-ik-theatre',
    layout_name: 'Theatre',
    guest_count: 32,
    status: 'pending_host_approval',
    base_price: 700000,
    addons_price: 352000,
    tax_total: 78900,
    total_price: 1130900,
    currency: 'NGN',
    expires_at: new Date(Date.now() + 9 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 15 * 3600 * 1000).toISOString(),
    addons: [{ addon_id: 'add-ik-tea', name: 'High Tea — Set 2', qty: 32, price_at_booking: 11000 }],
  },
  {
    id: 'sb-002',
    space_id: 'space-london-studio',
    space_name: 'Shoreditch Workshop Studio',
    guest_name: 'Marcus Bell',
    start_datetime: `${isoDay(2)}T14:00:00`,
    end_datetime: `${isoDay(2)}T18:00:00`,
    layout_id: 'lay-sh-cabaret',
    layout_name: 'Cabaret',
    guest_count: 28,
    status: 'confirmed',
    base_price: 260,
    addons_price: 180,
    tax_total: 88,
    total_price: 528,
    currency: 'GBP',
    expires_at: null,
    created_at: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
    addons: [{ addon_id: 'add-sh-pa', name: 'PA system + mics', qty: 1, price_at_booking: 45 }],
  },
  {
    id: 'sb-003',
    space_id: 'space-madrid-hall',
    space_name: 'Salón Retiro Event Hall',
    guest_name: 'Lucía Fernández',
    start_datetime: `${isoDay(-9)}T10:00:00`,
    end_datetime: `${isoDay(-9)}T22:00:00`,
    layout_id: 'lay-md-cocktail',
    layout_name: 'Cocktail',
    guest_count: 180,
    status: 'completed',
    base_price: 2400,
    addons_price: 900,
    tax_total: 693,
    total_price: 3993,
    currency: 'EUR',
    expires_at: null,
    created_at: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
    addons: [{ addon_id: 'add-md-dj', name: 'DJ & lighting rig', qty: 1, price_at_booking: 900 }],
  },
];
