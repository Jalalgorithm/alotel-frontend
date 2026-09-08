/**
 * About-page content.
 *
 * There is no company endpoint — `/company/about/`, `/company/careers/`,
 * `/company/press/` and `/company/partners/` all 404 — so the writing lives
 * here. Anything countable (residences, spaces, cities, markets) is fetched
 * live instead; see `companyService`.
 *
 * Every word below is the client's own copy, supplied 8 September 2026. It
 * replaced an earlier draft of ours, including three invented press mentions
 * that must never come back — the Press section is now a contact address,
 * which is what the client asked for and all that can be said truthfully.
 */

export const STORY = {
  eyebrow: 'Our story',
  heading: 'Why we built it this way',
  paragraphs: [
    'Alotel Spaces began with a simple frustration: hospitality and commercial accommodation have always been built around extremes — a single night, or a year-long lease — with everything in between left to waste. We set out to close that gap.',
    "Today we manage a broad range of spaces — apartments, serviced accommodation, commercial assets, and more — across the world's most desirable destinations. Because we control that inventory end to end, we put every space to work exactly how it's needed: by the hour, by the night, or on flexible terms of weeks to months for corporate stays.",
  ],
};

/**
 * The offering, grouped by duration.
 *
 * `note` carries a caveat the client's copy states outright — these are
 * conditions on availability, and burying them would make the page a promise
 * we cannot keep on every listing.
 */
export const OFFERING = {
  lead: "One standard, however long you need it — from an hour to an ongoing partnership.",
  groups: [
    {
      id: 'hour',
      duration: 'By the hour',
      items: [
        {
          title: 'Micro-Stay',
          body: 'Day use, 3-hour minimum, on select listings with a same-day schedule gap.',
          note: 'Look for the Micro-Stay tag when you search.',
        },
        {
          title: 'Single studio session',
          body: 'Book Cubicle, Studio or Debate Room by the hour or day, no contract or retainer required.',
        },
      ],
    },
    {
      id: 'night',
      duration: 'By the night',
      items: [
        {
          title: 'Verified, professionally managed stays',
          body: 'Across 8 global cities, with Stay Protection and concierge support built into every booking at no extra cost.',
        },
      ],
    },
    {
      id: 'month',
      duration: 'By the week or month',
      items: [
        {
          title: 'Flexible-term stays',
          body: 'For corporate teams and relocations — weeks or months, without a year-long lease.',
        },
        {
          title: 'Stay-and-record bundles',
          body: 'For founders and independent operators — a Cubicle session added onto a longer accommodation booking, no separate account needed.',
        },
      ],
    },
    {
      id: 'ongoing',
      duration: 'Ongoing',
      items: [
        {
          title: 'Corporate Services',
          body: 'From strategy to content production to employee experience — one partner, one contract.',
        },
      ],
    },
  ],
};

export const VALUES = [
  {
    id: 'spaces',
    title: 'Spaces, not rooms',
    body: "We don't rent square footage — we curate environments people want to return to.",
  },
  {
    id: 'inclusive',
    title: 'Inclusive to all',
    body: 'Every space we manage meets our standard as a baseline, not an afterthought. We take accessibility seriously and actively source accessible accommodation assets.',
  },
  {
    id: 'managed',
    title: 'Professionally managed, always',
    body: "Consistency isn't luck. It's process, people, and standards we hold ourselves to on every stay.",
  },
  {
    id: 'judgment',
    title: 'Beyond the checklist',
    body: 'Standards get you the booking. Judgment is what keeps the promise. Support is built into every stay; for a more personal experience, concierge service is available.',
  },
];

/** The client's Stay Protection guarantee, verbatim. */
export const STAY_PROTECTION = {
  heading: 'Stay Protection',
  body: 'Every booking through Alotel Spaces is backed by our Stay Protection guarantee — verified listings, secure payments, and a dedicated support team on call before, during, and after your stay. If something is not right, we make it right, fast.',
};

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

