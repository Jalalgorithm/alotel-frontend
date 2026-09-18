import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth';
import { loadStripe, isStripeConfigured } from '@/lib/stripe';
import { getErrorMessage } from '@/utils/errors';
import { paths } from '@/routes/paths';
import { StepShell, StepActions } from './StepShell';
import { FullKycPanel } from './FullKycPanel';
import { bookingService } from '../services/bookingService';
import { useIdentityAttempts, useIdentityStatus } from '../hooks/useBookingMutations';
import { useBookingReadiness } from '../hooks/useBookingReadiness';

/**
 * Identity verification, as a gate.
 *
 * Nothing after this step opens until the server says the guest is verified
 * for this booking. That replaces an earlier version which let a guest
 * continue on "documents submitted" — Stripe decides asynchronously and can
 * still reject — and offered "Continue without verifying" whenever anything
 * went wrong.
 *
 * The check the server requires decides what this shows:
 *  - `basic` — Stripe Identity: a photo of ID and a selfie
 *  - `full`  — for stays of 183+ nights: anti-money-laundering, address and
 *              credit checks, approved by our team
 *  - `none`  — markets where no check applies
 *
 * The server's status is the only thing that unlocks the Continue button.
 * Reading it makes the server re-ask Stripe about a pending session, so this
 * polls while a check is in flight instead of trusting the browser.
 */

/**
 * Why Stripe turned an attempt down, in the guest's terms.
 *
 * Keyed by Stripe's `last_error.code`, which the server stores per attempt. A
 * failure that only says "failed" gives a guest nothing to act on, so each
 * reason comes with the one thing that fixes it. Wording stays neutral —
 * Stripe's fraud signals are never repeated back to the guest.
 */
const FAILURE_REASONS = {
  consent_declined: {
    title: 'You did not agree to Stripe checking your ID',
    fix: 'Start again and accept Stripe\u2019s consent screen — we cannot confirm your identity without it.',
  },
  device_unsupported: {
    title: 'This device\u2019s camera could not be used',
    fix: 'Carry on with your phone instead — its camera will work.',
    preferPhone: true,
  },
  under_supported_type: {
    title: 'That type of document is not accepted',
    fix: 'Use a passport, a photo driving licence, or a national ID card.',
  },
  document_type_not_supported: {
    title: 'That type of document is not accepted',
    fix: 'Use a passport, a photo driving licence, or a national ID card.',
  },
  document_expired: {
    title: 'The document has expired',
    fix: 'Use one that is still in date.',
  },
  document_unverified_other: {
    title: 'Stripe could not read the document',
    fix: 'Lay it flat in good light, keep all four corners in frame, and avoid glare from a window or lamp.',
  },
  id_number_mismatch: {
    title: 'The details did not match',
    fix: 'Check the name and date of birth on your booking match your document exactly.',
  },
  id_number_insufficient_document_data: {
    title: 'Stripe could not read enough from the document',
    fix: 'Take the photo closer, with the whole document in frame and in focus.',
  },
  selfie_document_missing_photo: {
    title: 'The document has no photo to compare',
    fix: 'Use a document with your photo on it, such as a passport or photo driving licence.',
  },
  selfie_face_mismatch: {
    title: 'The selfie did not match the photo on your document',
    fix: 'Try again facing a window, with no hat, sunglasses or mask.',
    preferPhone: true,
  },
  selfie_unverified_other: {
    title: 'Stripe could not verify the selfie',
    fix: 'Try again in even light, looking straight at the camera.',
    preferPhone: true,
  },
  selfie_manipulated: {
    title: 'Stripe could not accept that selfie',
    fix: 'Take a new photo in the moment rather than using a saved one.',
    preferPhone: true,
  },
  abandoned: {
    title: 'The check was not finished',
    fix: 'It takes about two minutes — you can pick it up again now.',
  },
  requires_input: {
    title: 'Stripe needs another look at your documents',
    fix: 'Try again with a clear photo of an in-date document.',
  },
};

const DEFAULT_FAILURE = {
  title: 'Your identity could not be verified',
  fix: 'Try again with a clear, well-lit photo of an in-date document.',
};

/** After this many failed attempts, a person takes over from the loop. */
const MAX_SELF_SERVE_ATTEMPTS = 2;

const ASSURANCES = [
  'Your document goes straight to Stripe — it never touches our servers.',
  'Stripe decides which documents it accepts, so there is nothing to choose.',
  'A completed check is reused for 12 months across all your bookings.',
];

