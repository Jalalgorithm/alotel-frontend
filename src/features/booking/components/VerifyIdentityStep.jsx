import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { StepShell, StepActions } from './StepShell';
import { loadStripe, isStripeConfigured } from '@/lib/stripe';
import { getErrorMessage } from '@/utils/errors';

const ASSURANCES = [
  'Your document goes straight to Stripe — it never touches our servers.',
  'Stripe decides which documents it accepts, so there is nothing to choose.',
  'A completed check is reused for 12 months across all your bookings.',
];

/**
 * Identity verification via Stripe Identity.
 *
 * The guest never picks a document type: `stripe.verifyIdentity()` opens
 * Stripe's own hosted flow, which handles document selection, capture and
 * liveness. Our side only creates the session and reads the outcome.
 */
export const VerifyIdentityStep = ({ onStartSession, onVerified, onBack, isPending }) => {
  const [phase, setPhase] = useState('idle'); // idle | opening | submitted | verified | error
  const [message, setMessage] = useState('');

  // Warm Stripe.js while the guest reads the panel, so the button responds
  // instantly rather than pausing on a cold script fetch.
  useEffect(() => {
    if (isStripeConfigured()) loadStripe().catch(() => {});
  }, []);

  const verify = async () => {
    setPhase('opening');
    setMessage('');

    try {
      const session = await onStartSession();

      // A null secret means the API found a valid check inside the 12-month
      // window — there is nothing for Stripe to do.
      if (!session?.clientSecret) {
        setPhase('verified');
        setMessage(session?.detail || 'You are already verified.');
        return;
      }

      if (!isStripeConfigured()) {
        setPhase('error');
        setMessage(
          'Stripe is not configured in this environment, so the verification window cannot open. Set VITE_STRIPE_PUBLISHABLE_KEY to enable it.',
        );
        return;
      }

      const stripe = await loadStripe();
      const { error } = await stripe.verifyIdentity(session.clientSecret);

      if (error) {
        setPhase('error');
        setMessage(error.message ?? 'Verification was not completed.');
        return;
      }

      /**
       * Stripe resolves as soon as the guest finishes uploading — the decision
       * itself is asynchronous and arrives on the webhook. "Submitted" is the
       * honest word for this state; the booking continues either way.
       */
      setPhase('submitted');
      setMessage('Documents submitted. Stripe usually completes the check within a few minutes.');
    } catch (error) {
      setPhase('error');
      setMessage(getErrorMessage(error));
    }
  };

  const isDone = phase === 'verified' || phase === 'submitted';
  const isBusy = phase === 'opening' || isPending;

  return (
    <StepShell title="Verify Your Identity" subtitle="A one-time check, handled entirely by Stripe Identity.">
      <div className="rounded-card border border-line bg-surface p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50">
            <ShieldCheck className="size-5 text-brand-600" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-ink">Government ID check</h2>
            <p className="mt-1 text-[13px] leading-6 text-ink-soft">
              We use Stripe Identity to confirm you are who you say you are. Stripe will ask for a photo of your ID
              and a selfie.
            </p>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5 border-t border-line pt-4">
          {ASSURANCES.map((line) => (
            <li key={line} className="flex items-start gap-2 text-[12.5px] text-ink-soft">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
              {line}
            </li>
          ))}
        </ul>

        <div className="mt-5 empty:mt-0" aria-live="polite">
          {phase === 'verified' && (
            <Alert variant="success" title="Verified">
              {message}
            </Alert>
          )}

          {phase === 'submitted' && (
            <Alert variant="info" title="Documents submitted">
              {message}
            </Alert>
          )}

          {phase === 'error' && (
            <Alert variant="error" title="Verification not completed">
              {message}
            </Alert>
          )}
        </div>
      </div>

      <StepActions>
        {isDone ? (
          <Button fullWidth size="lg" onClick={onVerified}>
            Continue to payment
          </Button>
        ) : (
          <Button
            fullWidth
            size="lg"
            onClick={verify}
            disabled={isBusy}
            leftIcon={
              isBusy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="size-4" aria-hidden="true" />
              )
            }
          >
            {isBusy ? 'Opening Stripe…' : 'Verify with Stripe'}
          </Button>
        )}

        {phase === 'error' && (
          <>
            <Button variant="secondary" fullWidth onClick={verify}>
              Try again
            </Button>

            {/*
              Verification is not the gate that protects the stay — the API
              decides whether a booking needs KYC and refuses to confirm one
              that does without it. Trapping the guest here would only stop
              them paying for a booking that is already held.
            */}
            <Button variant="ghost" fullWidth onClick={onVerified}>
              Continue without verifying
            </Button>
          </>
        )}

        <Button variant="ghost" fullWidth onClick={onBack}>
          Back
        </Button>

        {!isStripeConfigured() && phase === 'idle' && (
          <p className="inline-flex items-start gap-1.5 text-[11.5px] text-warn">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Stripe publishable key not set — verification cannot open in this environment.
          </p>
        )}
      </StepActions>
    </StepShell>
  );
};
