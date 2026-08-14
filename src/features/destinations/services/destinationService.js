import { propertyService } from '@/features/properties';
import { spaceService } from '@/features/spaces/services/spaceService';
import { belongsToDestination, DESTINATIONS, findDestination } from '@/lib/destinationContent';

/**
 * Destinations — editorial content joined to live inventory.
 *
 * There is no `/destinations/` endpoint, so this is a composition rather than a
 * fetch: the writing comes from `destinationContent`, and everything countable
 * comes from the property and space APIs. Nothing numeric here is invented.
 *
 * The join is done client-side because the API offers no faceting. That has a
 * real limit worth stating: `/properties/` is paginated, so counts are taken
 * across the pages actually fetched rather than the whole catalogue. A
 * `GET /properties/facets/?group_by=city` would replace all of this with one
 * request and make the numbers exact.
 */

/** How many pages of properties to sweep when counting. Keeps it bounded. */
const MAX_PAGES = 5;

const fetchAllProperties = async () => {
  const collected = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await propertyService.getProperties({ page });
    const items = result?.items ?? [];
    collected.push(...items);

    const total = result?.total ?? collected.length;
    if (!items.length || collected.length >= total) break;
  }

  return collected;
};

const summarise = (destination, properties, spaces) => {
  const stays = properties.filter((property) => belongsToDestination(destination, property));
  const rooms = spaces.filter((space) => belongsToDestination(destination, space));

  const prices = stays.map((property) => property.price).filter((price) => Number.isFinite(price) && price > 0);

  return {
    ...destination,
    stayCount: stays.length,
    spaceCount: rooms.length,
    /* Null rather than 0 — "no listings yet" and "free" are different facts. */
    priceFrom: prices.length ? Math.min(...prices) : null,
    currency: stays[0]?.currency ?? rooms[0]?.currency ?? null,
    properties: stays,
    spaces: rooms,
  };
};

export const destinationService = {
  /**
   * Every destination with live counts attached.
   *
   * Properties and spaces are fetched once and matched against all
   * destinations, rather than once per destination.
   */
  async list() {
    const [properties, spaces] = await Promise.all([
      fetchAllProperties(),
      spaceService.getSpaces({}).then((result) => result.items ?? []).catch(() => []),
    ]);

    return DESTINATIONS.map((destination) => summarise(destination, properties, spaces));
  },

  async detail(slug) {
    const destination = findDestination(slug);
    if (!destination) return null;

    const [properties, spaces] = await Promise.all([
      fetchAllProperties(),
      spaceService.getSpaces({}).then((result) => result.items ?? []).catch(() => []),
    ]);

    return summarise(destination, properties, spaces);
  },
};
