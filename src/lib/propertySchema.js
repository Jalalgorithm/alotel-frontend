/**
 * Translation between the API's property shape and the shape the guest UI
 * renders.
 *
 * The API is the admin's vocabulary — `baseRate`, `maxGuests`, `accessFeatures`.
 * The guest components were built against the mock's vocabulary — `price`,
 * `guests`, `beds`. Normalising here means no component changes when the mock
 * flag flips, which is the same contract `authService` keeps.
 */

/** Matches the API's `type` choices exactly; 'All' is the UI's own no-op. */
export const PROPERTY_TYPE_FILTERS = [
  'All',
  'Studio',
  '1-Bedroom Flat',
  '2-Bedroom Flat',
  '3-Bedroom Flat',
  'House',
  'Duplex',
  'Bungalow',
  'Luxury Suite',
];

/** The API's market list, used by the destination filter. */
export const LOCATIONS = ['UK', 'Spain', 'Nigeria', 'UAE Dubai', 'US'];

const CURRENCY_BY_LOCATION = {
  UK: 'GBP',
  Spain: 'EUR',
  Nigeria: 'NGN',
  'UAE Dubai': 'AED',
  US: 'USD',
};

/**
 * Map a market back to the landing page's destination ids, so a property
 * opened from a destination tile still filters correctly.
 */
const DESTINATION_BY_CITY = {
  London: 'london',
  Barcelona: 'barcelona',
  Madrid: 'madrid',
  Abuja: 'abuja',
  Dubai: 'dubai',
  'New York': 'new-york',
  Lagos: 'lagos',
  Paris: 'paris',
};

/* -------------------------------------------------------------------------- */
/* Imagery                                                                     */
/* -------------------------------------------------------------------------- */

const img = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/**
 * Listings carry their own photography — `thumbNail` on the list endpoint and
 * a full gallery under `/properties/{id}/images/`.
 *
 * This set is the fallback for a listing that has not had photos uploaded yet:
 * a stable choice keyed off the id, so an un-photographed property still looks
 * deliberate in the grid and looks the same everywhere it appears, rather than
 * leaving a hole in a photography-led design.
 */
const PLACEHOLDER_SETS = [
  ['1600607687939-ce8a6c25118c', '1600566753086-00f18fb6b3ea', '1600585154340-be6161a56a0c', '1582719478250-c89cae4dc85b'],
  ['1613490493576-7fde63acd811', '1600596542815-ffad4c1539a9', '1512917774080-9991f1c4c750', '1600210492486-724fe5c67fb0'],
  ['1502672260266-1c1ef2d93688', '1560448204-e02f11c3d0e2', '1556911220-bff31c812dba', '1493809842364-78817add7ffb'],
  ['1522708323590-d24dbb6b0267', '1484154218962-a197022b5858', '1505693416388-ac5ce068fe85', '1540518614846-7eded433c457'],
  ['1560185007-cde436f6a4d0', '1567767292278-a4f21aa2d36e', '1522771739844-6a9f6d5f14af', '1571003123894-1f0594d2b5d9'],
  ['1580587771525-78b9dba3b914', '1613977257363-707ba9348227', '1554995207-c18c203602cb', '1583608205776-bfd35f0d9f83'],
];

/** Deterministic index from the property id, so the choice never shuffles. */
const hashIndex = (id = '', buckets) => {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 100000;
  }
  return hash % buckets;
};

/**
 * Build the gallery.
 *
 * `gallery` is the `/images/` collection, which only the detail request fetches;
 * list rows have just a thumbnail. The thumbnail leads either way so the card a
 * guest clicked and the first frame of the gallery are the same photo.
 */
