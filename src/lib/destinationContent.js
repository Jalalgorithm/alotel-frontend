import londonImage from '@/assets/images/destinations/london.jpg';
import barcelonaImage from '@/assets/images/destinations/barcelona.jpg';
import madridImage from '@/assets/images/destinations/madrid.jpg';
import abujaImage from '@/assets/images/destinations/abuja.jpg';
import dubaiImage from '@/assets/images/destinations/dubai.jpg';
import newYorkImage from '@/assets/images/destinations/new-york.jpg';
import lagosImage from '@/assets/images/destinations/lagos.jpg';
/* The harbour and La Malagueta seen from the Gibralfaro walls — the shot the
   photo brief below asks for, standing in until the brand team supplies their
   own of the home port. */
import malagaImage from '@/assets/images/destinations/malaga.jpg';

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
 * Lagos properties sat in the catalogue. The lists below therefore stay a
 * superset of the neighbourhoods shown on the page: dropping an alias silently
 * hides real listings.
 *
 * Copy supplied by the client 8 September 2026 and used verbatim. Where their
 * note flags a placeholder — addresses, operators, prices — nothing has been
 * invented to fill the gap.
 *
 * `photoBrief` is the art direction from the Section 5 homepage brief. Every
 * tile image is still marked [PLACEHOLDER] there, so the brief is carried in
 * code beside the copy it belongs to rather than left in a document — it is
 * what the brand team needs to close out. The Malaga tile now carries a
 * stand-in photograph of the harbour rather than a gradient.
 */

