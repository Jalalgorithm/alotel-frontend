import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Clock, MailCheck } from 'lucide-react';
import { Loading } from '@/components/shared/Loading';
import { EmptyState } from '@/components/shared/EmptyState';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useProperty } from '@/features/properties';
import { useBookingStore } from '@/stores/bookingStore';
import { queryKeys } from '@/lib/queryKeys';
import { formatDate } from '@/utils/format';
import { paths } from '@/routes/paths';
import { StepIndicator } from './StepIndicator';
import { VerificationStep } from './VerificationStep';
import { AgreementStep } from './AgreementStep';
import { PaymentStep } from './PaymentStep';
import { errorCode } from '../services/bookingService';
import { useBooking, useInitiatePayment, usePaymentOptions } from '../hooks/useBookingMutations';
import { STEP_ORDER, useBookingReadiness } from '../hooks/useBookingReadiness';

/**
 * Finish an existing booking: verify, agree or sign, then pay.
 *
 * The wizard only covers a booking made in one sitting. Guests come back to
 * unfinished bookings from the dashboard, the booking page, a cancelled
 * checkout, Stripe Identity's hosted page (`/checkout/:bookingId?kyc=done`)
 * and the signing email (`/bookings/:bookingId/sign`) — all of which land
 * here, on the first step that is still outstanding.
 *
 * The guest can look back at steps already done, but never ahead of the
 * server's readiness: payment is not rendered until identity and agreement
 * are both confirmed.
 */

const CLOSED_STATUSES = ['cancelled', 'expired', 'rejected', 'refunded'];

const Shell = ({ bookingId, children }) => (
  <div className="min-h-screen bg-canvas">
    <header className="border-b border-line bg-surface">
      <div className="shell flex h-16 items-center justify-between">
        <Logo />
        {bookingId && (
          <Button
            variant="ghost"
            size="sm"
            to={paths.bookingDetail(bookingId)}
            leftIcon={<ArrowLeft className="size-4" aria-hidden="true" />}
          >
            Back to booking
          </Button>
        )}
      </div>
    </header>
    <div className="shell py-10 sm:py-14">{children}</div>
  </div>
);

