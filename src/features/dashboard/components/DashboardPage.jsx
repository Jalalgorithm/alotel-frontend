import { useState } from 'react';
import { BadgeCheck, CalendarCheck, Heart, Moon, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatCard } from './StatCard';
import { BookingList } from './BookingList';
import { SavedPropertyList } from './SavedPropertyList';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useAuth, useLogout } from '@/features/auth';
import { useMergeLocalFavorites } from '@/features/properties';
import { formatDate, getInitials } from '@/utils/format';
import { paths } from '@/routes/paths';
import { cn } from '@/utils/classNames';
import { todayIso } from '@/lib/bookingSchema';
import { useNavigate } from 'react-router-dom';

/** KYC status values the API returns, mapped to a badge. */
const KYC_BADGE = {
  verified: { label: 'Identity verified', variant: 'verified' },
  pending: { label: 'Identity under review', variant: 'gold' },
  rejected: { label: 'Identity rejected', variant: 'neutral' },
  unverified: { label: 'Identity not verified', variant: 'neutral' },
};

const BOOKING_TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all', label: 'All' },
];

/** Which bookings belong under each tab. */
const filterBookings = (bookings = [], tab) => {
  const today = todayIso();

  if (tab === 'cancelled') return bookings.filter((b) => ['cancelled', 'refunded'].includes(b.status));
  if (tab === 'all') return bookings;

  const live = bookings.filter((b) => !['cancelled', 'refunded'].includes(b.status));
  return tab === 'upcoming'
    ? live.filter((b) => b.checkOut >= today)
    : live.filter((b) => b.checkOut < today);
};

/** Protected landing area for a signed-in guest. */
export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isPending: isSummaryPending } = useDashboardSummary();
  const { logout, isPending } = useLogout();
  const [activeTab, setTab] = useState('upcoming');

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  // Anything hearted before signing in follows the guest into their account.
  useMergeLocalFavorites();

  // A failed summary should degrade to empty state, never blank the page.
  const summary = data ?? {
    totalBookings: 0,
    upcomingStays: 0,
    nightsBooked: 0,
    savedProperties: 0,
    bookings: [],
    saved: [],
  };
  const isLoading = isSummaryPending;

  return (
    <div className="shell py-10">
      {/* Welcome */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-700 text-[15px] font-semibold text-white sm:size-12">
            {getInitials(user?.fullName ?? '')}
          </span>

          <div className="min-w-0">
            <h1 className="font-display text-[20px] font-bold sm:text-[24px]">Welcome back, {firstName}.</h1>
            <p className="mt-0.5 truncate text-[12px] text-ink-soft sm:text-[13px]">
              {user?.email}
              {/* The API doesn't return a join date, so only show it when we
                  actually have one rather than printing an em-dash. */}
              {user?.memberSince && ` · Member since ${formatDate(user.memberSince, 'MMMM yyyy')}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button to={paths.properties} className="flex-1 sm:flex-none">
            Book a stay
          </Button>
          <Button
            variant="secondary"
            className="flex-1 sm:flex-none"
            isLoading={isPending}
            onClick={() => logout(undefined, { onSuccess: () => navigate(paths.home) })}
          >
            Sign out
          </Button>
        </div>
      </header>

      {/* Verification chips — driven by the KYC record the API returns, so
          they always reflect real state rather than an assumed one. */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge variant={KYC_BADGE[user?.kycStatus]?.variant ?? 'neutral'} icon={<ShieldCheck className="size-3" />}>
          {KYC_BADGE[user?.kycStatus]?.label ?? 'Identity not verified'}
        </Badge>
        {user?.twoFactorEnabled && (
          <Badge variant="verified" icon={<BadgeCheck className="size-3" />}>
            Two-factor enabled
          </Badge>
        )}
      </div>

      {/* Stats */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-card" />)
          : [
              { label: 'Total bookings', value: summary.totalBookings, icon: CalendarCheck },
              { label: 'Upcoming stays', value: summary.upcomingStays, icon: CalendarCheck },
              { label: 'Nights booked', value: summary.nightsBooked, icon: Moon },
              { label: 'Saved properties', value: summary.savedProperties, icon: Heart },
            ].map((stat) => <StatCard key={stat.label} {...stat} />)}
      </section>

      {/* Bookings */}
      <section className="mt-10 rounded-card border border-line bg-surface p-5 shadow-card">
        <h2 className="font-display text-lg font-semibold">Your bookings</h2>
        <p className="section-sub mt-1">Track the status of every reservation you have made.</p>

        {/* Splitting by where a stay sits in time is the division that actually
            matters to a guest — a past stay needs nothing from them. */}
        <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-1">
          {BOOKING_TABS.map((tab) => {
            const count = filterBookings(summary.bookings, tab.id).length;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                aria-pressed={tab.id === activeTab}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors',
                  tab.id === activeTab
                    ? 'border-brand-700 bg-brand-700 text-white'
                    : 'border-line bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700',
                )}
              >
                {tab.label}
                <span className={cn('ml-1.5', tab.id === activeTab ? 'text-white/70' : 'text-ink-muted')}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }, (_, index) => (
                <Skeleton key={index} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : (
            <BookingList bookings={filterBookings(summary.bookings, activeTab)} />
          )}
        </div>
      </section>

      {/* Saved properties */}
      <section className="mt-6 rounded-card border border-line bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Saved properties</h2>
            <p className="section-sub mt-1">Residences you have hearted, kept with your account.</p>
          </div>
          {summary?.saved?.length > 0 && (
            <Button variant="secondary" size="sm" to={paths.properties}>
              Browse more
            </Button>
          )}
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : (
            <SavedPropertyList saved={summary.saved} />
          )}
        </div>
      </section>
    </div>
  );
};
