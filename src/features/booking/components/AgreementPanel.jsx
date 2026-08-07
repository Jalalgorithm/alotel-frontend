import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, FileText, Loader2, Lock, ScrollText, ShieldCheck } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/utils/classNames';
import { formatDate } from '@/utils/format';
import { resolveAgreement } from '@/lib/agreementSchema';
import { useAcceptAgreement, useContractText } from '../hooks/useBookingMutations';

/**
 * The booking agreement, confirmed on one page before payment.
 *
 * Two routes exist, and the server decides which by stay length:
 *
 *  - Under ~6 months, `contract_required` is false and the guest accepts by
 *    ticking a box. `POST /bookings/{id}/accept-agreement/` records it with a
 *    server-side timestamp, and the API will not confirm the booking without
 *    it — so this is a real gate, not a formality.
 *  - At 183 nights or more a signed contract is required instead. The API
 *    rejects the checkbox outright for those, so the panel explains the
 *    e-signature route rather than offering a tick that would 400.
 *
 * The tick only unlocks once the guest has reached the end of the text. That is
 * deliberately a low bar — it evidences that the terms were *presented*, which
 * is what makes "I have read" defensible.
 */
export const AgreementPanel = ({ booking, property, onAccepted }) => {
  const scrollRef = useRef(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [isTicked, setIsTicked] = useState(false);
  const [error, setError] = useState('');

  const { data: contract, isLoading: isLoadingContract } = useContractText(booking?.id);
  const { acceptAgreementAsync, isPending } = useAcceptAgreement();

  const agreement = resolveAgreement({
    nights: booking?.nights ?? 0,
    location: property?.location,
    country: property?.country,
    isCommercial: booking?.isCommercial,
  });

  const needsSignature = Boolean(booking?.contractRequired);
  const isAccepted = Boolean(booking?.agreementAccepted);

  /**
   * The API returns the template body for issued contracts only. Short stays
   * have none, so the summary below stands in — it names the agreement and
   * where the full wording lives.
   */
  const body = contract?.content ?? '';

  // A short document may never scroll; treat that as already read.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    if (node.scrollHeight <= node.clientHeight + 8) setHasReachedEnd(true);
  }, [body, isLoadingContract]);

  const onScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 24) setHasReachedEnd(true);
  };

  const accept = async () => {
    setError('');
    try {
      await acceptAgreementAsync(booking.id);
      onAccepted?.();
    } catch (acceptError) {
      setError(acceptError?.message ?? 'We could not record your agreement. Please try again.');
    }
  };

  /* ------------------------------------------------------------ accepted */
  if (isAccepted) {
    return (
      <Alert variant="success" title={`You have agreed to the ${agreement.name}`}>
        Accepted{booking.agreementAcceptedAt ? ` on ${formatDate(booking.agreementAcceptedAt)}` : ''}. A copy stays on
        your booking, and you can read it again at any time from your dashboard.
      </Alert>
    );
  }

  /* ---------------------------------------------- long stay: e-signature */
  if (needsSignature) {
    return (
      <div className="rounded-card border border-line bg-surface p-5">
        <h3 className="inline-flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
          <FileText className="size-4 text-brand-600" aria-hidden="true" />
          {agreement.name}
        </h3>
        <p className="mt-1 text-[12.5px] text-ink-muted">
          {agreement.bandLabel} · {agreement.market}
          {agreement.isCommercial ? ' · Commercial' : ''}
        </p>

        <Alert variant="warn" title="This stay needs a signed contract" className="mt-4">
          Stays of six months or more are covered by a formal agreement rather than a checkbox. We will email you a
          signing link from Dropbox Sign — your booking is confirmed once it is signed.
        </Alert>

        {contract?.content && (
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="scrollbar-slim mt-4 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-line bg-line-soft p-4 text-[12.5px] leading-6 text-ink-soft"
          >
            {contract.content}
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------------------------ short stay: checkbox */
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <h3 className="inline-flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
        <ScrollText className="size-4 text-brand-600" aria-hidden="true" />
        {agreement.name}
      </h3>
      <p className="mt-1 text-[12.5px] text-ink-muted">
        {agreement.bandLabel} · {agreement.market}
        {agreement.isCommercial ? ' · Commercial' : ''} · {booking?.nights}{' '}
        {booking?.nights === 1 ? 'night' : 'nights'}
      </p>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        tabIndex={0}
        role="region"
        aria-label={`${agreement.name} terms`}
        className="scrollbar-slim mt-4 max-h-72 overflow-y-auto rounded-lg border border-line bg-line-soft p-4 text-[12.5px] leading-6 text-ink-soft"
      >
        {isLoadingContract ? (
          <p className="inline-flex items-center gap-2">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Loading the agreement…
          </p>
        ) : body ? (
          <div className="whitespace-pre-wrap">{body}</div>
        ) : (
          <AgreementSummary agreement={agreement} booking={booking} />
        )}
      </div>

      {!hasReachedEnd && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-ink-muted">
          <Lock className="size-3" aria-hidden="true" />
          Scroll to the end to continue.
        </p>
      )}

      <div
        className={cn(
          'mt-4 rounded-lg border p-3.5 transition-colors',
          hasReachedEnd ? 'border-brand-200 bg-brand-50/40' : 'border-line bg-line-soft opacity-60',
        )}
      >
        <Checkbox
          checked={isTicked}
          disabled={!hasReachedEnd || isPending}
          onChange={(event) => setIsTicked(event.target.checked)}
          label={
            <>
              I have read and agree to the <span className="font-semibold">{agreement.name}</span>, and I confirm the
              booking details above are correct.
            </>
          }
        />

        <button
          type="button"
          onClick={accept}
          disabled={!isTicked || isPending}
          className={cn(
            'mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors',
            isTicked && !isPending
              ? 'bg-brand-700 text-white hover:bg-brand-800'
              : 'cursor-not-allowed bg-black/5 text-ink-muted',
          )}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          )}
          Agree and continue
        </button>

        {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
      </div>

      <p className="mt-3 inline-flex items-start gap-1.5 text-[11px] text-ink-muted">
        <ShieldCheck className="mt-0.5 size-3 shrink-0 text-brand-600" aria-hidden="true" />
        We record the date and time you agree. Your booking cannot be confirmed until this is done.
      </p>
    </div>
  );
};

