/**
 * Support content — help topics and the FAQ.
 *
 * No `/support/faqs/` endpoint exists, so these are authored here.
 *
 * Topics 1-7 are the client's own Section 4 copy, supplied 8 September 2026.
 * The last three — identity checks, hiring a space, listing a property — are
 * ours and predate it. They were kept rather than replaced for two reasons:
 * every answer in them describes behaviour checked against the live API, and
 * the site footer links directly at `#identity` and `#hosting`, which would
 * otherwise land on nothing.
 *
 * `pendingSignOff` marks an answer the client flagged as needing Legal or
 * Finance approval before publication. Where their copy carried a
 * [PLACEHOLDER] figure, no number has been invented to fill it: the answer
 * points at the place the real figure is authoritative — the listing, the
 * booking, or support — and `PENDING_SIGN_OFF` below lists every one of them
 * so they can be found and filled in one pass.
 *
 * `topic` is what the quick-links filter on, and matches an entry in `TOPICS`.
 */

export const TOPICS = [
  { id: 'booking', label: 'Bookings', icon: 'CalendarCheck' },
  { id: 'payments', label: 'Payments & deposits', icon: 'CreditCard' },
  { id: 'cancelling', label: 'Cancellations', icon: 'CalendarX' },
  { id: 'refunds', label: 'Refunds', icon: 'Receipt' },
  { id: 'stay', label: 'Check-in & check-out', icon: 'KeyRound' },
  { id: 'accessibility', label: 'Accessibility & requests', icon: 'Accessibility' },
  { id: 'trust', label: 'Trust, safety & support', icon: 'LifeBuoy' },
  { id: 'identity', label: 'Identity checks', icon: 'ShieldCheck' },
  { id: 'spaces', label: 'Hiring a space', icon: 'Presentation' },
  { id: 'hosting', label: 'Listing your property', icon: 'Building2' },
];

