import { apiClient } from '@/lib/apiClient';
import { env } from '@/lib/env';
import { clone, delay } from '@/lib/mock/utils';
import { DESTINATIONS } from '@/lib/destinationContent';
import { TESTIMONIALS } from '@/lib/homeContent';

/**
 * The eight cities in scope, in the order the client's Section 5 lists them.
 *
 * Built from the destination guides rather than a separate fixture. The old
 * fixture had drifted twice over: it still carried Paris, which we do not
 * operate in, it had no Malaga, and each tile advertised an invented property
 * count. Deriving the tiles means the copy on the homepage and the copy on the
 * guide it links to are physically the same string.
 */
const TILE_ORDER = ['london', 'lagos', 'abuja', 'dubai', 'madrid', 'barcelona', 'new-york', 'malaga'];

const tiles = TILE_ORDER.map((slug) => {
  const entry = DESTINATIONS.find((destination) => destination.slug === slug);
  return {
    id: entry.slug,
    city: entry.city,
    country: entry.country,
    code: entry.code,
    image: entry.image,
    /* The client's "Tile Copy" column — which is the guide's own tagline. */
    tagline: entry.tagline,
  };
});

/** Content service backing the landing page sections. */
const mockHome = {
  async destinations(limit) {
    await delay(400);
    return clone(limit ? tiles.slice(0, limit) : tiles);
  },
  async testimonials() {
    await delay(350);
    return clone(TESTIMONIALS);
  },
};

const realHome = {
  destinations: async (limit) => (await apiClient.get('/destinations', { params: { limit } })).data,
  testimonials: async () => (await apiClient.get('/testimonials')).data,
};

const backend = env.useMock ? mockHome : realHome;

export const homeService = {
  getDestinations: (limit) => backend.destinations(limit),
  getTestimonials: () => backend.testimonials(),
};
