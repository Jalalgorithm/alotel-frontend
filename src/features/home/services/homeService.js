import { apiClient } from '@/lib/apiClient';
import { env } from '@/lib/env';
import { clone, delay } from '@/lib/mock/utils';
import { destinations, testimonials, trustStats } from '@/lib/mock/data';

/** Content service backing the landing page sections. */
const mockHome = {
  async destinations(limit) {
    await delay(400);
    return clone(limit ? destinations.slice(0, limit) : destinations);
  },
  async testimonials() {
    await delay(350);
    return clone(testimonials);
  },
  async stats() {
    await delay(300);
    return clone(trustStats);
  },
};

const realHome = {
  destinations: async (limit) => (await apiClient.get('/destinations', { params: { limit } })).data,
  testimonials: async () => (await apiClient.get('/testimonials')).data,
  stats: async () => (await apiClient.get('/stats')).data,
};

const backend = env.useMock ? mockHome : realHome;

export const homeService = {
  getDestinations: (limit) => backend.destinations(limit),
  getTestimonials: () => backend.testimonials(),
  getTrustStats: () => backend.stats(),
};