/** The client's partner network, and the two propositions offered to it. */
export const PARTNERS = {
  lead: 'We work with a vetted network of property owners, management companies, and local service providers who share our standard: professionally managed, guest-first, no exceptions.',
  offers: [
    {
      id: 'studio-licensing',
      title: 'Studio franchise licensing',
      body: 'Hotels can license our podcast and content studio model, with staffing and revenue-share built in.',
    },
    {
      id: 'interim-occupancy',
      title: 'Interim occupancy',
      body: 'Commercial assets between lease agreements generate income instead of sitting vacant — short-term, flexible, and ready when your next tenant is.',
    },
  ],
};

/**
 * Who handles money, identity and signatures.
 *
 * Kept alongside the partner network rather than merged into it: these are the
 * third parties a guest's card details and passport actually pass through, and
 * naming them is a disclosure, not marketing.
 */
export const SERVICE_PROVIDERS = [
  { id: 'stripe', name: 'Stripe', role: 'Card payments and identity verification outside Nigeria' },
  { id: 'flutterwave', name: 'Flutterwave', role: 'Card payments across Nigerian listings' },
  { id: 'dropbox-sign', name: 'Dropbox Sign', role: 'Electronic signature on tenancy agreements' },
  { id: 'mapbox', name: 'Mapbox', role: 'Geocoding, address lookup and maps' },
];

export const CAREERS = {
  body: "We're building the team behind the standard. If you care about spaces done properly — hospitality, content, and corporate services alike — spaces over rooms, people over process, we'd like to hear from you.",

  /**
   * The equal-opportunity statement is part of the job ad, not boilerplate
   * under it — it names concrete accommodations (any application format,
   * adapted processes) that a candidate has to read before applying, not
   * after.
   */
  equalOpportunity:
    'Alotel Spaces is an equal opportunity employer, in practice as well as policy. We work with employees and contractors from every background, and we adapt roles, tools, and ways of working so each person can bring their best — not the other way around. If a standard process does not fit how you work best, tell us; we will find one that does. Applications are welcome in whatever format suits you — written, video, audio, or another format you are comfortable with — just let us know what you need.',

  applyEmail: 'careers@alotelspaces.com',

  /*
   * Every `location` below is marked [PLACEHOLDER] in the supplied copy and
   * needs local sign-off before these ads are treated as final.
   */
  roles: [
    {
      id: 'social-uk',
      title: 'Social Media & Branding Manager',
      market: 'United Kingdom',
      location: 'London, UK',
      language: 'Fluent English (native or bilingual)',
      summary:
        'Own the Alotel Spaces voice across the UK market — social channels, local partnerships, and on-the-ground brand moments. You will translate our "spaces, not rooms" mantra into content that feels native to London, not imported. Close collaboration with the global brand team; full ownership of local execution.',
      requirements: [
        'Native/fluent English and cultural fluency in the UK market',
        '3+ years in social media, brand, or content roles, ideally in hospitality, travel, or lifestyle',
        'An eye for photography and space — you can spot what makes a listing worth posting',
      ],
    },
    {
      id: 'social-ng',
      title: 'Social Media & Branding Manager',
      market: 'Nigeria',
      location: 'Lagos, Nigeria (covering Lagos & Abuja)',
      language: 'Fluent English; working fluency in Yoruba, Hausa and/or Igbo a plus',
      summary:
        "Build and run the Alotel Spaces brand presence across Nigeria's two biggest markets. You will shape content that speaks to both Lagos energy and Abuja's more formal, business-first tone — and make sure every post reflects our standard: professionally managed, never generic.",
      requirements: [
        'Native fluency in English; working fluency in Yoruba, Hausa and/or Igbo a plus',
        'Deep familiarity with Lagos and Abuja audiences and platforms to start',
        'Experience running brand accounts in fast-moving, high-context markets',
      ],
    },
    {
      id: 'social-ae',
      title: 'Social Media & Branding Manager',
      market: 'United Arab Emirates',
      location: 'Dubai, UAE',
      language: 'Fluent Arabic and English',
      summary:
        'Lead brand and social strategy for our UAE market — a high-visibility, high-polish audience that expects nothing less than premium. You will balance global brand consistency with the cultural nuance Dubai demands, from tone to imagery to platform choice.',
      requirements: [
        'Native/fluent Arabic and fluent English',
        'Experience in luxury hospitality, real estate, or lifestyle branding',
        'Comfort working across both Western and regional social platforms',
      ],
    },
    {
      id: 'social-es',
      title: 'Social Media & Branding Manager',
      market: 'Spain',
      location: 'Madrid, Spain (covering Madrid & Barcelona)',
      language: 'Fluent Spanish; Catalan a plus (for Barcelona)',
      summary:
        "Shape the Alotel Spaces voice across Spain's two flagship cities — Madrid's polish and Barcelona's design-led, coastal energy. You will build content calendars, manage local partnerships, and make sure every space we manage looks as good online as it feels in person.",
      requirements: [
        'Native/fluent Spanish; conversational Catalan an advantage',
        '3+ years in social media or brand roles, ideally hospitality or design-adjacent',
        'A strong visual sensibility — Barcelona and Madrid audiences expect it',
      ],
    },
    {
      id: 'social-us',
      title: 'Social Media & Branding Manager',
      market: 'United States',
      location: 'New York, NY',
      language: 'Fluent English',
      summary:
        'Run brand and social for our flagship US market. New York moves fast and expects sharp, confident content — you will keep Alotel Spaces visible, credible, and unmistakably premium across every channel that matters here.',
      requirements: [
        'Native/fluent English',
        '3+ years in social media, brand, or PR, ideally hospitality or real estate',
        'A pulse on New York culture and what makes content travel here',
      ],
    },
    {
      id: 'sales-ng',
      title: 'Sales Manager',
      market: 'Nigeria',
      location: 'Lagos, Nigeria (covering Lagos & Abuja)',
      language: 'Fluent English; working fluency in Yoruba, Hausa and/or Igbo a plus',
      summary:
        'Drive new business and partner growth across our Nigerian markets — corporate accounts, extended-stay clients, and property partners across Lagos and Abuja. You will be the face of Alotel Spaces to the local market, building the relationships that keep our spaces full and our standard non-negotiable.',
      requirements: [
        'Proven B2B or hospitality sales experience in the Nigerian market',
        'Existing network across corporate, diplomatic, or real estate sectors a strong plus',
        'Comfort managing a sales pipeline across two distinct cities and business cultures',
      ],
    },
    {
      id: 'podcast',
      title: 'Podcast Strategist',
      market: 'Global (remote / hybrid)',
      location: 'Flexible — global remit',
      language: 'Fluent English; additional languages a plus',
      summary:
        "Build Alotel Spaces' podcast presence from the ground up — strategy, format, guest pipeline, and distribution. Think city living, hospitality, and the culture of spaces done properly. You will work across our destination markets to source stories and shape a show that extends our brand voice into audio.",
      requirements: [
        'Experience producing or strategising podcasts, ideally in travel, lifestyle, or design',
        'Strong editorial instincts and comfort pitching/booking guests globally',
        'Ability to adapt tone across markets while keeping one consistent brand voice',
      ],
    },
  ],
};

