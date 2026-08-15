import { useNavigate, useParams } from 'react-router-dom';
import { Loading } from '@/components/shared/Loading';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Logo } from '@/components/shared/Logo';
import { StepIndicator } from './StepIndicator';
import { GuestDetailsStep } from './GuestDetailsStep';
import { ReviewStep } from './ReviewStep';
import { VerifyIdentityStep } from './VerifyIdentityStep';
import { PaymentStep } from './PaymentStep';
import { AgreementStep } from './AgreementStep';
import { useBooking } from '../hooks/useBookingMutations';
import { SuccessStep } from './SuccessStep';
import { useBookingWizard } from '../hooks/useBookingWizard';
import {
  useCreateBooking,
  useInitiatePayment,
  usePaymentOptions,
  useStartIdentity,
} from '../hooks/useBookingMutations';
import { paths } from '@/routes/paths';
import { toast } from '@/stores/uiStore';

/**
 * Booking wizard host.
 *
 * Owns step orchestration and the server calls; each step component stays a
 * presentational form that reports upward.
 */
export const BookingPage = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  const {
    property,
    isLoading,
    steps,
    stepIndex,
    draft,
    availability,
    blockedDates,
    isCheckingAvailability,
    pricing,
    currency,
    nights,
    updateDraft,
    setBookingId,
    goToStep,
    nextStep,
    previousStep,
    reset,
  } = useBookingWizard(propertyId);

  const { createBookingAsync, isPending: isCreating } = useCreateBooking();
  const { startIdentityAsync, isPending: isVerifying } = useStartIdentity();
  const { initiatePaymentAsync, isPending: isPaying, error: paymentError } = useInitiatePayment();
  const { data: paymentOptions, isLoading: isLoadingOptions } = usePaymentOptions(currency ?? 'GBP');
  /**
   * The agreement step needs the server's view of the booking, not the draft.
   * Declared with the other hooks so it runs before the early returns below.
   */
  const { data: booking } = useBooking(draft.bookingId);

  if (isLoading) return <Loading label="Preparing your booking…" />;

  if (!property) {
    return (
      <EmptyState
        title="This property is unavailable"
        description="We could not load the residence you were booking."
        action={<Button to={paths.properties}>Browse properties</Button>}
        className="min-h-[60vh]"
      />
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Step handlers                                                           */
  /* ---------------------------------------------------------------------- */

  const handleDetails = ({ guest, stay }) => {
    updateDraft('guest', guest);
    updateDraft('stay', stay);
    nextStep();
  };

  /**
   * Create the booking. The API answers with it in `pending_payment` and holds
   * the dates, so this is the point the stay actually becomes the guest's.
   */
  const handleReview = async () => {
    try {
      const booking = await createBookingAsync({
        propertyId: property.id,
        checkIn: draft.stay.checkIn,
        checkOut: draft.stay.checkOut,
        adults: draft.stay.adults,
        children: draft.stay.children,
        infants: draft.stay.infants,
        specialRequests: draft.stay.specialRequests,
        isCommercial: draft.stay.isCommercial,
      });

      setBookingId(booking.id);
      toast.success('Dates held', 'Complete verification and payment to confirm.');
      nextStep();
    } catch {
      /* the mutation's onError already raised a toast */
    }
  };

  const handleStartIdentity = async () => {
    const session = await startIdentityAsync(draft.bookingId);
    updateDraft('identity', { status: session.status, sessionId: session.sessionId });
    return session;
  };

  const handlePay = async (provider) => {
    const intent = await initiatePaymentAsync({
      bookingId: draft.bookingId,
      currency,
      provider,
    });

    updateDraft('payment', {
      provider: intent.provider,
      transactionId: intent.transactionId,
      status: intent.status,
    });

    // A hosted checkout page is the normal path; leaving the SPA is expected
    // and the provider brings the guest back to /payment/success.
    if (intent.paymentUrl) {
      window.location.assign(intent.paymentUrl);
      return;
    }

    // No hosted page (mock mode) — nothing to redirect to, so land on the
    // in-wizard confirmation instead.
    nextStep();
  };

  const handleFinish = () => {
    reset();
    navigate(paths.dashboard);
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ---------------------------------------------------------------------- */

  const currentStepId = steps[stepIndex].id;

  /** Steps after the review all depend on a booking existing. */
  const needsBooking = ['identity', 'payment'].includes(currentStepId) && !draft.bookingId;

  const STEP_VIEWS = {
    details: () => (
      <GuestDetailsStep
        property={property}
        pricing={pricing}
        currency={currency}
        nights={nights}
        availability={availability}
        isCheckingAvailability={isCheckingAvailability}
        blockedDates={blockedDates}
        draft={draft}
        onSubmit={handleDetails}
      />
    ),
    review: () => (
      <ReviewStep
        property={property}
        pricing={pricing}
        currency={currency}
        nights={nights}
        availability={availability}
        draft={draft}
        onBack={previousStep}
        onContinue={handleReview}
        isPending={isCreating}
      />
    ),
    identity: () => (
      <VerifyIdentityStep
        onStartSession={handleStartIdentity}
        onVerified={nextStep}
        onBack={previousStep}
        isPending={isVerifying}
      />
    ),
    agreement: () => (
      <AgreementStep
        booking={booking}
        property={property}
        nights={nights}
        onBack={previousStep}
        onContinue={nextStep}
      />
    ),
    payment: () => (
      <PaymentStep
        bookingId={draft.bookingId}
        amount={pricing?.totalDueNow ?? 0}
        currency={currency}
        pricing={pricing}
        nights={nights}
        country={property.location}
        providerByCurrency={paymentOptions?.providerByCurrency}
        isLoadingOptions={isLoadingOptions}
        onPay={handlePay}
        onBack={previousStep}
        isPending={isPaying}
        error={paymentError}
      />
    ),
    success: () => <SuccessStep bookingId={draft.bookingId} onDone={handleFinish} />,
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="shell flex h-16 items-center justify-between">
          <Logo />
          <Button variant="ghost" size="sm" to={paths.propertyDetail(property.id)}>
            Back to property
          </Button>
        </div>
      </header>

      <div className="shell py-10 sm:py-14">
        {currentStepId !== 'success' && (
          <StepIndicator steps={steps.slice(0, -1)} currentIndex={stepIndex} onStepClick={goToStep} />
        )}

        <div className="mt-10">
          {needsBooking ? (
            <div className="mx-auto max-w-md">
              <Alert variant="warn" title="Your booking hasn't been created yet">
                Go back to the review step and confirm your stay before continuing.
              </Alert>
              <Button fullWidth className="mt-4" onClick={() => goToStep(1)}>
                Back to review
              </Button>
            </div>
          ) : (
            STEP_VIEWS[currentStepId]()
          )}
        </div>
      </div>
    </div>
  );
};
