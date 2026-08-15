import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Clock, Home, Landmark, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/classNames';
import { formatDate } from '@/utils/format';
import { toast } from '@/stores/uiStore';
import { getErrorMessage } from '@/utils/errors';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/features/auth';
import { bookingService } from '../services/bookingService';

/**
 * Full verification for a long stay.
 *
 * A stay past the contract threshold is closer to a tenancy than a holiday
 * let, so it carries the checks a letting agent runs: anti-money-laundering,
 * address, credit, and right-to-rent where the market demands it.
 *
 * Each of those moves independently server-side, so each is shown
 * independently. Collapsing them into the overall status — which is what a
 * single spinner would do — hides exactly the thing a guest needs when two
 * checks pass and one fails: which one, and whether it is theirs to fix.
 *
 * There is no mock path here. A verification flow that pretends to pass is
 * worse than one that is absent.
 */

const OVERALL = {
  not_started: { label: 'Not started', tone: 'neutral' },
  pending: { label: 'In progress', tone: 'warn' },
  in_review: { label: 'Under review', tone: 'warn' },
  approved: { label: 'Approved', tone: 'ok' },
  rejected: { label: 'Needs attention', tone: 'danger' },
};

const CHECK_STATE = {
  pending: { label: 'Pending', icon: Clock, tone: 'text-ink-muted' },
  passed: { label: 'Passed', icon: CheckCircle2, tone: 'text-ok' },
  failed: { label: 'Failed', icon: XCircle, tone: 'text-danger' },
  not_required: { label: 'Not required', icon: Circle, tone: 'text-ink-muted' },
};

const CheckRow = ({ icon: Icon, title, blurb, state }) => {
  const config = CHECK_STATE[state] ?? CHECK_STATE.pending;
  const StateIcon = config.icon;

  return (
    <li className="flex items-start gap-2.5 py-2.5">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
        <Icon className="size-3.5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-ink">{title}</p>
        <p className="text-[11.5px] leading-4 text-ink-muted">{blurb}</p>
      </div>

      <span className={cn('inline-flex shrink-0 items-center gap-1.5 text-[11.5px] font-medium', config.tone)}>
        <StateIcon className="size-3.5" aria-hidden="true" />
        {config.label}
      </span>
    </li>
  );
};

export const FullKycPanel = ({ booking, className }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const guestId = user?.id ?? null;

  const { data: check, isLoading } = useQuery({
    queryKey: queryKeys.bookings.fullKyc(guestId),
    queryFn: () => bookingService.getFullKycStatus(guestId).catch(() => null),
    enabled: Boolean(guestId) && Boolean(booking?.contractRequired),
    /* Checks clear asynchronously at the provider, so this refreshes while a
       guest is watching rather than making them reload to find out. */
    refetchInterval: (query) => (query.state.data?.status === 'approved' ? false : 60_000),
    retry: false,
  });

  const start = useMutation({
    mutationFn: () => bookingService.startFullKyc({ bookingId: booking.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.fullKyc(guestId) });
      toast.success('Verification started', 'We will email you when each check completes.');
    },
    onError: (error) => toast.error('Could not start verification', getErrorMessage(error)),
  });

  /* Only long stays carry these checks; a short stay's Stripe Identity pass is
     handled in the booking flow instead. */
  if (!booking?.contractRequired) return null;

  if (isLoading) return <Skeleton className={cn('h-44 w-full rounded-card', className)} />;

  const status = check?.status ?? 'not_started';
  const overall = OVERALL[status] ?? OVERALL.not_started;
  const isApproved = status === 'approved';
  const notStarted = !check || status === 'not_started';

  return (
    <section className={cn('rounded-card border border-line bg-surface p-5 shadow-card', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="inline-flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
            <ShieldCheck className="size-4 text-brand-600" aria-hidden="true" />
            Verification for this stay
          </h2>
          <p className="mt-1 text-[12.5px] leading-5 text-ink-soft">
            Stays over six months are treated as a tenancy, so they carry the same checks a letting agent runs. You
            only do this once per booking.
          </p>
        </div>

        <Badge variant={overall.tone}>{overall.label}</Badge>
      </div>

      {notStarted ? (
        <div className="mt-4">
          <Alert variant="info" title="Not started yet">
            This takes a few minutes and happens with our verification partner. Your documents go to them, not to us.
          </Alert>

          <Button
            className="mt-3"
            isLoading={start.isPending}
            disabled={start.isPending}
            onClick={() => start.mutate()}
          >
            Start verification
          </Button>
        </div>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            <CheckRow
              icon={Landmark}
              title="Anti-money-laundering"
              blurb="A standard financial background check."
              state={check.amlStatus}
            />
            <CheckRow
              icon={Home}
              title="Address history"
              blurb="Confirms where you have been living."
              state={check.addressStatus}
            />
            <CheckRow
              icon={Landmark}
              title="Credit check"
              blurb="A soft search — it does not affect your credit score."
              state={check.creditStatus}
            />

            {/* Only some markets require it, and the server decides which. */}
            {check.rightToRentRequired && (
              <CheckRow
                icon={ShieldCheck}
                title="Right to rent"
                blurb="Required by law for residential lets in this market."
                state={check.rightToRentStatus ?? 'pending'}
              />
            )}
          </ul>

          {status === 'rejected' && (
            <Alert variant="error" className="mt-3" title="One or more checks did not pass">
              {check.detail || 'Message us below and a person will look at this rather than the automated check.'}
            </Alert>
          )}

          {status === 'in_review' && (
            <p className="mt-3 text-[11.5px] text-ink-muted">
              Everything is with our team for a final look. Nothing more is needed from you.
            </p>
          )}

          {isApproved && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-brand-700">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Verified{check.reviewedAt ? ` on ${formatDate(check.reviewedAt)}` : ''} — nothing outstanding.
            </p>
          )}

          {/*
            The referencing fee is a separate payable step, not part of the
            checks above. Shown only when it is still outstanding, so an
            approved guest is not invited to pay again.
          */}
          {!isApproved && !check.referencingFeePaid && (
            <p className="mt-3 rounded-md bg-gold/10 p-2.5 text-[11.5px] leading-4 text-ink-soft">
              A referencing fee applies to this stay. We will send a payment link once your checks are underway — it is
              not taken upfront.
            </p>
          )}
        </>
      )}
    </section>
  );
};