const imagesFor = (raw, gallery) => {
  const uploaded = (Array.isArray(gallery) ? gallery : [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((entry) => entry.property_image)
    .filter(Boolean);

  const combined = [raw.thumbNail, ...uploaded].filter(Boolean);
  if (combined.length) return [...new Set(combined)];

  return PLACEHOLDER_SETS[hashIndex(String(raw.id), PLACEHOLDER_SETS.length)].map((id) => img(id));
};

/* -------------------------------------------------------------------------- */
/* Normalisation                                                               */
/* -------------------------------------------------------------------------- */

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const SQM_TO_SQFT = 10.7639;

/**
 * Highlights are marketing copy the API does not model. Deriving a few lines
 * from real fields keeps the detail page's layout intact without inventing
 * facts about the property.
 */
const highlightsFor = (raw, amenities) => {
  const lines = [];

  if (raw.bedrooms) lines.push(`${raw.bedrooms}-bedroom layout sleeping up to ${raw.maxGuests} guests`);
  else lines.push(`Studio layout sleeping up to ${raw.maxGuests} guests`);

  if (toNumber(raw.area)) lines.push(`${Math.round(toNumber(raw.area))} m² of living space`);
  if (raw.furnished) lines.push(raw.furnished);
  if (raw.pets && raw.pets !== 'No pets') lines.push(raw.pets);
  if (raw.instantBook) lines.push('Instant booking — no waiting for approval');
  if (raw.minStay > 1) lines.push(`Minimum stay of ${raw.minStay} nights`);

  amenities.slice(0, 3).forEach((amenity) => lines.push(amenity));

  return lines;
};

/**
 * Normalise one API property into the guest shape.
 *
 * @param {object} raw
 * @param {Array<{ property_image: string, order: number, roomType: string, caption: string }>} [gallery]
 *   The `/images/` collection, when the caller has fetched it.
 */
export const toProperty = (raw, gallery) => {
  if (!raw) return null;

  const amenities = raw.amenities ?? [];
  const areaSqm = toNumber(raw.area);
  const breakdown = raw.price_breakdown ?? null;

  return {
    id: raw.id,
    name: raw.name,
    shortName: raw.name,

    city: raw.city,
    country: raw.country,
    address: raw.address,
    state: raw.state,
    coordinates: raw.coordinates ?? null,
    location: raw.location,
    destinationId: DESTINATION_BY_CITY[raw.city] ?? null,

    type: raw.type,
    price: toNumber(raw.baseRate) ?? 0,
    weekendPrice: toNumber(raw.weekendRate),
    monthlyPrice: toNumber(raw.monthlyRate),
    currency: breakdown?.currency ?? CURRENCY_BY_LOCATION[raw.location] ?? 'GBP',

    beds: raw.bedrooms ?? 0,
    baths: toNumber(raw.bathrooms) ?? 0,
    guests: raw.maxGuests ?? 1,
    areaSqm,
    areaSqft: areaSqm ? Math.round(areaSqm * SQM_TO_SQFT) : null,

    furnished: raw.furnished,
    pets: raw.pets,
    amenities,
    accessFeatures: raw.accessFeatures ?? [],
    highlights: highlightsFor(raw, amenities),

    rating: toNumber(raw.rating),
    reviewCount: raw.reviewCount ?? 0,

    cleaningFee: toNumber(raw.cleaningFee) ?? 0,
    securityDeposit: toNumber(raw.securityDeposit) ?? 0,
    /** The API bundles service fees into tax rules rather than a flat fee. */
    serviceFee: 0,
    minStay: raw.minStay ?? 1,
    maxStay: raw.maxStay ?? null,
    instantBook: Boolean(raw.instantBook),

    images: imagesFor(raw, gallery),
    /** Room labels for the gallery captions, empty on list rows. */
    gallery: (Array.isArray(gallery) ? gallery : []).map((entry) => ({
      url: entry.property_image,
      roomType: entry.roomType,
      caption: entry.caption,
    })),
    verified: raw.status === 'published',
    availableForRent: raw.status === 'published',

    publishedAt: raw.publishedAt,

    /**
     * Detail responses only. The booking sidebar reads `sample_one_night` for
     * the authoritative per-night total rather than adding fees itself.
     */
    priceBreakdown: breakdown,
    sampleNight: breakdown?.sample_one_night ?? null,

    /**
     * Not modelled by the API — the components that use these fall back to
     * their own empty states.
     */
    description: [],
    landmarks: [],
    manager: null,
    bedConfiguration: null,
    bathroomConfiguration: null,
  };
};

/**
 * Normalise a DRF paginated envelope into the shape the grid expects.
 *
 * The callback is written out rather than passed point-free: `map` supplies the
 * index as a second argument, which `toProperty` would read as a gallery.
 */
export const toPage = (raw, { page = 1, pageSize = 10 } = {}) => ({
  items: (raw?.results ?? []).map((entry) => toProperty(entry)),
  total: raw?.count ?? 0,
  page,
  pageSize,
  totalPages: Math.max(1, Math.ceil((raw?.count ?? 0) / pageSize)),
});

/**
 * The API validates `sort` against a closed set and 400s on anything else, so
 * only the two orderings it actually implements are forwarded. `recommended`
 * and `rating` are the UI's own labels for "leave it to the server's default"
 * — the API has no rating sort.
 */
const SORT_PARAM = {
  'price-asc': 'price_asc',
  'price-desc': 'price_desc',
};

/**
 * Translate guest filter state into API query parameters.
 *
 * Anything left at its default is omitted: the API treats an unknown value as
 * a real filter and would return nothing, and any query param bypasses the
 * server's 15-minute list cache.
 */
export const toListParams = ({
  query,
  type,
  location,
  destinationId,
  minPrice,
  maxPrice,
  bedrooms,
  amenities,
  accessibility,
  sort,
  page = 1,
} = {}) => {
  const params = { page };

  if (query?.trim()) params.q = query.trim();
  if (type && type !== 'All') params.property_type = type;
  if (minPrice !== undefined && minPrice !== '') params.price_min = minPrice;
  if (maxPrice !== undefined && maxPrice !== '') params.price_max = maxPrice;
  if (bedrooms && bedrooms !== 'All') params.bedrooms = bedrooms;
  if (amenities?.length) params.amenities = amenities.join(',');
  if (accessibility?.length) params.accessibility = accessibility.join(',');
  if (SORT_PARAM[sort]) params.sort = SORT_PARAM[sort];

  /**
   * `location` is matched against the market, country, state, city *and*
   * address, so a destination tile's city goes through the same param as an
   * explicit market choice.
   */
  const destinationCity =
    destinationId && Object.entries(DESTINATION_BY_CITY).find(([, id]) => id === destinationId)?.[0];
  const place = (location && location !== 'All' && location) || destinationCity;
  if (place) params.location = place;

  return params;
};

/**
 * Guest capacity is not a filter the API supports, so it is applied to the
 * page the server returned. This narrows a page rather than the whole result
 * set — acceptable for a soft preference, and honest about the limitation.
 */
export const filterByGuests = (items, guests) =>
  guests ? items.filter((property) => property.guests >= Number(guests)) : items;
