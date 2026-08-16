import { useQuery } from '@tanstack/react-query';
import { Banknote, CheckCircle2, Lock, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/classNames';
import { formatCurrency, formatDate } from '@/utils/format';
import { queryKeys } from '@/lib/queryKeys';
import { bookingService } from '../services/bookingService';

/**
 * Where the security deposit actually is.
 *
 * The guest could always see the deposit *amount* on their invoice, but never
 * whether it was held, released or deducted — the endpoint was Super-Admin-only
 * until recently. That gap sat directly under a promise we make out loud on the
 * About page: "deposits held, not taken". This is what makes that checkable.
 *
 * A 404 means no deposit was taken, which is ordinary rather than an error, so
 * the panel renders nothing at all.
 */

const STATES = {
  pending: {
    label: 'Not yet held',
    tone: 'neutral',
    icon: Lock,
    blurb: 'We will place a hold shortly before your stay begins. Nothing is charged.',
  },
  held: {
    label: 'Held, not charged',
    tone: 'brand',
    icon: Lock,
    blurb: 'Your card has an authorisation on it, not a charge. It is released after checkout.',
  },
  charged: {
    label: 'Charged',
    tone: 'warn',
    icon: Banknote,
    blurb: 'This deposit was collected upfront rather than held, and is refunded after checkout.',
  },
  partially_deducted: {
    label: 'Partly deducted',
    tone: 'warn',
    icon: TriangleAlert,
    blurb: 'Part of your deposit is being retained. The check-out report explains what and why.',
  },
  released: {
    label: 'Released',
    tone: 'ok',
    icon: CheckCircle2,
    blurb: 'The hold is lifted. Depending on your bank it can take a few days to disappear.',
  },
  disputed: {
    label: 'Disputed',
    tone: 'danger',
    icon: TriangleAlert,
    blurb: 'This deposit is under review. We will come back to you before anything is settled.',
  },
};

const Figure = ({ label, value, currency, muted }) => (
  <div>
    <dt className="text-[10px] font-semibold uppercase tracking-[0.07em] text-ink-muted">{label}</dt>
    <dd className={cn('mt-0.5 font-display text-[15px] font-semibold tabular-nums', muted ? 'text-ink-muted' : 'text-ink')}>
      {formatCurrency(value, currency)}
    </dd>
  </div>
);

export const DepositPanel = ({ booking, className }) => {
  const { data: deposit, isLoading } = useQuery({
    queryKey: queryKeys.bookings.deposit(booking?.id),
    queryFn: () => bookingService.getDeposit(booking.id),
    enabled: Boolean(booking?.id),
    retry: false,
  });

  if (isLoading) return <Skeleton className={cn('h-28 w-full rounded-card', className)} />;

  /* No deposit on this booking — nothing to report. */
  if (!deposit) return null;

  const state = STATES[deposit.status] ?? STATES.pending;
  const Icon = state.icon;

  return (
    <section className={cn('rounded-card border border-line bg-surface p-5 shadow-card', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="inline-flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
            <Icon className="size-4 text-brand-600" aria-hidden="true" />
            Security deposit
          </h2>
          <p className="mt-1 text-[12.5px] leading-5 text-ink-soft">{state.blurb}</p>
        </div>

        <Badge variant={state.tone}>{state.label}</Badge>
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-3">
        <Figure label="Held" value={deposit.authorized} currency={deposit.currency} />

        {/* Only shown once non-zero — a row of zeroes reads as a problem. */}
        {deposit.deducted > 0 && (
          <Figure label="Deducted" value={deposit.deducted} currency={deposit.currency} />
        )}
        {deposit.released > 0 && (
          <Figure label="Released" value={deposit.released} currency={deposit.currency} muted />
        )}
      </dl>

      {deposit.claims.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-line pt-2.5">
          {deposit.claims.map((claim) => (
            <li key={claim.id} className="flex items-start justify-between gap-3 text-[12.5px]">
              <span className="text-ink-soft">{claim.reason || 'Deduction'}</span>
              <span className="shrink-0 tabular-nums text-ink">
                {formatCurrency(claim.amount, deposit.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {(deposit.releasedAt || deposit.releaseDueAt) && (
        <p className="mt-3 text-[11px] text-ink-muted">
          {deposit.releasedAt
            ? `Released ${formatDate(deposit.releasedAt)}`
            : `Due for release ${formatDate(deposit.releaseDueAt)}`}
        </p>
      )}
    </section>
  );
};