/** How long to wait on Stripe before saying so plainly. */
const SLOW_AFTER_MS = 3 * 60 * 1000;

const StatusLine = ({ icon: Icon, tone, children }) => (
  <p className={`inline-flex items-center gap-2 text-[13px] font-medium ${tone}`}>
    <Icon className="size-4 shrink-0" aria-hidden="true" />
    {children}
  </p>
);

/* -------------------------------------------------------------------------- */
/* Basic — Stripe Identity                                                     */
/* -------------------------------------------------------------------------- */

const BasicVerification = ({ booking, onVerified, onBack, continueLabel, returnedFromStripe }) => {
  const { user } = useAuth();

  /* `checking` is set the moment the guest finishes in Stripe, or when Stripe's
     hosted page sends them back here. */
  const [phase, setPhase] = useState(returnedFromStripe ? 'checking' : 'idle'); // idle | opening | checking | error
  const [message, setMessage] = useState('');
  const [checkingSince, setCheckingSince] = useState(returnedFromStripe ? Date.now() : null);
  const [isSlow, setIsSlow] = useState(false);
  /** Stripe's hosted page, for finishing on a phone. */
  const [phoneUrl, setPhoneUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const status = useIdentityStatus(user?.id, { poll: true });
  const serverStatus = status.data?.status;

  /* Only worth asking once something has gone wrong — it is what lets the
     failure name a reason and count attempts. */
  const attempts = useIdentityAttempts(user?.id, { enabled: serverStatus === 'failed' });

  const start = useMutation({ mutationFn: bookingService.startIdentity });

  // Warm Stripe.js while the guest reads the panel.
  useEffect(() => {
    if (isStripeConfigured()) loadStripe().catch(() => {});
  }, []);

  /* A decision from Stripe ends the local "checking" state either way. */
  useEffect(() => {
    if (phase === 'checking' && (serverStatus === 'verified' || serverStatus === 'failed')) {
      setPhase('idle');
      setCheckingSince(null);
    }
  }, [phase, serverStatus]);

  useEffect(() => {
    if (!checkingSince) {
      setIsSlow(false);
      return undefined;
    }
    const timer = setTimeout(() => setIsSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [checkingSince]);

  /**
   * Finish on a phone instead. Stripe's hosted page is the same check, and a
   * phone camera clears most selfie and document failures a laptop webcam
   * cannot. Stripe returns the guest to this booking either way.
   */
  const useMyPhone = async () => {
    setPhase('opening');
    setMessage('');
    setIsCopied(false);

    try {
      const session = await start.mutateAsync(booking.id);
      if (session.status === 'verified') {
        await status.refetch();
        setPhase('idle');
        return;
      }
      if (session.url) {
        setPhoneUrl(session.url);
        setPhase('idle');
        return;
      }
      setPhase('error');
      setMessage('We could not create a link for your phone. Please try again in a moment.');
    } catch (error) {
      setPhase('error');
      setMessage(getErrorMessage(error));
    }
  };

  const copyPhoneUrl = async () => {
    try {
      await navigator.clipboard.writeText(phoneUrl);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  };

  const verify = async () => {
    setPhase('opening');
    setMessage('');
    setPhoneUrl('');

    try {
      const session = await start.mutateAsync(booking.id);

      /* A check inside the last 12 months is reused — confirm with the server
         rather than taking the start response's word for it. */
      if (session.status === 'verified') {
        await status.refetch();
        setPhase('idle');
        return;
      }

      if (session.clientSecret && isStripeConfigured()) {
        const stripe = await loadStripe();
        const { error } = await stripe.verifyIdentity(session.clientSecret);

        if (error) {
          setPhase('error');
          setMessage(error.message ?? 'Verification was not completed.');
          return;
        }

        setCheckingSince(Date.now());
        setPhase('checking');
        status.refetch();
        return;
      }

      /* No Stripe.js here: Stripe's own page handles the check and returns the
         guest to this booking, where polling picks up the result. */
      if (session.url) {
        window.location.assign(session.url);
        return;
      }

      setPhase('error');
      setMessage('Verification could not be opened. Please try again in a moment.');
    } catch (error) {
      setPhase('error');
      setMessage(getErrorMessage(error));
    }
  };

  if (status.isLoading) return <Skeleton className="h-72 w-full rounded-card" />;

  const isVerified = serverStatus === 'verified';
  const isChecking = !isVerified && phase !== 'error' && (phase === 'checking' || serverStatus === 'pending');
  const isFailed = !isVerified && !isChecking && phase !== 'error' && serverStatus === 'failed';
  const isBusy = phase === 'opening';

  const failure = isFailed ? FAILURE_REASONS[attempts.data?.lastFailure?.code] ?? DEFAULT_FAILURE : null;
  /* A guest who has already tried twice is not helped by being sent round
     again — a person takes it from here. */
  const needsHelp = isFailed && (attempts.data?.failedAttempts ?? 1) >= MAX_SELF_SERVE_ATTEMPTS;

  return (
    <StepShell title="Verify your identity" subtitle="Required before you can accept the terms or pay.">
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

        {!isVerified && (
          <ul className="mt-5 space-y-2.5 border-t border-line pt-4">
            {ASSURANCES.map((line) => (
              <li key={line} className="flex items-start gap-2 text-[12.5px] text-ink-soft">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 empty:mt-0" aria-live="polite">
          {isVerified && (
            <Alert variant="success" title="You are verified">
              {status.data?.validUntil
                ? `Your identity check is valid until ${new Date(status.data.validUntil).toLocaleDateString()}.`
                : 'Your identity check is complete.'}
            </Alert>
          )}

          {isChecking && (
            <Alert
              variant="info"
              title="Checking your documents"
              icon={<Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            >
              <p>
                Stripe is reviewing what you submitted. This page updates by itself — it usually takes a minute or
                two.
              </p>
              {isSlow && (
                <p className="mt-2">
                  This is taking longer than usual. You can leave this page: your dates stay held, and you can carry
                  on from your booking once the check completes.
                </p>
              )}
            </Alert>
          )}

          {isFailed && (
            <>
              <Alert variant="error" title={failure.title}>
                <p>{failure.fix}</p>
                {/* The two things a guest worries about the moment a check fails. */}
                <p className="mt-2">
                  Nothing has been charged and your dates are still held. If we cannot verify you, the booking is
                  cancelled and you pay nothing.
                </p>
              </Alert>

              {needsHelp && (
                <Alert variant="secure" title="Let us take it from here" className="mt-3">
                  <p>
                    Two attempts have not gone through, so there is no point trying the same way again. Message us
                    from your booking and a person will verify you directly — we usually reply within an hour.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3"
                    to={paths.bookingDetail(booking.id)}
                    leftIcon={<MessageSquare className="size-3.5" aria-hidden="true" />}
                  >
                    Message us about this
                  </Button>
                </Alert>
              )}
            </>
          )}

          {phase === 'error' && (
            <Alert variant="error" title="Verification not completed">
              {message} You need to complete verification before you can continue.
            </Alert>
          )}
        </div>
      </div>

      {/* The link to carry on elsewhere, once one has been created. */}
      {phoneUrl && !isVerified && (
        <div className="mt-4 rounded-card border border-brand-200 bg-brand-50/50 p-4">
          <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
            <Smartphone className="size-4 text-brand-600" aria-hidden="true" />
            Open this on your phone
          </p>
          <p className="mt-1 text-[12px] leading-5 text-ink-soft">
            Copy the link and open it on your phone. It is the same check, and this page updates by itself when it is
            done.
          </p>
          <p className="mt-2 truncate rounded-md border border-line bg-surface px-3 py-2 font-mono text-[11.5px] text-ink-soft">
            {phoneUrl}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" onClick={copyPhoneUrl} leftIcon={<Copy className="size-3.5" aria-hidden="true" />}>
              {isCopied ? 'Copied' : 'Copy link'}
            </Button>
            <Button size="sm" variant="secondary" href={phoneUrl} target="_blank" rel="noreferrer">
              Open here instead
            </Button>
          </div>
        </div>
      )}

      <StepActions>
        {isVerified ? (
          <Button fullWidth size="lg" onClick={onVerified}>
            {continueLabel}
          </Button>
        ) : isChecking ? (
          <>
            <Button fullWidth size="lg" disabled leftIcon={<Clock className="size-4" aria-hidden="true" />}>
              Waiting for Stripe…
            </Button>
            {/* A session abandoned part-way stays "pending" at Stripe, so the
                guest needs a way to begin again rather than wait for ever. */}
            <Button
              variant="secondary"
              fullWidth
              onClick={verify}
              disabled={isBusy}
              leftIcon={<RotateCcw className="size-4" aria-hidden="true" />}
            >
              Didn&apos;t finish? Start again
            </Button>
            <Button variant="ghost" fullWidth to={paths.bookingDetail(booking.id)}>
              Leave and come back later
            </Button>
          </>
        ) : (
          <>
            {/* When the reason points at the camera, the phone is the fix —
                so it leads rather than sitting underneath a repeat attempt. */}
            <Button
              fullWidth
              size="lg"
              variant={failure?.preferPhone ? 'secondary' : 'primary'}
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
              {isBusy ? 'Opening Stripe…' : isFailed || phase === 'error' ? 'Try again here' : 'Verify with Stripe'}
            </Button>

            <Button
              fullWidth
              size={failure?.preferPhone ? 'lg' : 'md'}
              variant={failure?.preferPhone ? 'primary' : 'secondary'}
              onClick={useMyPhone}
              disabled={isBusy}
              leftIcon={<Smartphone className="size-4" aria-hidden="true" />}
            >
              {isFailed ? 'Try on my phone instead' : 'Use my phone instead'}
            </Button>
          </>
        )}

        {onBack && (
          <Button variant="ghost" fullWidth onClick={onBack}>
            Back
          </Button>
        )}
      </StepActions>
    </StepShell>
  );
};

/* -------------------------------------------------------------------------- */
/* Full — AML, address, credit                                                 */
/* -------------------------------------------------------------------------- */

const FullVerification = ({ booking, onVerified, onBack, continueLabel }) => {
  const readiness = useBookingReadiness(booking, { poll: true });
  const isApproved = readiness.verification?.isVerified;
  const status = readiness.verification?.status;

  return (
    <StepShell
      title="Verify your identity"
      subtitle="Stays of six months or more carry the checks a letting agent runs."
    >
      <FullKycPanel booking={booking} poll />

      <div className="mt-4" aria-live="polite">
        {!isApproved && status && status !== 'not_started' && status !== 'rejected' && (
          <Alert variant="info" title="You can continue once these checks are approved">
            Our team reviews each check. This page updates by itself, and you can leave it — your dates stay held,
            and you can carry on from your booking once you are approved.
          </Alert>
        )}
        {status === 'rejected' && (
          <Alert variant="error" title="Your checks were not approved">
            You cannot continue with this booking until this is resolved. Message us from your booking and a person
            will look at it.
          </Alert>
        )}
      </div>

      <StepActions>
        <Button
          fullWidth
          size="lg"
          disabled={!isApproved}
          onClick={onVerified}
          leftIcon={isApproved ? undefined : <XCircle className="size-4" aria-hidden="true" />}
        >
          {isApproved ? continueLabel : 'Approval needed to continue'}
        </Button>
        {!isApproved && (
          <Button variant="ghost" fullWidth to={paths.bookingDetail(booking.id)}>
            Leave and come back later
          </Button>
        )}
        {onBack && (
          <Button variant="ghost" fullWidth onClick={onBack}>
            Back
          </Button>
        )}
      </StepActions>
    </StepShell>
  );
};

/* -------------------------------------------------------------------------- */

export const VerificationStep = ({
  booking,
  onVerified,
  onBack,
  continueLabel = 'Continue to agreement',
  returnedFromStripe = false,
}) => {
  if (!booking) return <Skeleton className="h-72 w-full rounded-card" />;

  const level = booking.kycLevelRequired || 'basic';

  if (level === 'none') {
    return (
      <StepShell title="Verify your identity" subtitle="Checked for every booking.">
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <StatusLine icon={CheckCircle2} tone="text-brand-700">
            No identity check is required for this stay.
          </StatusLine>
        </div>
        <StepActions>
          <Button fullWidth size="lg" onClick={onVerified}>
            {continueLabel}
          </Button>
          {onBack && (
            <Button variant="ghost" fullWidth onClick={onBack}>
              Back
            </Button>
          )}
        </StepActions>
      </StepShell>
    );
  }

  if (level === 'full') {
    return (
      <FullVerification booking={booking} onVerified={onVerified} onBack={onBack} continueLabel={continueLabel} />
    );
  }

  return (
    <BasicVerification
      booking={booking}
      onVerified={onVerified}
      onBack={onBack}
      continueLabel={continueLabel}
      returnedFromStripe={returnedFromStripe}
    />
  );
};
