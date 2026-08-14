import londonImage from '@/assets/images/destinations/london.jpg';
import barcelonaImage from '@/assets/images/destinations/barcelona.jpg';
import madridImage from '@/assets/images/destinations/madrid.jpg';
import abujaImage from '@/assets/images/destinations/abuja.jpg';
import dubaiImage from '@/assets/images/destinations/dubai.jpg';
import newYorkImage from '@/assets/images/destinations/new-york.jpg';
import lagosImage from '@/assets/images/destinations/lagos.jpg';

/**
 * Editorial content for each destination.
 *
 * There is no destinations endpoint — `GET /destinations/` 404s — so the
 * writing, neighbourhoods and practical notes live here. Everything that *can*
 * come from the API (how many stays, price from, which spaces) is fetched live
 * and merged on top; nothing in this file is a stand-in for a number a server
 * could tell us.
 *
 * When `GET /destinations/{slug}/` exists this file becomes its fixture and the
 * service stops importing it. The shape below is deliberately the shape that
 * endpoint should return.
 *
 * A note on `cityAliases`, which is not cosmetic: the API stores
 * neighbourhood-level names in `Property.city` — Ikoyi, Lekki and Victoria
 * Island are all Lagos, and Shoreditch is London. Matching a destination to its
 * listings on the city string alone would show an empty Lagos page while four
 * Lagos properties sat in the catalogue.
 */