export const FAQS = [
  /* ------------------------------------------------------------ bookings */
  {
    id: 'how-book',
    topic: 'booking',
    question: 'How do I book a space with Alotel Spaces?',
    answer:
      "Search by city or dates on our site, choose your space, and confirm your booking online. You'll receive a confirmation email with your stay details and a direct line to your concierge.",
  },
  {
    id: 'specific-space',
    topic: 'booking',
    question: 'Can I request a specific space or building?',
    answer:
      "Yes — if you have a preferred space, building, or neighbourhood, note it at checkout or contact our concierge team. If your exact request isn't available, we'll offer the closest match and explain the difference.",
  },
  {
    id: 'not-listed',
    topic: 'booking',
    question: "What if the space I want isn't listed for my dates?",
    answer:
      "This is exactly what our concierge service is for. Get in touch and we'll search partner availability beyond the site listings to find something that fits.",
  },

  /* -------------------------------------------------- payments, deposits */
  {
    id: 'payment-methods',
    topic: 'payments',
    question: 'What payment methods do you accept?',
    answer:
      'We accept major credit and debit cards, and select digital wallets depending on your destination market. All payments are processed securely through our verified payment partners — Flutterwave for Nigerian listings, Stripe everywhere else.',
  },
  {
    id: 'deposit-required',
    topic: 'payments',
    question: 'Do I need to pay a deposit?',
    answer:
      'Most stays require a refundable security deposit. It is held against your card rather than charged, and released after checkout provided the space is left in its original condition. The exact amount and release window are shown on your booking before you pay.',
    pendingSignOff: 'Deposit release window (client copy reads "[PLACEHOLDER: X business days]").',
  },
  {
    id: 'deposit-return',
    topic: 'payments',
    question: "When is my deposit returned if there's no damage?",
    answer:
      "Deposits are released automatically after checkout, and you'll receive a confirmation email once it has been processed — no action needed on your end. Your booking shows the release window that applies to your stay.",
    pendingSignOff: 'Deposit release window (client copy reads "[PLACEHOLDER: X business days]").',
  },
  {
    id: 'damage-found',
    topic: 'payments',
    question: 'What happens if damage is found in the space?',
    answer:
      "We'll contact you with photo evidence and an itemised cost before deducting anything from your deposit. You'll have the chance to respond before any final deduction is made.",
  },

  /* ------------------------------------------------------- cancellations */
  {
    id: 'cancellation-policy',
    topic: 'cancelling',
    question: 'What is your cancellation policy?',
    answer:
      'Cancellation terms are set per listing and shown clearly before you book. Cancel early enough and you receive a full refund; later cancellations may incur a partial charge. The cut-off that applies to your booking is stated on the listing and again at checkout.',
    pendingSignOff: 'Free-cancellation cut-off (client copy reads "[PLACEHOLDER: X days] before check-in").',
  },
  {
    id: 'change-dates',
    topic: 'cancelling',
    question: 'Can I cancel or change my dates after booking?',
    answer:
      'Yes. Log into your booking to amend dates (subject to availability) or cancel, and the applicable policy will be shown before you confirm. Our concierge team can also make the change for you.',
  },
  {
    id: 'emergency-cancel',
    topic: 'cancelling',
    question: 'What if I need to cancel due to an emergency?',
    answer:
      "Contact us as soon as possible. Emergency cancellations — medical, bereavement, denied visas, and similar — are reviewed case-by-case, and we'll always work with you in good faith.",
  },
  {
    id: 'host-cancels',
    topic: 'cancelling',
    question: 'Does the host or property ever cancel a confirmed booking?',
    answer:
      "Rarely, but if it happens you'll be notified immediately, given a full refund, and our concierge will help find an equivalent or better space at no extra cost.",
  },

  /* ------------------------------------------------------------- refunds */
  {
    id: 'request-refund',
    topic: 'refunds',
    question: 'How do I request a refund?',
    answer:
      "Refunds are processed automatically where the listing's policy applies. If something wasn't as described, contact support directly and we'll review it.",
    pendingSignOff: 'Refund resolution target (client copy reads "[PLACEHOLDER: X business days]").',
  },
  {
    id: 'refund-timing',
    topic: 'refunds',
    question: 'How long does a refund take to reach my account?',
    answer:
      'Once approved, the refund leaves us immediately. How long it takes to appear on your statement is set by your bank or card provider, not by us, and is typically several business days.',
    pendingSignOff: 'Refund arrival window (client copy reads "[PLACEHOLDER: 5-10 business days]").',
  },
  {
    id: 'stay-protection-cover',
    topic: 'refunds',
    question: "What's covered under Stay Protection if something goes wrong?",
    answer:
      "If a space isn't as described, isn't accessible, or a serious issue arises during your stay, Stay Protection covers rehoming to a comparable space or a full refund — whichever resolves it fastest for you.",
  },
  {
    id: 'leave-early',
    topic: 'refunds',
    question: 'Can I get a partial refund if I leave early?',
    answer:
      "This depends on the listing's policy and the reason for leaving. Contact support with your situation — we review early departures individually rather than applying a blanket rule.",
  },

  /* ------------------------------------------------- check-in, check-out */
  {
    id: 'check-in-how',
    topic: 'stay',
    question: 'How does check-in work?',
    answer:
      'Most spaces offer self-check-in via smart lock or keybox, with instructions sent 24 to 48 hours before arrival. Where a host or manager greets you in person, timing is confirmed in advance.',
  },
  {
    id: 'early-late',
    topic: 'stay',
    question: 'What if I need to arrive earlier or leave later than scheduled?',
    answer:
      'Early check-in and late check-out are subject to space availability and may carry a small fee. Ask your concierge as early as possible to maximise the chance of a yes.',
    pendingSignOff: 'Early check-in / late check-out fee — no amount supplied.',
  },
  {
    id: 'locked-out',
    topic: 'stay',
    question: "What happens if I'm locked out or the access code doesn't work?",
    answer:
      'Contact our 24/7 support line immediately — every space has a dedicated local contact who can resolve access issues in real time.',
  },

  /* --------------------------------------- accessibility, special requests */
  {
    id: 'accessible-spaces',
    topic: 'accessibility',
    question: 'Are your spaces accessible?',
    answer:
      'Accessibility is a baseline standard, not an add-on, across our managed spaces. Each listing states specific accessibility features — step-free access, adapted bathrooms, and more — so you can check before booking.',
  },
  {
    id: 'accessibility-gap',
    topic: 'accessibility',
    question: "What if a space doesn't meet my accessibility needs?",
    answer:
      'Tell us what you need and our concierge team will find or adapt a suitable space, or coordinate directly with the property to make reasonable arrangements ahead of your arrival.',
  },
  {
    id: 'special-amenities',
    topic: 'accessibility',
    question: 'Can I request amenities that are not listed — a crib, an adapted bathroom, pet-friendly?',
    answer:
      "Yes. If it's not listed, ask — our concierge service exists precisely for the space between what's advertised and what you actually need.",
  },

  /* --------------------------------------------- trust, safety, support */
  {
    id: 'verify-spaces',
    topic: 'trust',
    question: 'How do you verify your spaces and hosts?',
    answer:
      'Every space listed goes through our verification process — identity checks, quality standards, and safety compliance — before it appears on Alotel Spaces.',
  },
  {
    id: 'stay-protection-what',
    topic: 'trust',
    question: 'What is Stay Protection and how does it work?',
    answer:
      'Stay Protection is our built-in guarantee covering verified listings, secure payments, and dedicated support if anything goes wrong before, during, or after your stay — at no extra cost to you.',
  },
  {
    id: 'contact-during-stay',
    topic: 'trust',
    question: 'How can I contact support during my stay?',
    answer:
      'Our support and concierge teams are available 24/7 via chat, email, or phone — details are in your booking confirmation and check-in instructions.',
  },
  {
    id: 'safety-concern',
    topic: 'trust',
    question: "What should I do if there's a safety concern at my space?",
    answer:
      'Contact our emergency support line immediately — available 24/7. Safety concerns are always prioritised above standard support queries.',
  },

  /* ------------------------------------------------------------ identity */
  {
    id: 'why-identity',
    topic: 'identity',
    question: 'Why do I need to verify my identity?',
    answer:
      'A verified profile is what lets us hold every guest to the same standard, and it is a legal requirement on longer residential lets. Short stays need a verified profile; longer lets add right-to-rent, anti-money-laundering and credit checks before keys change hands.',
  },
  {
    id: 'identity-docs',
    topic: 'identity',
    question: 'What documents will I be asked for?',
    answer:
      'A government photo ID for every stay. Longer residential lets also ask for proof of address and, depending on the jurisdiction, proof of income or right to rent. You are told which tier applies before you pay, not after.',
  },
  {
    id: 'identity-storage',
    topic: 'identity',
    question: 'What happens to my documents?',
    answer:
      'Verification is carried out by our identity partner rather than by us, and the result — pass or fail — is what reaches our systems. You can request a copy of everything we hold about you, or its deletion, from your dashboard.',
  },

  /* -------------------------------------------------------------- spaces */
  {
    id: 'space-vs-stay',
    topic: 'spaces',
    question: 'How is hiring a space different from booking a stay?',
    answer:
      'A space is booked by the hour or the day rather than the night — meeting rooms, studios, event halls. You pick a date, a time window and a layout, and the price is calculated from the hours you hold.',
  },
  {
    id: 'space-approval',
    topic: 'spaces',
    question: 'Is a space booking confirmed immediately?',
    answer:
      'It depends on the space. Some confirm as soon as payment clears; others are request-to-book, and the host has a stated window to accept. Nothing is charged on a request until it is approved.',
  },
  {
    id: 'space-addons',
    topic: 'spaces',
    question: 'Can I add equipment or catering?',
    answer:
      'Each space lists its own add-ons — AV equipment, catering, extra seating — with the price and any maximum quantity. They are added during booking and itemised on your receipt.',
  },

  /* ------------------------------------------------------------- hosting */
  {
    id: 'list-property',
    topic: 'hosting',
    question: 'How do I list a property with Alotel Spaces?',
    answer:
      'We do not run an open marketplace. Properties join through our partner network, and we take on the management: verification, contracts, payments, tax handling, inspections at both ends of each stay, cleaning and maintenance coordination.',
  },
  {
    id: 'hosting-what-we-do',
    topic: 'hosting',
    question: 'What does Alotel Spaces handle on my behalf?',
    answer:
      'Guest verification, contracts, payments, tax handling, inspections at both ends of each stay, cleaning and maintenance coordination. You keep the asset and the income; we run the operation.',
  },
  {
    id: 'hosting-interim',
    topic: 'hosting',
    question: 'I have a commercial asset sitting empty between leases. Can you use it?',
    answer:
      'Yes — interim occupancy is one of the two propositions we offer partners. A commercial asset between lease agreements generates income instead of sitting vacant, on short and flexible terms that end when your next tenant is ready.',
  },
];

/**
 * Answers the client flagged as needing Legal or Finance approval, or that
 * carry a figure nobody has confirmed yet. Derived rather than hand-listed so
 * it cannot drift from the answers themselves.
 */
export const PENDING_SIGN_OFF = FAQS.filter((faq) => faq.pendingSignOff);

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