/**
 * Shown when no contract document exists for the booking — the normal case for
 * a short stay. It states the terms being accepted rather than leaving an empty
 * box above a checkbox that says "I have read".
 */
const AgreementSummary = ({ agreement, booking }) => (
  <div className="space-y-3">
    <p>
      This booking is made under the <strong className="text-ink">{agreement.name}</strong>, which applies to stays of{' '}
      {agreement.bandLabel.toLowerCase()} in {agreement.market}.
    </p>

    <p className="font-semibold text-ink">Key terms</p>
    <ul className="list-disc space-y-1.5 pl-4">
      <li>
        You are granted a personal, non-exclusive right to occupy the property for the dates booked
        {booking?.checkIn ? ` (${formatDate(booking.checkIn)} to ${formatDate(booking.checkOut)})` : ''}. This is not a
        tenancy and confers no exclusive possession.
      </li>
      <li>Payment of the full amount shown, including taxes and fees, is due before check-in.</li>
      <li>
        A refundable security deposit is held and released after checkout, less the cost of any damage beyond fair wear
        and tear.
      </li>
      <li>The property is for lawful personal accommodation only. Sub-letting, events and parties are not permitted.</li>
      <li>Smoking and pets are prohibited unless the listing states otherwise.</li>
      <li>Cancellation and refunds follow the policy shown with your booking.</li>
      <li>
        Your personal data is processed under our Privacy Policy and applicable law (UK GDPR, EU GDPR, NDPR or PDPL
        depending on the market).
      </li>
    </ul>

    <p className="text-ink-muted">
      The full wording forms part of your booking confirmation and is available on request at any time from
      support@alotelspaces.com.
    </p>
  </div>
);