export const CompleteBookingPage = () => {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const returnedFromStripe = searchParams.get('kyc') === 'done';

  const { data: booking, isLoading, isError } = useBooking(bookingId);
  const { data: property } = useProperty(booking?.propertyId);
  const readiness = useBookingReadiness(booking);

  const { data: paymentOptions, isLoading: isLoadingOptions } = usePaymentOptions(booking?.currency ?? 'GBP');
  const { initiatePaymentAsync, isPending: isPaying, error: paymentError } = useInitiatePayment();

  const startBooking = useBookingStore((state) => state.startBooking);
  const setBookingId = useBookingStore((state) => state.setBookingId);
  const updateDraft = useBookingStore((state) => state.updateDraft);

  /** A step the guest chose to look at. Null follows the server. */
  const [chosenStep, setChosenStep] = useState(null);

  if (isLoading || (booking && readiness.isLoading)) {
    return (
      <Shell bookingId={bookingId}>
        <Loading label="Checking your booking…" />
      </Shell>
    );
  }

  if (isError || !booking) {
    return (
      <Shell>
        <EmptyState
          title="We could not find this booking"
          description="It may belong to a different account, or the link may be incomplete."
          action={<Button to={paths.dashboard}>Go to your dashboard</Button>}
          className="min-h-[50vh]"
        />
      </Shell>
    );
  }

  /* The API refuses payment for an unconfirmed address (403
     `email_unverified`), so this is a step, not a footnote. It is not part of
     the indicator: it is one screen away and applies to the account rather
     than to this booking. */
  if (readiness.nextStep === 'email') {
    return (
      <Shell bookingId={booking.id}>
        <div className="mx-auto max-w-md">
          <Alert
            variant="warn"
            title="Confirm your email to continue"
            icon={<MailCheck className="size-4" aria-hidden="true" />}
          >
            Payment needs a confirmed email address. We sent a code when you registered — it takes a moment, and
            your dates stay held.
          </Alert>
          <Button
            fullWidth
            size="lg"
            className="mt-4"
            to={paths.verifyEmail}
            state={{ from: paths.completeBooking(booking.id) }}
          >
            Confirm your email
          </Button>
          <Button variant="ghost" fullWidth className="mt-2" to={paths.bookingDetail(booking.id)}>
            Back to booking
          </Button>
        </div>
      </Shell>
    );
  }

  const isSignature = readiness.agreement.mode === 'signature';
  const steps = [
    { id: 'identity', label: 'Verify identity' },
    { id: 'agreement', label: isSignature ? 'Sign contract' : 'Agreement' },
    { id: 'payment', label: 'Payment' },
  ];

  /* Nothing left to do, or nothing that can be done. */
  if (readiness.nextStep === 'done') {
    const isClosed = CLOSED_STATUSES.includes(booking.status);
    const isAwaiting = ['pending_kyc', 'pending_approval'].includes(booking.status);

    return (
      <Shell bookingId={booking.id}>
        <div className="mx-auto max-w-md">
          {isClosed ? (
            <Alert variant="warn" title="This booking is no longer open">
              It is {booking.statusLabel?.toLowerCase() ?? booking.status}, so there is nothing left to complete.
            </Alert>
          ) : isAwaiting ? (
            <Alert variant="info" title="Waiting on our team" icon={<Clock className="size-4" aria-hidden="true" />}>
              Everything on your side is done. We will email you as soon as the booking is confirmed.
            </Alert>
          ) : (
            <Alert
              variant="success"
              title="Nothing left to do"
              icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
            >
              Your booking is verified, agreed and paid.
            </Alert>
          )}
          <Button fullWidth className="mt-4" to={paths.bookingDetail(booking.id)}>
            View booking
          </Button>
        </div>
      </Shell>
    );
  }

  const allowedIndex = STEP_ORDER.indexOf(readiness.nextStep);
  const chosenIndex = chosenStep ? STEP_ORDER.indexOf(chosenStep) : -1;
  const stepId = chosenIndex >= 0 && chosenIndex <= allowedIndex ? chosenStep : readiness.nextStep;
  /* Against `steps`, not STEP_ORDER: the indicator does not show the email
     step, so the two lists are deliberately different lengths. */
  const stepIndex = Math.max(0, steps.findIndex((step) => step.id === stepId));

  const goTo = (id) => setChosenStep(id);

  const handlePay = async (provider) => {
    /* The button cannot be reached otherwise, but a stale tab should not
       reach the provider either. */
    if (!readiness.canPay) throw new Error('Complete verification and the agreement before paying.');

    /* The success page finds the booking through the draft. */
    startBooking(booking.propertyId);
    setBookingId(booking.id);

    try {
      const intent = await initiatePaymentAsync({ bookingId: booking.id, currency: booking.currency, provider });
      updateDraft('payment', { provider: intent.provider, transactionId: intent.transactionId, status: intent.status });

      if (intent.paymentUrl) {
        window.location.assign(intent.paymentUrl);
        return;
      }
      navigate(`${paths.paymentSuccess}?booking_id=${booking.id}`);
    } catch (error) {
      /* The server found a step still open — show it rather than the error. */
      const code = errorCode(error);
      if (
        code === 'contract_unsigned' ||
        code === 'kyc_required' ||
        code === 'agreement_required' ||
        code === 'email_unverified'
      ) {
        queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(booking.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });
        queryClient.invalidateQueries({ queryKey: ['bookings', 'identity-status'] });
        queryClient.invalidateQueries({ queryKey: ['bookings', 'full-kyc'] });
        setChosenStep(null);
      }
      throw error;
    }
  };

  const STEP_VIEWS = {
    identity: () => (
      <VerificationStep
        booking={booking}
        returnedFromStripe={returnedFromStripe}
        onVerified={() => goTo('agreement')}
        continueLabel={isSignature ? 'Continue to contract' : 'Continue to agreement'}
      />
    ),
    agreement: () => (
      <AgreementStep
        booking={booking}
        property={property}
        nights={booking.nights}
        onBack={() => goTo('identity')}
        onContinue={() => goTo('payment')}
      />
    ),
    payment: () => (
      <PaymentStep
        bookingId={booking.id}
        amount={booking.pricing?.totalDueNow ?? 0}
        currency={booking.currency}
        pricing={booking.pricing}
        nights={booking.nights}
        country={property?.location}
        providerByCurrency={paymentOptions?.providerByCurrency}
        isLoadingOptions={isLoadingOptions}
        onPay={handlePay}
        onBack={() => goTo('agreement')}
        isPending={isPaying}
        error={paymentError}
      />
    ),
  };

  return (
    <Shell bookingId={booking.id}>
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">Finish your booking</p>
        <h1 className="mt-1 text-balance font-display text-[22px] font-semibold text-ink">
          {property?.name ?? booking.propertyName ?? 'Your stay'}
        </h1>
        {booking.checkIn && (
          <p className="mt-1 text-[13px] text-ink-soft">
            {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)} · {booking.nights}{' '}
            {booking.nights === 1 ? 'night' : 'nights'}
          </p>
        )}
      </div>

      <StepIndicator steps={steps} currentIndex={stepIndex} onStepClick={(index) => goTo(steps[index].id)} />

      <div className="mt-10">{STEP_VIEWS[stepId]()}</div>
    </Shell>
  );
};
