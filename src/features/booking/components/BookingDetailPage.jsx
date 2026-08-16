import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CreditCard,
  Download,
  FileCheck,
  MapPin,
  MessageSquare,
  Send,
  ShieldCheck,
  Star,
  Users,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Image } from '@/components/ui/Image';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/utils/classNames';
import { formatCurrency, formatDate } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import { paths } from '@/routes/paths';
import { toAgreementState } from '@/lib/agreementSchema';
import { bookingService } from '../services/bookingService';
import { useAuth } from '@/features/auth';
import { useProperty } from '@/features/properties';
import { BookingProgress } from './BookingProgress';
import { InspectionAcknowledgement } from './InspectionAcknowledgement';
import { FullKycPanel } from './FullKycPanel';
import { CheckoutReportPanel } from './CheckoutReportPanel';
import { DepositPanel } from './DepositPanel';
import { StayExtras } from './StayExtras';
import { PriceSummary } from './PriceSummary';
import { printReceipt } from '../receiptDocument';
import {
  useBooking,
  useBookingMessages,
  useContractStatus,
  useContractText,
  useBookingReceipt,
  useBookingTimeline,
  useCancelBooking,
  useInitiatePayment,
  usePaymentOptions,
  useSendMessage,
} from '../hooks/useBookingMutations';

/** Common reasons, offered as one tap so the requirement is not a chore. */
const CANCEL_REASONS = [
  'My plans changed',
  'My dates changed',
  'Found somewhere else',
  'Too expensive',
  'Booked by mistake',
];

const MIN_CANCEL_REASON = 4;

const STATUS_VARIANT = {
  pending_payment: 'gold',
  pending_approval: 'gold',
  pending_kyc: 'gold',
  confirmed: 'verified',
  active: 'soft',
  completed: 'neutral',
  cancelled: 'neutral',
  refunded: 'soft',
};

const Panel = ({ title, subtitle, action, children, className }) => (
  <section className={cn('rounded-card border border-line bg-surface p-5 shadow-card', className)}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-[15px] font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12px] text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className="mt-4">{children}</div>
  </section>
);

