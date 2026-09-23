import { useAuth } from '@/features/auth';
import { useFullKycStatus, useIdentityStatus } from './useBookingMutations';

/**
 * What a guest still has to do before a booking can be paid for.
 *
 * The order is fixed and every step gates the next:
 *
 *   1. email      — the registered address is confirmed
 *   2. identity   — verified, at the level the server set for this booking
 *   3. agreement  — terms accepted (under 183 nights) or contract signed
 *   4. payment    — only once all of the above are true
 *
 * Every screen that can lead to payment — the booking wizard, the page for
 * finishing an existing booking, the booking detail page, the dashboard —
 * reads from here, so none of them can offer a step the guest has not earned.
 *
 * It fails closed. If the verification status cannot be loaded, the guest is
 * treated as unverified rather than waved through.
 *
 * The server is the real gate, and it refuses payment twice over: 403
 * `email_unverified` when the address is unconfirmed, and 409
 * `contract_unsigned` for an unsigned long stay. It does not yet check identity
 * verification, which is why this stays strict rather than advisory.
 *
 * @returns {{
 *   isLoading: boolean,
 *   verification: { level: 'none'|'basic'|'full', status: string, isVerified: boolean, check?: object },
 *   agreement: { mode: 'click_accept'|'signature', isDone: boolean },
 *   nextStep: 'identity'|'agreement'|'payment'|'done',
 *   canPay: boolean,
 *   refetchVerification: () => void,
 * }}
 */

const UNPAID = 'pending_payment';
/** Paid, but held until compliance clears — older bookings can be here. */
const AWAITING_COMPLIANCE = ['pending_kyc', 'pending_approval'];

export const STEP_ORDER = ['email', 'identity', 'agreement', 'payment'];

export const useBookingReadiness = (booking, { poll = false } = {}) => {
  const { user } = useAuth();
  const guestId = user?.id ?? null;

  /* A missing level would come from an older payload. Requiring the basic
     check in that case is the safe reading. */
  const level = booking ? booking.kycLevelRequired || 'basic' : null;

  const identity = useIdentityStatus(guestId, { enabled: level === 'basic', poll });
  const fullKyc = useFullKycStatus(guestId, booking?.id, { enabled: level === 'full', poll });

  if (!booking) {
    return {
      isLoading: true,
      verification: null,
      agreement: null,
      nextStep: 'identity',
      canPay: false,
      refetchVerification: () => {},
    };
  }

  let verification;
  if (level === 'none') {
    verification = { level, status: 'not_required', isVerified: true };
  } else if (level === 'full') {
    const status = fullKyc.data?.status ?? 'not_started';
    verification = { level, status, isVerified: status === 'approved', check: fullKyc.data ?? null };
  } else {
    const status = identity.data?.status ?? 'unverified';
    verification = { level: 'basic', status, isVerified: status === 'verified' };
  }

  const agreement = booking.contractRequired
    ? { mode: 'signature', isDone: booking.contract?.status === 'signed' }
    : { mode: 'click_accept', isDone: Boolean(booking.agreementAccepted) };

  const isOpen = booking.status === UNPAID || AWAITING_COMPLIANCE.includes(booking.status);

  /* An account created before the API returned the flag reads as undefined;
     treat only an explicit `false` as unconfirmed so nobody is blocked by a
     missing field. */
  const emailVerified = user?.emailVerified !== false;

  let nextStep = 'done';
  if (isOpen) {
    if (!emailVerified) nextStep = 'email';
    else if (!verification.isVerified) nextStep = 'identity';
    else if (!agreement.isDone) nextStep = 'agreement';
    else if (booking.status === UNPAID) nextStep = 'payment';
  }

  const isLoading = (level === 'basic' && identity.isLoading) || (level === 'full' && fullKyc.isLoading);

  return {
    isLoading,
    emailVerified,
    verification,
    agreement,
    nextStep,
    canPay: !isLoading && nextStep === 'payment',
    refetchVerification: () => (level === 'full' ? fullKyc.refetch() : identity.refetch()),
  };
};

/** What the guest is asked to do next, in words a button can carry. */
export const NEXT_STEP_COPY = {
  email: {
    action: 'Confirm your email',
    reason: 'Payment opens once the email address on your account is confirmed.',
  },
  identity: {
    action: 'Verify your identity',
    reason: 'Payment opens once your identity is verified.',
  },
  agreement: {
    action: 'Review and accept the terms',
    reason: 'Payment opens once you have accepted the terms for this stay.',
  },
  signature: {
    action: 'Sign your agreement',
    reason: 'Payment opens once your agreement is signed.',
  },
};
