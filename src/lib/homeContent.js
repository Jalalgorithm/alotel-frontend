/**
 * Homepage content — the client's Section 5, supplied 8 September 2026.
 *
 * Three of that section's four blocks arrived flagged rather than approved, and
 * this file reflects that rather than papering over it:
 *
 *  - Destination tiles are approved, and come from `destinationContent` so the
 *    tile copy can never drift from the city guide it links to.
 *  - Testimonials are marked "DRAFT ONLY, NOT FOR PUBLICATION" and need a
 *    signed release per guest. `TESTIMONIALS` is therefore empty, and the
 *    homepage band hides itself until it is filled. Nothing is invented in the
 *    meantime — the three quotes that used to sit here were ours, not guests'.
 *  - Trust statistics were all `[PLACEHOLDER]`. The client's own instruction
 *    was to replace them with a qualitative line or remove the section rather
 *    than risk an unverifiable claim, so `ASSURANCES` states four things that
 *    are true today and countable by anyone who looks.
 *  - Value propositions are marked "ready for approval" and are used verbatim.
 */

/**
 * Guest testimonials.
 *
 * Deliberately empty. Fill it — three entries, one each for Nigeria, Dubai and
 * Spain per the brief — and the homepage band appears with no code change.
 * Every entry needs a real quote and a signed permission/release on file.
 *
 * Shape: { id, name, location, quote, rating, avatar? }
 */
export const TESTIMONIALS = [];

/**
 * What replaced the four placeholder statistics.
 *
 * Each line describes a mechanism the product actually has, so none of them
 * needs Finance to verify a number before launch. Swap any one for a real
 * figure the moment there is data behind it.
 */
export const ASSURANCES = [
  {
    id: 'verified',
    icon: 'BadgeCheck',
    title: 'Every space verified',
    body: 'Identity, quality and safety checks before a listing ever appears.',
  },
  {
    id: 'protection',
    icon: 'ShieldCheck',
    title: 'Stay Protection on every booking',
    body: 'Secure payments and support on call, at no extra cost.',
  },
  {
    id: 'managed',
    icon: 'ClipboardCheck',
    title: 'Professionally managed',
    body: 'One standard across every city we operate in, not a marketplace average.',
  },
  {
    id: 'access',
    icon: 'Accessibility',
    title: 'Accessible by default',
    body: 'Accessibility is a baseline we source for, not a filter we bolt on.',
  },
];

/**
 * Ten value propositions, split by who they are for.
 *
 * `title` and `body` are the client's own two-part construction — a short claim
 * followed by the sentence that earns it — kept separate so the claim can carry
 * its own weight typographically.
 */
export const VALUE_PROPS = [
  {
    id: 'visitors',
    audience: 'For visitors',
    items: [
      {
        id: 'spaces-not-rooms',
        icon: 'LayoutGrid',
        title: 'Spaces, not rooms',
        body: 'Designed for how people live and work away from home.',
      },
      {
        id: 'managed',
        icon: 'BadgeCheck',
        title: 'Professionally managed, always',
        body: 'Every space held to one consistent standard, wherever you are.',
      },
      {
        id: 'inclusive',
        icon: 'Accessibility',
        title: 'Inclusive to all',
        body: 'We take accessibility seriously and actively source accessible accommodation assets — a baseline, not an add-on.',
      },
      {
        id: 'protection',
        icon: 'ShieldCheck',
        title: 'Stay Protection, built in',
        body: 'Verified listings, secure payments, and support on call — no extra cost.',
      },
      {
        id: 'concierge',
        icon: 'ConciergeBell',
        title: 'Concierge, beyond the listing',
        body: "If a space can't meet what you need, our concierge finds a way.",
      },
      {
        id: 'local',
        icon: 'Globe',
        title: 'Local expertise, global standard',
        body: 'Native teams in every market, one brand promise everywhere.',
      },
    ],
  },
  {
    id: 'corporate',
    audience: 'For corporate',
    items: [
      {
        id: 'studios',
        icon: 'Mic',
        title: 'Podcast & content studios, in-house',
        body: 'Cubicle, Studio and Debate Room setups in Lagos — for creators, brands, and businesses who need more than a hotel room.',
      },
      {
        id: 'content',
        icon: 'Clapperboard',
        title: 'Corporate content, done for you',
        body: 'From Authority Retainers to Employee Experience programmes — production, strategy, and distribution bundled with one partner.',
      },
      {
        id: 'franchise',
        icon: 'Handshake',
        title: 'A franchise model, not just a service',
        body: 'Hotels and offices can license the studio concept — fit-out, training, and revenue share, with no new hires required.',
      },
      {
        id: 'two-audiences',
        icon: 'Users',
        title: 'One brand, two audiences',
        body: 'The same standard of professional management serving individual travellers and corporate clients alike.',
      },
    ],
  },
];
