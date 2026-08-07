import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  BadgeCheck,
  CalendarRange,
  Check,
  FileText,
  Loader2,
  MapPin,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { StepShell, StepActions } from './StepShell';
import { cn } from '@/utils/classNames';
import { formatDate } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import { resolveAgreement } from '@/lib/agreementSchema';
import { useAcceptAgreement, useContractText } from '../hooks/useBookingMutations';

/**
 * The booking agreement, as its own step before payment.
 *
 * It used to sit above the provider picker on the payment step, where two
 * unrelated decisions competed for the same screen. Separating them means the
 * guest reads the terms with nothing else asking for attention, and arrives at
 * payment having already committed.
 *
 * Which route applies is the server's call: under ~6 months `contract_required`
 * is false and a tick is enough, recorded by
 * `POST /bookings/{id}/accept-agreement/`. At 183 nights or more the API
 * refuses the tick and a signed contract is required instead.
 */
export const AgreementStep = ({ booking, property, nights, onBack, onContinue }) => {
  const scrollRef = useRef(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [isTicked, setIsTicked] = useState(false);
  const [error, setError] = useState('');

  const { data: contract, isLoading } = useContractText(booking?.id);
  const { acceptAgreementAsync, isPending } = useAcceptAgreement();

  /** The server's booking is the truth; the draft may be empty on resume. */
  const stayNights = booking?.nights || nights || 0;

  const agreement = resolveAgreement({
    nights: stayNights,
    location: property?.location,
    country: property?.country,
    isCommercial: booking?.isCommercial,
  });

  const needsSignature = Boolean(booking?.contractRequired);
  const isAccepted = Boolean(booking?.agreementAccepted);
  const body = contract?.content ?? '';

  /**
   * A document short enough not to scroll counts as read.
   *
   * Re-evaluated rather than latched: the first run happens while the loader is
   * still in the box, where nothing overflows, so latching there would mark a
   * long agreement as read before it had even rendered — quietly defeating the
   * whole gate.
   */
  useEffect(() => {
    const node = scrollRef.current;
    if (!node || isLoading) return;
    setHasReachedEnd(node.scrollHeight <= node.clientHeight + 8);
  }, [body, isLoading]);

  const onScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 24) setHasReachedEnd(true);
  };

  const jumpToEnd = () => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  };

  const accept = async () => {
    setError('');
    try {
      await acceptAgreementAsync(booking.id);
      onContinue();
    } catch (acceptError) {
      setError(getErrorMessage(acceptError));
    }
  };

  const canContinue = isAccepted || needsSignature || (hasReachedEnd && isTicked);

  return (
    <StepShell
      title="Your agreement"
      subtitle="Please read this before paying — it sets out the terms of your stay."
    >
      {/* Identity of the document, so it is never an anonymous wall of text. */}
      <div className="overflow-hidden rounded-card border border-line">
        <div className="flex flex-wrap items-start justify-between gap-3 bg-brand-700 px-5 py-4 text-white">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 font-display text-[16px] font-semibold">
              <ScrollText className="size-4 shrink-0" aria-hidden="true" />
              {agreement.name}
            </p>
            <p className="mt-1 text-[11.5px] text-white/70">
              The agreement that applies to this stay, set by its length and location.
            </p>
          </div>

          {isAccepted && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
              <BadgeCheck className="size-3" aria-hidden="true" />
              Accepted
            </span>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {[
            { icon: CalendarRange, label: 'Term', value: agreement.bandLabel },
            { icon: MapPin, label: 'Jurisdiction', value: agreement.market },
            { icon: FileText, label: 'Use', value: agreement.isCommercial ? 'Commercial' : 'Residential' },
            { icon: CalendarRange, label: 'Nights', value: `${stayNights}` },
          ].map((fact) => (
            <div key={fact.label} className="bg-surface px-4 py-3">
              <dt className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink-muted">
                <fact.icon className="size-3 text-brand-600" aria-hidden="true" />
                {fact.label}
              </dt>
              <dd className="mt-1 truncate text-[13px] font-medium text-ink">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Long stays: signature, not a tick. */}
      {needsSignature ? (
        <Alert variant="warn" title="This stay is covered by a signed contract" className="mt-5">
          Stays of six months or more use a formal agreement rather than a checkbox. We will email you a signing link
          from Dropbox Sign — your booking is confirmed once it is signed. You can continue to payment now.
        </Alert>
      ) : (
        <>
          {/* The document */}
          <div className="relative mt-5">
            <div
              ref={scrollRef}
              onScroll={onScroll}
              tabIndex={0}
              role="region"
              aria-label={`${agreement.name} terms`}
              className={cn(
                'scrollbar-slim h-[22rem] overflow-y-auto rounded-card border bg-surface p-5 text-[13px] leading-6 text-ink-soft transition-colors',
                hasReachedEnd ? 'border-line' : 'border-brand-200',
              )}
            >
              {isLoading ? (
                <p className="inline-flex items-center gap-2 text-ink-muted">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Loading your agreement…
                </p>
              ) : body ? (
                <div className="whitespace-pre-wrap">{body}</div>
              ) : (
                <AgreementTerms agreement={agreement} booking={booking} property={property} />
              )}
            </div>

            {/* Fade + jump control, so the scroll requirement never feels like a
                trap on a long document. */}
            {!hasReachedEnd && !isLoading && (
              <>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-px bottom-px h-20 rounded-b-card bg-gradient-to-t from-surface to-transparent"
                />
                <button
                  type="button"
                  onClick={jumpToEnd}
                  className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand-700 px-3.5 py-1.5 text-[11.5px] font-semibold text-white shadow-raised transition-colors hover:bg-brand-800"
                >
                  <ArrowDown className="size-3" aria-hidden="true" />
                  Skip to the end
                </button>
              </>
            )}
          </div>

          {/* Progress cue */}
          <p
            className={cn(
              'mt-2 inline-flex items-center gap-1.5 text-[11.5px] transition-colors',
              hasReachedEnd ? 'text-brand-600' : 'text-ink-muted',
            )}
          >
            {hasReachedEnd ? (
              <>
                <Check className="size-3.5" aria-hidden="true" />
                You have reached the end
              </>
            ) : (
              <>
                <ArrowDown className="size-3.5" aria-hidden="true" />
                Scroll to the end to enable the confirmation below
              </>
            )}
          </p>

          {/* Confirmation */}
          {isAccepted ? (
            <Alert variant="success" title="You have already agreed to these terms" className="mt-4">
              Accepted{booking?.agreementAcceptedAt ? ` on ${formatDate(booking.agreementAcceptedAt)}` : ''}. Continue
              to payment when you are ready.
            </Alert>
          ) : (
            <button
              type="button"
              disabled={!hasReachedEnd || isPending}
              onClick={() => setIsTicked((value) => !value)}
              aria-pressed={isTicked}
              className={cn(
                'mt-4 flex w-full items-start gap-3 rounded-card border p-4 text-left transition-all',
                !hasReachedEnd && 'cursor-not-allowed border-line bg-line-soft opacity-60',
                hasReachedEnd && !isTicked && 'border-line bg-surface hover:border-brand-300',
                isTicked && 'border-brand-600 bg-brand-50/60',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                  isTicked ? 'border-brand-700 bg-brand-700' : 'border-line bg-surface',
                )}
              >
                {isTicked && <Check className="size-3 text-white" aria-hidden="true" />}
              </span>

              <span className="min-w-0 text-[13px] leading-6 text-ink">
                I have read and agree to the <span className="font-semibold">{agreement.name}</span>, and I confirm the
                stay details shown are correct.
              </span>
            </button>
          )}

          {error && <p className="mt-2 text-[12.5px] text-danger">{error}</p>}

          <p className="mt-3 inline-flex items-start gap-1.5 text-[11.5px] text-ink-muted">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
            We record the date and time you agree. Your booking cannot be confirmed without it.
          </p>
        </>
      )}

      <StepActions>
        <Button
          fullWidth
          size="lg"
          disabled={!canContinue || isPending}
          isLoading={isPending}
          onClick={isAccepted || needsSignature ? onContinue : accept}
        >
          {isAccepted || needsSignature ? 'Continue to payment' : 'Agree and continue'}
        </Button>
        <Button variant="ghost" fullWidth onClick={onBack} disabled={isPending}>
          Back
        </Button>
      </StepActions>
    </StepShell>
  );
};

/**
 * The terms themselves, when the API has no issued contract to quote — the
 * normal case for a short stay. Written out rather than summarised in a line,
 * because a checkbox saying "I have read" needs something to have read.
 */
const AgreementTerms = ({ agreement, booking, property }) => {
  const clauses = [
    {
      title: 'Nature of occupation',
      body: `This agreement grants you a personal, non-exclusive right to occupy ${
        property?.name ?? 'the property'
      } for the dates booked${
        booking?.checkIn ? ` (${formatDate(booking.checkIn)} to ${formatDate(booking.checkOut)})` : ''
      }. It is a licence to occupy, not a tenancy, and confers no exclusive possession or security of tenure.`,
    },
    {
      title: 'Payment',
      body: 'The total shown, including all taxes and fees, is payable in full before check-in. Your booking is held but not confirmed until payment completes.',
    },
    {
      title: 'Security deposit',
      body: 'A refundable deposit is taken and released after checkout, less the cost of any damage beyond fair wear and tear. For stays under four weeks it is held as a pre-authorisation and released within seven days; for longer stays it is charged and refunded within fourteen.',
    },
    {
      title: 'Use of the property',
      body: 'The property is for lawful personal accommodation only. Sub-letting, parties, events and commercial filming are not permitted. Smoking and pets are prohibited unless the listing states otherwise.',
    },
    {
      title: 'Damage and liability',
      body: 'You are responsible for damage caused during your stay beyond fair wear and tear. Costs are taken from the deposit and, where that is insufficient, invoiced separately.',
    },
    {
      title: 'Cancellation',
      body: 'Cancellations follow the policy shown with your booking. We may end this agreement immediately for a serious breach of these terms, without refund.',
    },
    {
      title: 'Data protection',
      body: `Your personal data is processed under our Privacy Policy and the law applying in ${agreement.market} — UK GDPR, EU GDPR, NDPR or PDPL as relevant. Identity documents are held only as long as needed to meet our legal obligations.`,
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-[12.5px] text-ink-muted">
        {agreement.name} · {agreement.bandLabel} · {agreement.market}
      </p>

      <ol className="space-y-4">
        {clauses.map((clause, index) => (
          <li key={clause.title}>
            <p className="text-[13px] font-semibold text-ink">
              {index + 1}. {clause.title}
            </p>
            <p className="mt-1">{clause.body}</p>
          </li>
        ))}
      </ol>

      <p className="border-t border-line pt-3 text-[12px] text-ink-muted">
        These terms form part of your booking confirmation. A copy is available at any time from your dashboard or by
        emailing support@alotelspaces.com.
      </p>
    </div>
  );
};
