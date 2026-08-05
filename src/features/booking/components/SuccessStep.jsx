import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { paths } from '@/routes/paths';

/**
 * In-wizard confirmation.
 *
 * Only reached when the payment needed no hosted checkout page — with a real
 * provider the guest leaves for Stripe or Flutterwave and comes back to
 * `BookingSuccessPage`, which reconciles the payment properly.
 */
export const SuccessStep = ({ bookingId, onDone }) => (
  <div className="animate-fade-up mx-auto max-w-md text-center">
    <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-ok-soft">
      <CheckCircle2 className="size-8 text-ok" aria-hidden="true" />
    </span>

    <h1 className="mt-5 font-display text-[24px] font-bold text-brand-700 sm:text-[28px]">Booking submitted</h1>

    <p className="mt-2 text-[13px] leading-6 text-ink-muted">
      Your stay is booked and we have emailed your confirmation. You can track it any time from your dashboard.
    </p>

    {bookingId && (
      <p className="mt-4 rounded-lg bg-line-soft px-3 py-2 font-mono text-[12px] text-ink-soft">{bookingId}</p>
    )}

    <div className="mx-auto mt-8 flex w-full max-w-xs flex-col gap-2.5">
      <Button size="lg" fullWidth onClick={onDone}>
        Go to dashboard
      </Button>
      <Button variant="secondary" fullWidth to={paths.properties}>
        Browse more stays
      </Button>
    </div>
  </div>
);
