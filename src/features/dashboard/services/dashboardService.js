import { env } from '@/lib/env';
import { delay } from '@/lib/mock/utils';
import { bookingService } from '@/features/booking';
import { wishlistService } from '@/features/properties';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { nightsBetweenIso, todayIso } from '@/lib/bookingSchema';

/**
 * Dashboard summary.
 *
 * There is no `/dashboard/summary` endpoint — the API exposes the guest's
 * bookings and wishlist separately, and the stats are just counts over them.
 * Composing here rather than inventing an endpoint means the figures can never
 * disagree with the lists rendered directly beneath them.
 */

const summarise = (bookings, saved) => {
  const today = todayIso();

  /** "Upcoming" excludes stays that were cancelled or refunded. */
  const live = bookings.filter((booking) => !['cancelled', 'refunded'].includes(booking.status));
  const upcoming = live.filter((booking) => booking.checkIn >= today);

  const nights = live.reduce(
    (total, booking) => total + (booking.nights || nightsBetweenIso(booking.checkIn, booking.checkOut)),
    0,
  );

  return {
    totalBookings: bookings.length,
    upcomingStays: upcoming.length,
    nightsBooked: nights,
    savedProperties: saved.length,
    bookings,
    saved,
  };
};

const mockDashboard = {
  async summary() {
    await delay(350);
    const bookings = await bookingService.getBookings();

    return {
      ...summarise(bookings, []),
      savedProperties: useFavoritesStore.getState().ids.length,
    };
  },
};

const realDashboard = {
  async summary() {
    /**
     * Both lists are needed either way, so fetch them together — and tolerate
     * the wishlist failing on its own, since a broken save list should not
     * blank out a guest's bookings.
     */
    const [bookings, saved] = await Promise.all([
      bookingService.getBookings(),
      wishlistService.getSaved().catch(() => []),
    ]);

    return summarise(bookings, saved);
  },
};

const backend = env.useMockBookings ? mockDashboard : realDashboard;

export const dashboardService = {
  getSummary: () => backend.summary(),
};
