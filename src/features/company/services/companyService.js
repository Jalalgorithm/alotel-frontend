import { destinationService } from '@/features/destinations/services/destinationService';

/**
 * Company figures for the About page.
 *
 * These deliberately replace the mocked "100K+ verified guests" and "5,200
 * move-ins" that the homepage strip carries. Those are invented, and an About
 * page is exactly where an invented number stops being decorative and starts
 * being a claim about the company.
 *
 * Everything below is counted from the live catalogue. The numbers are smaller
 * and they are true. When `GET /stats/` exists it can supply audited figures —
 * guests served, nights booked — that no client-side count could reach.
 */
export const companyService = {
  async stats() {
    const destinations = await destinationService.list();

    const residences = destinations.reduce((sum, entry) => sum + entry.stayCount, 0);
    const spaces = destinations.reduce((sum, entry) => sum + entry.spaceCount, 0);

    /* Only count a city as "covered" if something is actually listed there. */
    const citiesCovered = destinations.filter((entry) => entry.stayCount + entry.spaceCount > 0).length;
    const markets = new Set(
      destinations.filter((entry) => entry.stayCount + entry.spaceCount > 0).map((entry) => entry.market),
    ).size;

    return [
      { id: 'residences', value: String(residences), label: 'Residences listed' },
      { id: 'spaces', value: String(spaces), label: 'Spaces to hire' },
      { id: 'cities', value: String(citiesCovered), label: 'Cities covered' },
      { id: 'markets', value: String(markets), label: 'Markets operated' },
    ];
  },
};
