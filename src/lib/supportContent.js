/**
 * Support content — help topics and the FAQ.
 *
 * No `/support/faqs/` endpoint exists, so these are authored here. Unlike most
 * placeholder copy, every answer below describes behaviour the product actually
 * has, checked against the API rather than imagined: the payment provider split
 * by market, the 183-night contract threshold, how deposits are authorised and
 * released, the three identity tiers, and what the inspection acknowledgement
 * does. If any of that changes, this file is wrong and must change with it.
 *
 * `topic` is what the quick-links filter on, and matches an entry in `TOPICS`.
 */

export const TOPICS = [
  { id: 'booking', label: 'Booking a stay', icon: 'CalendarCheck' },
  { id: 'payments', label: 'Payments & refunds', icon: 'CreditCard' },
  { id: 'identity', label: 'Identity checks', icon: 'ShieldCheck' },
  { id: 'stay', label: 'Check-in & your stay', icon: 'KeyRound' },
  { id: 'cancelling', label: 'Changes & cancelling', icon: 'CalendarX' },
  { id: 'spaces', label: 'Hiring a space', icon: 'Presentation' },
  { id: 'hosting', label: 'Listing your property', icon: 'Building2' },
];

export const FAQS = [
  /* ------------------------------------------------------------- booking */
  {
    id: 'how-book',
    topic: 'booking',
    question: 'How do I book a residence?',
    answer:
      'Search a city with your dates, open a residence and choose your check-in and check-out. Availability is checked live against other bookings, so anything you can select is genuinely free. You will verify your identity and pay before the booking is confirmed.',
  },
  {
    id: 'guest-count',
    topic: 'booking',
    question: 'Can I add guests, children or pets?',
    answer:
      'Guests, children and infants are set during booking and checked against the residence’s maximum occupancy. Pets depend on the individual listing — each one states whether pets are allowed, and the booking will not let you proceed if they are not.',
  },
  {
    id: 'instant',
    topic: 'booking',
    question: 'Is my booking confirmed straight away?',
    answer:
      'Residences confirm as soon as payment clears. Spaces depend on the host: some are instant, others are request-to-book and the host has a stated window — usually 24 hours — to accept. Nothing is charged on a request until it is approved.',
  },

  /* ------------------------------------------------------------ payments */
  {
    id: 'providers',
    topic: 'payments',
    question: 'Which payment methods can I use?',
    answer:
      'Nigerian residences are paid through Flutterwave; everywhere else goes through Stripe. The right provider is selected for you based on where the residence is, and the other is shown greyed out rather than hidden, so you can see why.',
  },
  {
    id: 'taxes',
    topic: 'payments',
    question: 'Why does the total differ from the nightly rate?',
    answer:
      'Local occupancy and tourist taxes are added on top, and they differ by country, state and sometimes city. Every one is itemised separately at checkout, in the local currency, before you are charged. Nothing is added afterwards.',
  },
  {
    id: 'deposit',
    topic: 'payments',
    question: 'How does the security deposit work?',
    answer:
      'It is authorised against your card rather than taken. After checkout the hold is released. If a deduction is proposed you are shown the check-in and check-out photographs it is based on, and the amount, before anything is captured.',
  },
  {
    id: 'refund',
    topic: 'payments',
    question: 'When will I get a refund?',
    answer:
      'Refunds are calculated from the cancellation policy that applied on the day you booked, not the one in force when you cancel. Once approved they are returned to the original card and typically appear within five to ten working days, depending on your bank.',
  },

  /* ------------------------------------------------------------ identity */
  {
    id: 'why-id',
    topic: 'identity',
    question: 'Why do I need to verify my identity?',
    answer:
      'Because the person holding the keys to someone’s home should be known. Short stays need a verified profile — a photo of your ID and a selfie, handled by our verification partner. It usually takes a couple of minutes.',
  },
  {
    id: 'long-id',
    topic: 'identity',
    question: 'Why does a long stay ask for more?',
    answer:
      'Past six months a stay is legally closer to a tenancy than a holiday let. Those bookings add right-to-rent, anti-money-laundering and credit checks, and a signed agreement — the same checks a letting agent would run.',
  },
  {
    id: 'id-fail',
    topic: 'identity',
    question: 'My verification failed. What now?',
    answer:
      'Most failures are a blurred document or a mismatch between the name on your ID and your account. You can retry from your dashboard. If it fails twice, contact us and a person will look at it rather than the automated check.',
  },

  /* ---------------------------------------------------------------- stay */
  {
    id: 'checkin',
    topic: 'stay',
    question: 'How do I check in?',
    answer:
      'Access details arrive by notification and email shortly before your check-in date. Our team inspects and photographs the residence beforehand, and you will be asked to confirm the record matches what you find.',
  },
  {
    id: 'why-confirm',
    topic: 'stay',
    question: 'Why am I asked to confirm the check-in photographs?',
    answer:
      'So that any later question about condition is settled by two sets of dated photographs rather than by whose word carries more weight. If something does not match, say so in the message thread before confirming — nothing is charged while that is open.',
  },
  {
    id: 'problem',
    topic: 'stay',
    question: 'Something is wrong with the residence. Who do I tell?',
    answer:
      'Message us from the booking. It reaches the team responsible for that specific residence rather than a general inbox, and urgent mid-stay issues are covered outside normal support hours.',
  },
  {
    id: 'extend',
    topic: 'stay',
    question: 'Can I extend my stay?',
    answer:
      'Request an extension from your booking. It depends on whether the residence is free for the extra nights, and if the extension takes you past six months the stay converts to a contracted tenancy with the additional checks that involves.',
  },

  /* ---------------------------------------------------------- cancelling */
  {
    id: 'how-cancel',
    topic: 'cancelling',
    question: 'How do I cancel?',
    answer:
      'Open the booking and choose to cancel. You will be asked why — briefly, and it is recorded on the booking. Your dates are released immediately and cannot be reinstated, so the reason is asked for before the action unlocks rather than after.',
  },
  {
    id: 'cancel-refund',
    topic: 'cancelling',
    question: 'What will I get back?',
    answer:
      'It depends on the cancellation policy that applied when you booked and how close to check-in you are. The booking shows what you have paid before you confirm, and we email the calculated refund afterwards.',
  },
  {
    id: 'host-cancel',
    topic: 'cancelling',
    question: 'What if you cancel on me?',
    answer:
      'You are refunded in full and we help you find an equivalent residence in the same city. If we cannot, the difference in price on a comparable booking is ours to cover, not yours.',
  },

  /* -------------------------------------------------------------- spaces */
  {
    id: 'space-diff',
    topic: 'spaces',
    question: 'How are Spaces different from residences?',
    answer:
      'A residence is booked by the night. A space — a boardroom, studio or event hall — is booked by a window inside a day, so the same room can host several bookings on the same date. Prices are shown per hour, half-day or day, whichever the host sells.',
  },
  {
    id: 'space-layout',
    topic: 'spaces',
    question: 'What is a layout, and why does it change capacity?',
    answer:
      'The same room seats a very different number depending on how it is arranged — a boardroom setup might hold eighteen where theatre-style holds forty. You pick the layout when booking, and the guest count is checked against it before you can submit.',
  },
  {
    id: 'space-request',
    topic: 'spaces',
    question: 'My space booking says “awaiting approval”. What does that mean?',
    answer:
      'That host takes requests rather than instant bookings, usually because they need to confirm catering or staffing. They have a stated window to respond, shown as a live countdown. If it lapses the request expires on its own and the slot is released — you are not charged either way.',
  },

  /* ------------------------------------------------------------- hosting */
  {
    id: 'list',
    topic: 'hosting',
    question: 'Can I list my property with Alotel?',
    answer:
      'We take on a limited number of residences per city so that each one can be inspected and serviced to the same standard. Get in touch below with the location and property type and we will tell you honestly whether we are taking listings in that market.',
  },
  {
    id: 'host-manage',
    topic: 'hosting',
    question: 'What do you handle if I list with you?',
    answer:
      'Guest verification, contracts, payments, tax handling, inspections at both ends of each stay, cleaning and maintenance coordination. You keep the asset and the income; we run the operation.',
  },
];

export const findTopic = (id) => TOPICS.find((topic) => topic.id === id) ?? null;

/** Naive but adequate search across question, answer and topic label. */
export const searchFaqs = (query) => {
  const term = query.trim().toLowerCase();
  if (!term) return FAQS;

  return FAQS.filter((faq) => {
    const topic = findTopic(faq.topic)?.label ?? '';
    return `${faq.question} ${faq.answer} ${topic}`.toLowerCase().includes(term);
  });
};