export const DESTINATIONS = [
  {
    slug: 'london',
    photoBrief: 'Skyline or Notting Hill townhouses',
    city: 'London',
    country: 'UK',
    market: 'UK',
    code: 'GB',
    image: londonImage,
    cityAliases: ['London', 'Shoreditch', 'Notting Hill', 'Canary Wharf', 'Camden', 'Westminster', 'Southwark', 'Hackney', 'Islington', 'Kensington'],
    tagline: 'A city of a thousand neighbourhoods, one standard of stay.',
    intro:
      'London rewards those who go beyond the postcard. Our spaces sit inside the city’s real rhythm — a five-minute walk from a market, a canal, or a train that gets you anywhere in twenty minutes. Wherever you land, expect the same standard: professionally managed, quietly comfortable, genuinely yours for however long you’re here.',
    bestMonths: 'May – September',
    language: 'English',
    timezone: 'GMT / BST (UTC+0 / UTC+1)',
    gettingAround: 'Oyster card or contactless on the Tube, bus, and rail network; black cabs and ride-hailing widely available; walkable city centre.',
    neighbourhoods: [
      {
        name: 'Shoreditch',
        note: 'Converted warehouses, street art, and a nightlife scene that runs later than the Tube.',
      },
      {
        name: 'Notting Hill',
        note: 'Pastel townhouses, Portobello Market on weekends, and a slower, residential pace minutes from the centre.',
      },
      {
        name: 'Canary Wharf',
        note: 'Glass towers, riverside walks, and the city’s financial pulse — built for business stays.',
      },
    ],
    knowBefore: [
      'Tipping is appreciated, not expected — round up or add 10% in restaurants.',
      'Tap water is safe to drink everywhere.',
      'Sundays mean reduced shop and transport hours in some areas — plan ahead.',
    ],
  },
  {
    slug: 'lagos',
    photoBrief: 'Victoria Island skyline or Lekki waterfront',
    city: 'Lagos',
    country: 'Nigeria',
    market: 'Nigeria',
    code: 'NG',
    image: lagosImage,
    cityAliases: ['Lagos', 'Victoria Island', 'Ikoyi', 'Lekki', 'Ikeja', 'Yaba', 'Ojo', 'Surulere'],
    tagline: 'Energy you can’t manufacture, comfort you can count on.',
    intro:
      'Lagos moves fast, and our spaces are built to keep up — secure, well-managed, and positioned close to where the city actually happens. From island calm to mainland hustle, we’ve done the groundwork so you can focus on being here, not figuring it out.',
    bestMonths: 'November – February (dry season)',
    language: 'English (official); Yoruba widely spoken; West African Pidgin English',
    timezone: 'WAT (UTC+1)',
    gettingAround: 'Ride-hailing apps (Uber, Bolt) recommended over hailing on the street; private drivers available through concierge; traffic is heavy — build in time.',
    neighbourhoods: [
      {
        name: 'Victoria Island',
        note: 'Business towers, beach clubs, and the city’s most established address for visitors.',
      },
      {
        name: 'Ikoyi',
        note: 'Leafy, upscale, and residential — embassies, private clubs, and a calmer island pace.',
      },
      {
        name: 'Lekki',
        note: 'Newer developments, waterside dining, and the city’s fastest-growing lifestyle hub.',
      },
    ],
    knowBefore: [
      'Carry small cash (naira) for markets and informal transport; cards aren’t universal.',
      'Security checkpoints are routine, especially near government zones — carry ID.',
      'Infrastructure — our spaces run backup generators as standard.',
      'Traffic peaks hard morning and evening; our concierge can time your journeys.',
    ],
  },
  {
    slug: 'abuja',
    photoBrief: 'Aso Rock or Maitama avenue',
    city: 'Abuja',
    country: 'Nigeria',
    market: 'Nigeria',
    code: 'NG',
    image: abujaImage,
    cityAliases: ['Abuja', 'Maitama', 'Asokoro', 'Wuse', 'Wuse II', 'Garki', 'Jabi'],
    tagline: 'Ordered, green, and built for business done properly.',
    intro:
      'Abuja is Nigeria’s planned capital — wide roads, hilltop views, and a calmer tempo than Lagos. Our spaces here favour those in for government, diplomatic, or corporate business, with the reliability that kind of stay demands.',
    bestMonths: 'November – February (dry season)',
    language: 'English (official); Hausa widely spoken',
    timezone: 'WAT (UTC+1)',
    gettingAround: 'Ride-hailing apps widely used; the city is more spread out than Lagos, so private transport is recommended.',
    neighbourhoods: [
      {
        name: 'Maitama',
        note: 'The diplomatic and political heart — spacious, secure, and quiet.',
      },
      {
        name: 'Asokoro',
        note: 'Hilltop residential district favoured by senior officials; close to Aso Rock.',
      },
      {
        name: 'Wuse II',
        note: 'Central, commercial, and walkable — restaurants, shops, and business addresses.',
      },
    ],
    knowBefore: [
      'Security checkpoints are routine, especially near government zones — carry ID.',
      'Cash is still preferred at smaller vendors.',
      'Evenings cool down noticeably — pack a light layer.',
    ],
  },
  {
    slug: 'dubai',
    photoBrief: 'Downtown skyline or Marina at dusk',
    city: 'Dubai',
    country: 'UAE',
    market: 'UAE Dubai',
    code: 'AE',
    image: dubaiImage,
    cityAliases: ['Dubai', 'Downtown Dubai', 'Dubai Marina', 'Jumeirah', 'Business Bay', 'Deira', 'Palm Jumeirah'],
    tagline: 'Where the extraordinary is simply the standard.',
    intro:
      'Dubai does scale and polish better than anywhere — and our spaces match it, without losing the personal touch. Whether you’re here for business, transit, or to disappear into a rooftop pool for a week, we’ve mapped the city so your stay feels effortless from arrival to check-out.',
    bestMonths: 'November – March',
    language: 'Arabic (official); English widely spoken',
    timezone: 'GST (UTC+4)',
    gettingAround: 'Metro is efficient and affordable; taxis and ride-hailing widely available; many areas are best explored by car.',
    neighbourhoods: [
      {
        name: 'Downtown Dubai',
        note: 'Burj Khalifa, the Dubai Mall, and the fountain skyline in every direction.',
      },
      {
        name: 'Dubai Marina',
        note: 'Waterfront towers, beach clubs, and a buzzing promenade after dark.',
      },
      {
        name: 'Jumeirah',
        note: 'Beachfront villas, boutique cafés, and a quieter, residential seaside feel.',
      },
    ],
    knowBefore: [
      'Dress modestly in public and government areas — a legal expectation, not just etiquette. Beachwear stays at the beach or pool.',
      'Alcohol (21+) is legal only in licensed venues. Public drinking, public intoxication, and any drink-driving are criminal offences — fines, detention, or deportation, even for first-time visitors.',
      'Friday–Saturday is the weekend here, not Saturday–Sunday.',
    ],
  },
  {
    slug: 'madrid',
    photoBrief: 'Plaza Mayor or Malasaña street',
    city: 'Madrid',
    country: 'Spain',
    market: 'Spain',
    code: 'ES',
    image: madridImage,
    cityAliases: ['Madrid', 'Malasaña', 'Malasana', 'Salamanca', 'La Latina', 'Chueca', 'Chamberí', 'Retiro'],
    tagline: 'Late nights, long lunches, spaces made for both.',
    intro:
      'Madrid runs on its own clock, and it’s a good one to adopt. Our spaces sit inside neighbourhoods built for lingering — near the plaza, the market, the museum you’ll want to visit twice. Settle in, and let the city’s pace take over.',
    bestMonths: 'April – June, September – October',
    language: 'Spanish',
    timezone: 'CET / CEST (UTC+1 / UTC+2)',
    gettingAround: 'Extensive metro and bus network; walkable centre; taxis and ride-hailing readily available.',
    neighbourhoods: [
      {
        name: 'Malasaña',
        note: 'Independent boutiques, vintage bars, and the city’s creative, bohemian streak.',
      },
      {
        name: 'Salamanca',
        note: 'Elegant, upscale, and polished — high-end shopping and grand architecture.',
      },
      {
        name: 'La Latina',
        note: 'Historic, tapas-dense, and unmissable on a Sunday for its market and terraces.',
      },
    ],
    knowBefore: [
      'Lunch runs late (2–4pm) and dinner later still (9pm+) — restaurants open accordingly.',
      'August sees many local businesses close as residents holiday.',
      'Siesta-era closures are rarer now, but some smaller shops still pause mid-afternoon.',
    ],
  },
  {
    slug: 'barcelona',
    photoBrief: 'Sagrada Família or Barceloneta beach',
    city: 'Barcelona',
    country: 'Spain',
    market: 'Spain',
    code: 'ES',
    image: barcelonaImage,
    cityAliases: ['Barcelona', 'Gràcia', 'Gracia', 'Eixample', 'Barceloneta', 'El Born', 'Poblenou', 'Sants'],
    tagline: 'Sea, city, and design at every turn.',
    intro:
      'Barcelona layers beach, architecture, and food into one walkable city, and our spaces are chosen to put all three within reach. Wake up near Gaudí, end the day by the water — the city does the rest.',
    bestMonths: 'May – June, September',
    language: 'Catalan and Castilian Spanish',
    timezone: 'CET / CEST (UTC+1 / UTC+2)',
    gettingAround: 'Metro, bus, and tram cover the city well; bike-share is popular; the old town is best explored on foot.',
    neighbourhoods: [
      {
        name: 'Gràcia',
        note: 'Village-like squares, independent cafés, and a strong local (not tourist) feel.',
      },
      {
        name: 'Eixample',
        note: 'Grand boulevards, Modernist architecture including Gaudí landmarks, and central convenience.',
      },
      {
        name: 'Barceloneta',
        note: 'Beachfront, seafood, and the city’s most relaxed pace by the water.',
      },
    ],
    knowBefore: [
      'Pickpocketing is common in tourist-dense areas — stay alert with bags and phones.',
      'Many restaurants close between lunch and dinner service — check hours before you go.',
      'Catalan and Spanish both appear on signage; either language works for getting by.',
    ],
  },
  {
    slug: 'malaga',
    photoBrief: 'La Malagueta beach or Soho street art',
    city: 'Malaga',
    country: 'Spain',
    market: 'Spain',
    code: 'ES',
    image: malagaImage,
    cityAliases: ['Malaga', 'Málaga', 'La Malagueta', 'Soho', 'El Palo', 'Benalmádena', 'Benalmadena', 'Costa del Sol'],
    tagline: 'Our home port — coastal, unhurried, and where it all starts.',
    intro:
      'Malaga is where Alotel Spaces is headquartered, and it shows in how well we know the city. Sun-warmed, walkable, and increasingly a serious base for remote work and creative industry alongside its old-town charm — our spaces here sit close to the harbour, the historic centre, and the Costa del Sol beyond.',
    bestMonths: 'April – June, September – October',
    language: 'Spanish (Andalusian)',
    timezone: 'CET / CEST (UTC+1 / UTC+2)',
    gettingAround: 'Compact, walkable centre; local bus network and a small metro line; taxis and ride-hailing widely available; regional trains reach the wider Costa del Sol.',
    neighbourhoods: [
      {
        name: 'La Malagueta',
        note: 'Beachfront promenade, steps from the old town and the port.',
      },
      {
        name: 'Soho',
        note: 'Malaga’s arts district, street murals, galleries, and a growing creative and remote-work scene.',
      },
      {
        name: 'El Palo',
        note: 'A traditional fishing quarter, beachside chiringuitos, and a slower, local pace.',
      },
    ],
    knowBefore: [
      'Summers run hot and dry — pack sun protection and expect an afternoon lull in smaller shops.',
      'Dinner runs late by northern-European standards — most kitchens open from 8:30–9pm.',
      'This is our head office city — if a space here can’t cover something, our own team is closest to fix it fast.',
    ],
  },
  {
    slug: 'new-york',
    photoBrief: 'Manhattan skyline or Williamsburg rooftop',
    city: 'New York',
    country: 'USA',
    market: 'US',
    code: 'US',
    image: newYorkImage,
    cityAliases: ['New York', 'New York City', 'Manhattan', 'West Village', 'Williamsburg', 'Midtown', 'Brooklyn', 'Queens', 'Harlem'],
    tagline: 'The city that sets the pace — we help you keep it.',
    intro:
      'New York doesn’t slow down for anyone, so our spaces are built for guests who want to move with it — well-connected, well-managed, and ready the moment you arrive. Whichever borough or block you land on, expect the same standard throughout.',
    bestMonths: 'April – June, September – November',
    language: 'English',
    timezone: 'EST / EDT (UTC-5 / UTC-4)',
    gettingAround: 'Subway runs 24/7 and covers the city extensively; yellow cabs and ride-hailing widely available; walkable in Manhattan.',
    neighbourhoods: [
      {
        name: 'West Village',
        note: 'Tree-lined streets, historic townhouses, and a slower, residential downtown feel.',
      },
      {
        name: 'Williamsburg',
        note: 'Brooklyn’s creative hub — galleries, rooftop bars, and skyline views back to Manhattan.',
      },
      {
        name: 'Midtown',
        note: 'Central, commercial, and unmissable — Times Square, business towers, and constant motion.',
      },
    ],
    knowBefore: [
      'Tipping is standard and expected: 18–20% at restaurants, and for most services.',
      'Subway etiquette matters — stand right on escalators, let riders off before boarding.',
      'Weather swings hard by season — pack for genuine heat in summer, real cold in winter.',
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
