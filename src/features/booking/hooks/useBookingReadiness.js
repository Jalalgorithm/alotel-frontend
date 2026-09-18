import { useAuth } from '@/features/auth';
import { useFullKycStatus, useIdentityStatus } from './useBookingMutations';

/**
 * What a guest still has to do before a booking can be paid for.
 *
 * The order is fixed and every step gates the next:
 *
 *   1. identity   — verified, at the level the server set for this booking
 *   2. agreement  — terms accepted (under 183 nights) or contract signed
 *   3. payment    — only once both of the above are true
 *
 * Every screen that can lead to payment — the booking wizard, the page for
 * finishing an existing booking, the booking detail page, the dashboard —
 * reads from here, so none of them can offer a step the guest has not earned.
 *
 * It fails closed. If the verification status cannot be loaded, the guest is
 * treated as unverified rather than waved through.
 *
 * The server is still the real gate: `POST /payments/initiate/` refuses an
 * unsigned long stay. It does not yet refuse an unverified guest, which is why
 * this has to be strict rather than advisory.
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

export const STEP_ORDER = ['identity', 'agreement', 'payment'];

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

  let nextStep = 'done';
  if (isOpen) {
    if (!verification.isVerified) nextStep = 'identity';
    else if (!agreement.isDone) nextStep = 'agreement';
    else if (booking.status === UNPAID) nextStep = 'payment';
  }

  const isLoading = (level === 'basic' && identity.isLoading) || (level === 'full' && fullKyc.isLoading);

  return {
    isLoading,
    verification,
    agreement,
    nextStep,
    canPay: !isLoading && nextStep === 'payment',
    refetchVerification: () => (level === 'full' ? fullKyc.refetch() : identity.refetch()),
  };
};

/** What the guest is asked to do next, in words a button can carry. */
export const NEXT_STEP_COPY = {
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