export const DESTINATIONS = [
  {
    slug: 'london',
    city: 'London',
    country: 'UK',
    market: 'UK',
    code: 'GB',
    image: londonImage,
    cityAliases: ['London', 'Shoreditch', 'Camden', 'Westminster', 'Southwark', 'Hackney', 'Islington'],
    tagline: 'Nine hundred villages that agreed to share a river.',
    intro:
      'London rewards people who pick a neighbourhood before they pick a postcode. The centre is for institutions; the life is a few stops out, where the pubs still have regulars and the markets still sell food to people who live there.',
    bestMonths: 'May to September, and December for the lights',
    language: 'English',
    timezone: 'GMT / BST (UTC+0 / +1)',
    gettingAround: 'Contactless on the Tube caps your daily spend automatically — no travelcard needed.',
    neighbourhoods: [
      {
        name: 'Shoreditch',
        note: 'Converted warehouses and independent coffee. Loud on Friday and Saturday nights — take a top floor if you sleep lightly.',
        suits: 'Younger travellers, creative work trips',
      },
      {
        name: 'South Kensington',
        note: 'Museums, garden squares and quiet streets. The most conventionally beautiful part of central London, and priced accordingly.',
        suits: 'Families, longer stays',
      },
      {
        name: 'Hackney',
        note: 'Canal walks, London Fields, and the best weekend market in the city at Broadway. Twenty minutes from the centre on the Overground.',
        suits: 'Repeat visitors who want a local life',
      },
    ],
    knowBefore: [
      'Deposits are usually held rather than charged, and released within a week of checkout.',
      'Most residences are card-only — cash is genuinely awkward in London now.',
      'Councils cap short lets at 90 nights a year, so longer stays are booked as residential.',
    ],
  },
  {
    slug: 'lagos',
    city: 'Lagos',
    country: 'Nigeria',
    market: 'Nigeria',
    code: 'NG',
    image: lagosImage,
    cityAliases: ['Lagos', 'Ikoyi', 'Lekki', 'Victoria Island', 'Ikeja', 'Yaba', 'Ojo', 'Surulere'],
    tagline: 'Africa’s loudest argument in favour of ambition.',
    intro:
      'Lagos runs on proximity. Where you stay decides how much of your day you spend in traffic, and locals plan around it without thinking. The islands are calmer and pricier; the mainland is where the music comes from.',
    bestMonths: 'November to March, outside the heavy rains',
    language: 'English, Yoruba, Pidgin',
    timezone: 'WAT (UTC+1)',
    gettingAround: 'Ride-hailing is the default. Budget an hour for anything crossing the bridges at rush hour.',
    neighbourhoods: [
      {
        name: 'Ikoyi',
        note: 'Old money, tree-lined and quiet. Closest thing Lagos has to a residential hush, and the easiest base for meetings on the island.',
        suits: 'Business trips, families',
      },
      {
        name: 'Victoria Island',
        note: 'Offices, hotels and the restaurant scene. Convenient rather than charming, and you will never struggle to find dinner.',
        suits: 'Short business stays',
      },
      {
        name: 'Lekki',
        note: 'Newer, more spread out, and where much of the city is moving. Beaches at the far end; the traffic on the expressway is the trade-off.',
        suits: 'Longer stays, remote work',
      },
    ],
    knowBefore: [
      'Payment is by card via Flutterwave — Nigerian listings do not settle through Stripe.',
      'Most residences run a generator or inverter; ask about backup power for long stays.',
      'Prices are quoted in naira and can move quickly. What you are shown at checkout is what is charged.',
    ],
  },
  {
    slug: 'abuja',
    city: 'Abuja',
    country: 'Nigeria',
    market: 'Nigeria',
    code: 'NG',
    image: abujaImage,
    cityAliases: ['Abuja', 'Maitama', 'Asokoro', 'Wuse', 'Garki', 'Jabi'],
    tagline: 'A capital built on purpose, and it shows.',
    intro:
      'Abuja was planned, and unlike Lagos it feels it — wide roads, green space, and a calm that surprises first-time visitors. It is a government and business city first, which makes it easy to work in and quiet at weekends.',
    bestMonths: 'November to February, the dry and cooler months',
    language: 'English, Hausa',
    timezone: 'WAT (UTC+1)',
    gettingAround: 'Distances are long but roads are good. Ride-hailing is reliable and cheap by Lagos standards.',
    neighbourhoods: [
      {
        name: 'Maitama',
        note: 'Embassies and the quietest streets in the city. Green, low-density and the most expensive address in Abuja.',
        suits: 'Diplomatic and executive stays',
      },
      {
        name: 'Wuse II',
        note: 'The commercial middle — restaurants, banks and offices within walking distance of each other, which is rare here.',
        suits: 'Business trips',
      },
      {
        name: 'Jabi',
        note: 'Built around the lake, with the waterfront and the mall as the social centre. Newer buildings and better value.',
        suits: 'Longer stays, families',
      },
    ],
    knowBefore: [
      'Payment is by card via Flutterwave, as everywhere in Nigeria.',
      'Weekends are genuinely quiet — plan around it rather than being surprised.',
      'Check backup power arrangements for any stay over a few nights.',
    ],
  },
  {
    slug: 'dubai',
    city: 'Dubai',
    country: 'UAE',
    market: 'UAE Dubai',
    code: 'AE',
    image: dubaiImage,
    cityAliases: ['Dubai', 'Downtown Dubai', 'Dubai Marina', 'Jumeirah', 'Business Bay', 'Deira', 'Al Barsha'],
    tagline: 'A city that treats the impossible as a scheduling problem.',
    intro:
      'Dubai is easier to enjoy once you stop trying to see all of it. Pick a strip — the Marina, Downtown, or the old creek — and stay within it. Everything is air-conditioned and everything is further away than it looks on a map.',
    bestMonths: 'November to March. July and August are brutal.',
    language: 'Arabic, English everywhere',
    timezone: 'GST (UTC+4)',
    gettingAround: 'The Metro is excellent along its two lines and useless off them. Taxis are cheap and metered.',
    neighbourhoods: [
      {
        name: 'Dubai Marina',
        note: 'High-rise living on the water with the beach a walk away. The most self-contained part of the city — you need not leave it.',
        suits: 'Leisure stays, longer visits',
      },
      {
        name: 'Downtown',
        note: 'The Burj, the fountains and the mall. Spectacular and busy; excellent if your reason for coming is within it.',
        suits: 'Short first visits',
      },
      {
        name: 'Deira',
        note: 'The old city across the creek — the gold and spice souks, and where Dubai feels most like somewhere with a past.',
        suits: 'Travellers who want the older city',
      },
    ],
    knowBefore: [
      'There is no postal-code system — addresses are building and area names, so a street address is what matters.',
      'Payment is by card via Stripe.',
      'Ramadan changes opening hours and daytime dining considerably; check dates before booking.',
    ],
  },
  {
    slug: 'madrid',
    city: 'Madrid',
    country: 'Spain',
    market: 'Spain',
    code: 'ES',
    image: madridImage,
    cityAliases: ['Madrid', 'Malasaña', 'Chueca', 'La Latina', 'Salamanca', 'Retiro', 'Chamberí'],
    tagline: 'Europe’s least hurried capital, and its latest dinner.',
    intro:
      'Madrid keeps different hours to the rest of Europe and expects you to keep up. Lunch is late, dinner is later, and the city is at its best in the hours either side of midnight. It is also flat, walkable and far cheaper than Barcelona.',
    bestMonths: 'April to June, and September to November',
    language: 'Spanish',
    timezone: 'CET / CEST (UTC+1 / +2)',
    gettingAround: 'The Metro is fast, cheap and covers everything. Most of the centre is walkable anyway.',
    neighbourhoods: [
      {
        name: 'Malasaña',
        note: 'Bars, record shops and the best of the city’s late nights. Central, characterful and noisy — which is the point.',
        suits: 'Younger travellers, short stays',
      },
      {
        name: 'Salamanca',
        note: 'Wide avenues and serious shopping. The quietest and most formal central district, and the easiest place to sleep.',
        suits: 'Business, families, longer stays',
      },
      {
        name: 'La Latina',
        note: 'The oldest streets, the Sunday Rastro market and tapas bars that have not changed in decades.',
        suits: 'First visits, food-led trips',
      },
    ],
    knowBefore: [
      'Payment is by card via Stripe.',
      'Spain applies a regional tourist tax in several areas — it appears as a line at checkout where it is due.',
      'Most kitchens do not open for dinner before 20:30, and are busiest after 22:00.',
    ],
  },
  {
    slug: 'barcelona',
    city: 'Barcelona',
    country: 'Spain',
    market: 'Spain',
    code: 'ES',
    image: barcelonaImage,
    cityAliases: ['Barcelona', 'Eixample', 'Gràcia', 'El Born', 'Barceloneta', 'Gothic Quarter', 'Poblenou'],
    tagline: 'A grid designed in 1859 that still works better than most built since.',
    intro:
      'Barcelona is a city you can walk end to end, with a beach at the bottom and hills at the top. It is also under real pressure from tourism, and the parts that reward you most are the ones a few blocks off the obvious route.',
    bestMonths: 'May, June, September and October',
    language: 'Catalan and Spanish',
    timezone: 'CET / CEST (UTC+1 / +2)',
    gettingAround: 'Walkable, with a Metro that fills the gaps. The bike network is genuinely good.',
    neighbourhoods: [
      {
        name: 'Eixample',
        note: 'Cerdà’s grid, the modernist buildings and the widest streets in the city. Central without being overrun.',
        suits: 'First visits, families',
      },
      {
        name: 'Gràcia',
        note: 'A separate town until 1897 and still behaves like one — small squares, independent shops, and residents who live there year-round.',
        suits: 'Longer stays, repeat visitors',
      },
      {
        name: 'El Born',
        note: 'Medieval lanes, the Picasso museum and the best concentration of small restaurants. Busy, and worth it.',
        suits: 'Short stays, food-led trips',
      },
    ],
    knowBefore: [
      'Payment is by card via Stripe.',
      'Catalonia levies a tourist tax per night, shown separately at checkout.',
      'Short-let licensing is tightly enforced here — every Alotel residence is licensed.',
    ],
  },
  {
    slug: 'new-york',
    city: 'New York',
    country: 'United States',
    market: 'US',
    code: 'US',
    image: newYorkImage,
    cityAliases: ['New York', 'New York City', 'Manhattan', 'Brooklyn', 'Queens', 'Harlem', 'Williamsburg'],
    tagline: 'The only city that is exactly as advertised.',
    intro:
      'New York is dense enough that the neighbourhood you choose decides the trip. Manhattan below 96th is convenient and expensive; Brooklyn is where more people would rather actually be. Both are twenty minutes from the other.',
    bestMonths: 'April to June, and September to early November',
    language: 'English',
    timezone: 'ET (UTC−5 / −4)',
    gettingAround: 'The subway runs all night and is the fastest thing on the island. Buy an OMNY tap or use contactless.',
    neighbourhoods: [
      {
        name: 'West Village',
        note: 'Low buildings, crooked streets and the least grid-like part of Manhattan. Expensive and worth a walk regardless of where you stay.',
        suits: 'Couples, short stays',
      },
      {
        name: 'Williamsburg',
        note: 'Across the river with the best skyline view back at Manhattan. Food, music and a walkable centre.',
        suits: 'Longer stays, repeat visitors',
      },
      {
        name: 'Upper West Side',
        note: 'The park on one side, the river on the other, and a genuinely residential feel. Quiet by New York standards.',
        suits: 'Families',
      },
    ],
    knowBefore: [
      'Payment is by card via Stripe.',
      'New York stacks state, city and occupancy taxes — each appears as its own line at checkout.',
      'Stays under 30 days are tightly regulated in NYC; every Alotel residence is registered.',
    ],
  },
];

export const findDestination = (slug) => DESTINATIONS.find((entry) => entry.slug === slug) ?? null;

/**
 * Does a listing belong to this destination?
 *
 * Compares against the alias list rather than the city string, because the API
 * stores neighbourhoods in `city` — "Ikoyi" is a Lagos listing and "Shoreditch"
 * is a London one.
 */
export const belongsToDestination = (destination, listing) => {
  if (!destination || !listing) return false;

  const city = (listing.city ?? '').trim().toLowerCase();
  return destination.cityAliases.some((alias) => alias.toLowerCase() === city);
};