const Fact = ({ icon: Icon, label, children }) => (
  <div className="min-w-0">
    <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink-muted">
      {Icon && <Icon className="size-3 text-brand-600" aria-hidden="true" />}
      {label}
    </p>
    <p className="mt-1 break-words text-[13px] text-ink">{children ?? '—'}</p>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Messages                                                                    */
/* -------------------------------------------------------------------------- */

const MessageThread = ({ bookingId }) => {
  const { data: messages, isLoading } = useBookingMessages(bookingId);
  const { sendMessage, isPending } = useSendMessage(bookingId);
  const [draft, setDraft] = useState('');

  /*
   * Reading the thread marks it read — the endpoint existed but was never
   * called, so unread counts could only ever climb. Fired once per booking
   * per mount, and failure is ignored: not clearing a badge is a far smaller
   * problem than an error toast over a conversation.
   */
  const hasMessages = Boolean(messages?.length);
  useEffect(() => {
    if (!bookingId || !hasMessages) return;
    bookingService.markMessagesRead(bookingId).catch(() => null);
  }, [bookingId, hasMessages]);

  const submit = (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    sendMessage(body);
    setDraft('');
  };

  return (
    <>
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : messages?.length ? (
        <ul className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
          {messages.map((message) => (
            <li
              key={message.id}
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2 text-[12.5px]',
                message.isStaff ? 'bg-line-soft text-ink' : 'ml-auto bg-brand-50 text-ink',
              )}
            >
              <p className="whitespace-pre-wrap">{message.body}</p>
              <p className="mt-1 text-[10px] text-ink-muted">
                {message.isStaff ? 'Alotel Spaces' : 'You'}
                {message.createdAt ? ` · ${formatDate(message.createdAt)}` : ''}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12.5px] text-ink-muted">
          No messages yet. Ask us anything about this stay — arrival times, access, anything at all.
        </p>
      )}

      <form onSubmit={submit} className="mt-3 flex items-end gap-2">
        <Textarea
          rows={2}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message…"
          aria-label="Message about this booking"
          containerClassName="flex-1"
        />
        <Button
          type="submit"
          disabled={isPending || !draft.trim()}
          isLoading={isPending}
          leftIcon={<Send className="size-3.5" aria-hidden="true" />}
        >
          Send
        </Button>
      </form>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export const BookingDetailPage = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();

  const { data: booking, isLoading, isError, error } = useBooking(bookingId);
  const { data: timeline } = useBookingTimeline(bookingId);
  const { data: receipt } = useBookingReceipt(bookingId);
  const { data: property } = useProperty(booking?.propertyId);
  const { data: contractText } = useContractText(bookingId);
  const { data: contract } = useContractStatus(contractText?.contractId);
  const { data: paymentOptions } = usePaymentOptions(booking?.currency ?? 'GBP');

  const { initiatePaymentAsync, isPending: isPaying } = useInitiatePayment();
  const { cancelBooking, isPending: isCancelling } = useCancelBooking();

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  /** Long enough to be a reason rather than a keystroke to get past the gate. */
  const canSubmitCancel = cancelReason.trim().length >= MIN_CANCEL_REASON;

  const closeCancel = () => {
    setIsCancelOpen(false);
    setCancelReason('');
  };
  const [payError, setPayError] = useState('');

  if (isLoading) {
    return (
      <div className="shell space-y-4 py-10">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="shell py-10">
        <EmptyState
          title="We could not load this booking"
          description={getErrorMessage(error) || 'It may have been removed, or belong to another account.'}
          action={<Button to={paths.dashboard}>Back to dashboard</Button>}
        />
      </div>
    );
  }

  const isCancelled = ['cancelled', 'refunded'].includes(booking.status);
  const cancellation = booking.cancellation;

  /** What actually came back, rather than what policy says might. */
  const refundedTotal = (receipt?.payments ?? [])
    .filter((payment) => ['refunded', 'refund', 'reversed'].includes(String(payment.status).toLowerCase()))
    .reduce((total, payment) => total + (payment.amount || 0), 0);

  /** What has actually been paid, so the warning names a real figure or none. */
  const cancellationValue = (receipt?.payments ?? [])
    .filter((payment) => ['succeeded', 'paid', 'captured'].includes(String(payment.status).toLowerCase()))
    .reduce((total, payment) => total + (payment.amount || 0), 0);

  const needsPayment = booking.status === 'pending_payment';
  const canCancel = !['cancelled', 'refunded', 'completed'].includes(booking.status);
  const isStayable = ['active', 'completed'].includes(booking.status);
  const isIdVerified = Boolean(timeline?.steps?.find((step) => step.id === 'id_verified')?.isComplete);

  const agreement = toAgreementState(
    { ...booking, propertyLocation: property?.location, propertyCountry: property?.country },
    contract,
  );

  /** Re-open checkout for a booking that never got paid. */
  const retryPayment = async () => {
    setPayError('');
    try {
      const intent = await initiatePaymentAsync({
        bookingId: booking.id,
        currency: booking.currency,
        provider: paymentOptions?.providerByCurrency?.[booking.currency],
      });

      if (intent.paymentUrl) {
        window.location.assign(intent.paymentUrl);
        return;
      }
      setPayError('The payment provider did not return a checkout page. Please try again shortly.');
    } catch (paymentError) {
      setPayError(getErrorMessage(paymentError));
    }
  };

  return (
    <div>
      <div className="shell py-8">
        <Link
          to={paths.dashboard}
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors hover:text-brand-700"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to dashboard
        </Link>

        {/* Header */}
        <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <Image
              src={property?.images?.[0]}
              alt={property?.name ?? ''}
              wrapperClassName="hidden h-20 w-28 shrink-0 rounded-lg sm:block"
            />
            <div className="min-w-0">
              <h1 className="font-display text-[22px] font-bold text-brand-700 sm:text-[26px]">
                {property?.name ?? 'Your booking'}
              </h1>
              {property && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-ink-soft">
                  <MapPin className="size-3.5 text-brand-600" aria-hidden="true" />
                  {property.city}, {property.country}
                </p>
              )}
              <p className="mt-1 font-mono text-[11px] text-ink-muted">{booking.id}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge variant={STATUS_VARIANT[booking.status] ?? 'neutral'}>{booking.statusLabel}</Badge>
          </div>
        </header>

        {/*
          A cancelled booking gets its own explanation before anything else.
          Without it the page reads as a normal booking with a grey badge, and
          the guest is left to work out what happened and whether money is
          coming back.
        */}
        {isCancelled && (
          <Alert
            variant={booking.status === 'refunded' ? 'info' : 'warn'}
            title={booking.status === 'refunded' ? 'This booking was refunded' : 'This booking was cancelled'}
            className="mt-5"
          >
            <p>
              {cancellation?.at ? `Cancelled on ${formatDate(cancellation.at)}` : 'This stay is no longer going ahead'}
              {cancellation?.wasByGuest === false ? ' by Alotel Spaces' : cancellation?.wasByGuest ? ' at your request' : ''}
              {cancellation?.reason ? ` — ${cancellation.reason}` : '.'}
            </p>

            <p className="mt-2">
              {refundedTotal > 0
                ? `${formatCurrency(refundedTotal, booking.currency)} has been refunded to your original payment method.`
                : cancellation?.wasPaid
                  ? 'Any refund due follows the cancellation policy that applied when you booked. We will confirm by email.'
                  : 'No payment had been taken, so there is nothing to refund.'}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" to={paths.propertyDetail(booking.propertyId)}>
                Book these dates again
              </Button>
              <Button size="sm" variant="secondary" to={paths.properties}>
                Browse other residences
              </Button>
            </div>
          </Alert>
        )}

        {/* Payment problem — the loudest thing on the page when it applies. */}
        {needsPayment && !isCancelled && (
          <Alert variant="warn" title="This booking is not paid yet" className="mt-5">
            <p>
              Your dates are held, but the stay is not confirmed until payment completes. Any nights can still be taken
              by another guest until then.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={retryPayment}
                isLoading={isPaying}
                leftIcon={<CreditCard className="size-3.5" aria-hidden="true" />}
              >
                {booking.pricing ? `Pay ${formatCurrency(booking.pricing.totalDueNow, booking.currency)}` : 'Retry payment'}
              </Button>
              <Button size="sm" variant="secondary" to={paths.booking(booking.propertyId)}>
                Open checkout
              </Button>
            </div>
            {payError && <p className="mt-2 text-[12px] text-danger">{payError}</p>}
          </Alert>
        )}

        {/*
          Three blocks rather than two columns, so the stacked mobile order is
          sensible on its own terms.

          Source order is the mobile order: the stay and what it cost, then
          where the booking has got to, then the conversation and the actions.
          As two columns the whole sidebar fell below the message thread, which
          put "talk to us" above "here is your status" — backwards, since the
          status is usually what the guest opened the page to check.

          On `lg` the explicit placement rebuilds the two-column layout.
        */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-start">
          {/* The stay and its cost */}
          <div className="space-y-5 lg:col-start-1 lg:row-start-1">
            <Panel title="Your stay" subtitle="Everything confirmed for this reservation.">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Fact icon={CalendarDays} label="Check-in">
                  {formatDate(booking.checkIn)}
                </Fact>
                <Fact icon={CalendarDays} label="Check-out">
                  {formatDate(booking.checkOut)}
                </Fact>
                <Fact label="Nights">{booking.nights}</Fact>
                <Fact icon={Users} label="Guests">
                  {booking.adults} {booking.adults === 1 ? 'adult' : 'adults'}
                  {booking.children > 0 && `, ${booking.children} children`}
                  {booking.infants > 0 && `, ${booking.infants} infants`}
                </Fact>
              </div>
            </Panel>

            <Panel
              title="Payment summary"
              subtitle="Exactly what the booking was priced at."
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => printReceipt({ receipt, booking, property, guest: user })}
                  disabled={!receipt}
                  leftIcon={<Download className="size-3.5" aria-hidden="true" />}
                >
                  Download receipt
                </Button>
              }
            >
              {receipt?.lineItems?.length ? (
                <div className="space-y-1.5">
                  {receipt.lineItems.map((item, index) => (
                    <div key={`${item.type}-${index}`} className="flex justify-between gap-4 text-[12.5px]">
                      <span className="text-ink-soft">
                        {item.label}
                        {item.quantity > 1 && <span className="text-ink-muted"> × {item.quantity}</span>}
                      </span>
                      <span className="tabular-nums text-ink">
                        {formatCurrency(item.total, item.currency ?? booking.currency)}
                      </span>
                    </div>
                  ))}
                  {receipt.totals && (
                    <div className="flex justify-between gap-4 border-t border-line pt-2 text-[13px] font-semibold">
                      <span className="text-ink">Total</span>
                      <span className="tabular-nums text-brand-700">
                        {formatCurrency(receipt.totals.totalDueNow, receipt.currency)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <PriceSummary
                  pricing={booking.pricing}
                  nights={booking.nights}
                  currency={booking.currency}
                  country={property?.location}
                />
              )}

              <div className="mt-4 border-t border-line pt-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.07em] text-ink-muted">Payments</p>
                {receipt?.payments?.length ? (
                  <ul className="space-y-1.5">
                    {receipt.payments.map((payment, index) => (
                      <li key={payment.id ?? index} className="flex justify-between gap-4 text-[12.5px]">
                        <span className="text-ink-soft">
                          {payment.provider} · {payment.status}
                        </span>
                        <span className="tabular-nums text-ink">
                          {formatCurrency(payment.amount, payment.currency ?? booking.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12px] text-ink-muted">Nothing has settled against this booking yet.</p>
                )}
              </div>
            </Panel>

          </div>

          {/* Status — second on mobile, right-hand column on desktop */}
          <div className="space-y-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <Panel
              title="Progress"
              subtitle={isCancelled ? 'Where this booking got to before it ended.' : 'Where this booking has got to.'}
            >
              {timeline?.steps?.length ? (
                <BookingProgress timeline={timeline} />
              ) : (
                <Skeleton className="h-40 w-full" />
              )}
            </Panel>

            <Panel title="Agreement" subtitle="What you agreed to for this stay.">
              <p className="text-[13px] font-semibold text-ink">{agreement.name}</p>
              <p className="mt-0.5 text-[11.5px] text-ink-muted">
                {agreement.bandLabel} · {agreement.market}
                {agreement.isCommercial ? ' · Commercial' : ''}
              </p>

              <p
                className={cn(
                  'mt-3 inline-flex items-center gap-2 text-[12.5px]',
                  agreement.isAccepted ? 'text-brand-700' : 'text-ink-soft',
                )}
              >
                <FileCheck className="size-4 shrink-0" aria-hidden="true" />
                {agreement.isAccepted
                  ? `Agreed${agreement.acceptedAt ? ` on ${formatDate(agreement.acceptedAt)}` : ''}`
                  : agreement.needsSignature
                    ? agreement.contractStatusLabel ?? 'Awaiting signed contract'
                    : 'Not yet agreed'}
              </p>

              {/*
                The report behind this: a guest could not tell whether their
                paperwork was done before arriving. The status above was
                already here, but nothing connected it to check-in — so an
                outstanding signature read as a detail rather than something
                standing between them and the keys.
              */}
              {agreement.needsSignature && !agreement.isAccepted && (
                <p className="mt-2.5 rounded-md bg-gold/10 p-2.5 text-[11.5px] leading-4 text-ink-soft">
                  This stay needs a signed agreement before check-in can be completed. We will email the signing link —
                  message us below if it has not arrived.
                </p>
              )}

              {agreement.needsSignature && agreement.isAccepted && (
                <p className="mt-2.5 text-[11.5px] text-brand-700">
                  Signed and on file — nothing outstanding before check-in.
                </p>
              )}

              {/* Only offered when the guest can actually act on it. */}
              {!agreement.isAccepted && !agreement.needsSignature && needsPayment && (
                <Button size="sm" fullWidth className="mt-3" to={paths.booking(booking.propertyId)}>
                  Review and agree
                </Button>
              )}

              {agreement.signedDocumentUrl && (
                <Button
                  size="sm"
                  fullWidth
                  className="mt-3"
                  href={agreement.signedDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open signed contract
                </Button>
              )}
            </Panel>

            {/*
              Two different obligations, so one or the other — never both. A
              short stay needs the Stripe Identity pass below. A stay past the
              contract threshold needs AML, address and credit checks as well,
              and showing "Not verified yet" beside a panel tracking three
              separate checks would read as a contradiction.
            */}
            {booking.contractRequired ? (
              <FullKycPanel booking={booking} />
            ) : (
              <Panel title="Verification" subtitle="Identity checks for this stay.">
                <p className="flex items-center gap-2 text-[12.5px] text-ink-soft">
                  <ShieldCheck className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
                  {isIdVerified ? 'Identity verified' : 'Not verified yet'}
                </p>
                {!isIdVerified && (
                  <Button size="sm" fullWidth className="mt-3" to={paths.booking(booking.propertyId)}>
                    Verify identity
                  </Button>
                )}
              </Panel>
            )}
          </div>

          {/* Conversation and actions — last, so nothing destructive sits near
              the top of a phone screen */}
          <div className="space-y-5 lg:col-start-1 lg:row-start-2">
            {/* Only once staff have completed a stage, and never on a booking
                that is no longer going ahead. */}
            {!isCancelled && <DepositPanel booking={booking} />}

            {!isCancelled && <CheckoutReportPanel booking={booking} />}

            {!isCancelled && <InspectionAcknowledgement bookingId={booking.id} />}

            <Panel title="Messages" subtitle="Talk to us about this stay.">
              <MessageThread bookingId={booking.id} />
            </Panel>

            {isStayable && (
              <Panel title="Your stay" subtitle="The guidebook, extending, and leaving a review.">
                <StayExtras booking={booking} />
              </Panel>
            )}

            <Panel title="Support" subtitle="We reply within an hour on average.">
              <p className="inline-flex items-center gap-2 text-[12.5px] text-ink-soft">
                <MessageSquare className="size-4 text-brand-600" aria-hidden="true" />
                Use the message thread on this page.
              </p>
            </Panel>

            {canCancel && (
              <Panel title="Need to change plans?" subtitle="Cancellation follows the policy agreed at booking.">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setIsCancelOpen(true)}
                  leftIcon={<XCircle className="size-4" aria-hidden="true" />}
                >
                  Cancel this booking
                </Button>
              </Panel>
            )}
          </div>
        </div>
      </div>

      {/*
        The API accepts `reason` and records it on the status event, so it is
        asked for here and required before the action unlocks. That is
        deliberate friction: cancelling is irreversible and refunds follow a
        policy, so a stray click should not be able to end a stay. Having to
        say why is a better safeguard than a second "are you sure" nobody reads.
      */}
      <Modal
        isOpen={isCancelOpen}
        onClose={closeCancel}
        title="Cancel this booking?"
        description="Tell us why, and we will confirm by email with any refund you are due."
        size="md"
      >
        {/*
          The two things a guest actually needs to weigh — which dates they are
          giving up and how much money is in play — are pulled out as facts.
          Buried in the sentence, the amount was the easiest thing in the dialog
          to skim past, which is the opposite of what a confirmation is for.
        */}
        <Alert
          variant="warn"
          title="This cannot be undone"
          facts={[
            { label: 'Dates released', value: `${formatDate(booking.checkIn)} → ${formatDate(booking.checkOut)}` },
            ...(cancellationValue > 0
              ? [{ label: 'Paid to date', value: formatCurrency(cancellationValue, booking.currency) }]
              : []),
          ]}
        >
          Your dates are released immediately and cannot be reinstated. Any refund is calculated from the cancellation
          policy that applied when you booked.
        </Alert>

        <fieldset className="mt-4">
          <legend className="text-[12px] font-semibold text-ink">Why are you cancelling?</legend>

          <div className="mt-2 flex flex-wrap gap-2">
            {CANCEL_REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setCancelReason(preset === cancelReason ? '' : preset)}
                aria-pressed={preset === cancelReason}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-[12px] transition-colors',
                  preset === cancelReason
                    ? 'border-brand-700 bg-brand-50 font-medium text-brand-700'
                    : 'border-line bg-surface text-ink-soft hover:border-brand-300',
                )}
              >
                {preset}
              </button>
            ))}
          </div>

          <Textarea
            label="Reason"
            rows={3}
            className="mt-3"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="Pick one above, or tell us in your own words."
            aria-describedby="cancel-reason-help"
          />

          <p id="cancel-reason-help" className="mt-1 text-[11.5px] text-ink-muted">
            {canSubmitCancel
              ? 'This is recorded on your booking and helps us review any refund.'
              : `Please give a reason — at least ${MIN_CANCEL_REASON} characters — before cancelling.`}
          </p>
        </fieldset>

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={closeCancel} disabled={isCancelling}>
            Keep my booking
          </Button>
          <Button
            variant="danger"
            isLoading={isCancelling}
            disabled={!canSubmitCancel || isCancelling}
            // Closed on success only — a failure must leave the typed reason in
            // place rather than making the guest write it again.
            onClick={() =>
              cancelBooking({ bookingId: booking.id, reason: cancelReason.trim() }, { onSuccess: closeCancel })
            }
          >
            Cancel this booking
          </Button>
        </div>
      </Modal>
    </div>
  );
};
