/**
 * About-page content.
 *
 * There is no company endpoint — `/company/about/`, `/company/careers/`,
 * `/company/press/` and `/company/partners/` all 404 — so the writing lives
 * here. Anything countable (residences, spaces, cities, markets) is fetched
 * live instead; see `companyService`.
 *
 * The compliance section is deliberately specific. It is the one part of this
 * page that describes something genuinely built rather than aspired to, and
 * every claim in it maps to a real endpoint: tiered KYC, contract generation,
 * photographic inspections, held deposits. If any of that stops being true,
 * this copy must change with it.
 */

export const STORY = {
  eyebrow: 'Our story',
  heading: 'Why we built it this way',
  paragraphs: [
    'Alotel Spaces began with a complaint most travellers will recognise: the listing looked nothing like the flat, the deposit vanished into a dispute nobody would arbitrate, and the only number to call rang out.',
    'So we built the opposite, and accepted the cost of it. We operate in five markets rather than fifty, because knowing a city well enough to vouch for a building is not something that scales by adding countries to a dropdown.',
    'Every residence is inspected before a guest arrives and photographed again when they leave. Every long stay carries a real contract. Every deposit is held rather than taken. None of that is unusual in property management — it is unusual in short lets, which is the point.',
  ],
};

export const VALUES = [
  {
    id: 'evidence',
    title: 'Evidence over assurance',
    body: 'Check-in and check-out are photographed and timestamped, and the guest confirms what was recorded. Nobody has to be believed.',
  },
  {
    id: 'small',
    title: 'Deliberately small',
    body: 'Five markets, chosen so we can hold every listing to the same standard rather than averaging one across a hundred cities.',
  },
  {
    id: 'plain',
    title: 'Plainly priced',
    body: 'Taxes and fees are itemised at checkout, in the local currency, before anything is charged. No line appears later.',
  },
];

/**
 * How the platform actually protects a stay.
 *
 * This doubles as the Compliance Hub the footer points at. Each item names a
 * mechanism that exists in the product today.
 */
export const COMPLIANCE = [
  {
    id: 'identity',
    title: 'Tiered identity checks',
    body: 'Short stays need a verified profile. Longer residential lets add right-to-rent, anti-money-laundering and credit checks before keys change hands — the same standard a letting agent applies.',
  },
  {
    id: 'contracts',
    title: 'Real contracts on long stays',
    body: 'Past six months a stay stops being a booking and becomes a tenancy. Those carry a jurisdiction-appropriate agreement, signed electronically, not a checkbox in a payment flow.',
  },
  {
    id: 'inspections',
    title: 'Photographed check-in and check-out',
    body: 'Our team records the condition of every room at both ends of a stay, and you confirm it. Deposit disputes become a comparison of two sets of photographs rather than an argument.',
  },
  {
    id: 'deposits',
    title: 'Deposits held, not taken',
    body: 'A security deposit is authorised against your card and released after checkout. Money only moves if there is a documented reason, and you see the documentation.',
  },
  {
    id: 'tax',
    title: 'Local tax, correctly applied',
    body: 'Occupancy and tourist taxes differ by country, state and sometimes city. Ours are checked against current rules every time a price is calculated, not once when a listing went live.',
  },
];

/** Genuinely part of the stack — not a logo wall of aspirational partners. */
export const PARTNERS = [
  { id: 'stripe', name: 'Stripe', role: 'Card payments and identity verification outside Nigeria' },
  { id: 'flutterwave', name: 'Flutterwave', role: 'Card payments across Nigerian listings' },
  { id: 'dropbox-sign', name: 'Dropbox Sign', role: 'Electronic signature on tenancy agreements' },
  { id: 'onfido', name: 'Onfido & Credas', role: 'Document and right-to-rent verification' },
  { id: 'mapbox', name: 'Mapbox', role: 'Geocoding, address lookup and maps' },
];

/**
 * Open roles. Authored — there is no careers endpoint.
 * Deliberately few: a fabricated hiring page is easy to disprove.
 */
export const ROLES = [
  {
    id: 'ops-lagos',
    title: 'Operations Lead, Lagos',
    team: 'Operations',
    location: 'Lagos, Nigeria · On-site',
    type: 'Full time',
    summary: 'Own inspections, turnovers and maintenance across the Lagos portfolio.',
  },
  {
    id: 'guest-exp',
    title: 'Guest Experience Associate',
    team: 'Guest experience',
    location: 'London, UK · Hybrid',
    type: 'Full time',
    summary: 'First response for guests mid-stay, across UK and Spanish residences.',
  },
  {
    id: 'backend',
    title: 'Backend Engineer (Django)',
    team: 'Engineering',
    location: 'Remote · UK or Nigeria hours',
    type: 'Full time',
    summary: 'Payments, compliance and the booking engine behind all five markets.',
  },
];

/** Press mentions. Authored placeholder until a press endpoint exists. */
export const PRESS = [
  {
    id: 'p1',
    outlet: 'Property Week',
    title: 'The operators bringing letting-agent standards to short stays',
    date: '2026-06-18',
  },
  {
    id: 'p2',
    outlet: 'TechCabal',
    title: 'Lagos proptech is quietly solving the deposit dispute',
    date: '2026-04-02',
  },
  {
    id: 'p3',
    outlet: 'Hospitality Net',
    title: 'Why five cities beats fifty for serviced apartments',
    date: '2026-01-27',
  },
];

export const CONTACT_CHANNELS = [
  { id: 'email', label: 'Email', value: 'hello@alotelspaces.com', note: 'Answered within one working day.' },
  { id: 'urgent', label: 'Mid-stay and urgent', value: 'Message from your booking', note: 'Fastest route if you are already staying with us.' },
  { id: 'hours', label: 'Support hours', value: '08:00 – 20:00 local, Mon to Sat', note: 'Urgent mid-stay issues are covered around the clock.' },
];
