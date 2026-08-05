import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/shared/Logo';
import { paths } from '@/routes/paths';
import { useBookingStore } from '@/stores/bookingStore';

/**
 * Where the provider sends a guest who abandoned checkout.
 *
 * The booking still exists in `pending_payment`, so the draft is deliberately
 * left intact — returning to the wizard resumes exactly where they left off
 * rather than making them re-enter everything.
 */
export const PaymentCancelledPage = () => {
  const propertyId = useBookingStore((state) => state.draft.propertyId);

  return (
    <div className="shell flex min-h-[70vh] flex-col items-center justify-center py-10 text-center">
      <Logo className="mb-8" />

      <span className="flex size-14 items-center justify-center rounded-full bg-warn-soft">
        <XCircle className="size-7 text-warn" aria-hidden="true" />
      </span>

      <h1 className="mt-4 font-display text-[24px] font-bold text-brand-700 sm:text-[28px]">Payment cancelled</h1>
      <p className="mt-2 max-w-md text-[13px] text-ink-muted">
        Nothing was charged. Your booking is still held — pick up where you left off, or come back to it later from
        your dashboard.
      </p>

      <div className="mt-7 flex w-full max-w-xs flex-col gap-2.5">
        {propertyId && (
          <Button to={paths.booking(propertyId)} fullWidth size="lg">
            Resume booking
          </Button>
        )}
        <Button variant="secondary" fullWidth to={paths.dashboard}>
          Go to dashboard
        </Button>
      </div>
    </div>
  );
};