export const PRESS = {
  body: 'For media inquiries, interviews, or brand assets, contact our press team.',
  email: 'press@alotelspaces.com',
};

export const CONTACT_CHANNELS = [
  {
    id: 'general',
    label: 'General enquiries',
    value: 'hello@alotelspaces.com',
    href: 'mailto:hello@alotelspaces.com',
    note: 'Answered within one working day.',
  },
  {
    id: 'concierge',
    label: 'Concierge service',
    value: 'concierge@alotelspaces.com',
    href: 'mailto:concierge@alotelspaces.com',
    note: "For anything a space doesn't cover, we'll find a way.",
  },
  {
    id: 'phone',
    label: 'Phone',
    value: '+34 610 773 773',
    href: 'tel:+34610773773',
    note: 'Spain — EMEA hours.',
  },
];

/**
 * EMEA offices. Also rendered in the site footer, from this same source, so an
 * address can never be corrected in one place and left stale in the other.
 */
export const OFFICES = [
  {
    id: 'lagos',
    region: 'Nigeria',
    lines: ['127 Ogunlana Drive', 'Surulere, Lagos State', 'Nigeria'],
  },
  {
    id: 'malaga',
    region: 'Spain',
    lines: ['Casa Don Francisco', 'Camino del Amocafre 21-26', 'Benalmádena Pueblo, 29639 Málaga', 'Spain'],
  },
];
