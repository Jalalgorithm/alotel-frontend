import { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, Clock, CreditCard, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProviderLogo } from '@/components/ui/ProviderLogo';
import { cn } from '@/utils/classNames';
import { formatCurrency, formatDate } from '@/utils/format';
import { defaultProviderFor, providerOptionsFor } from '@/lib/bookingSchema';
import { formatTime, rateSuffix } from '@/lib/spaceSchema';
import { usePaymentOptions } from '@/features/booking/hooks/useBookingMutations';
import { useBookSpace, useSpace, useSpaceQuote } from '../hooks/useSpaces';
import { SpaceImage } from './SpaceImage';

/**
 * Checkout for a space: review, then choose how to pay.
 *
 * Spaces previously went from the booking panel straight to a hosted checkout,
 * which meant a guest committed money without ever seeing a summary of what
 * they had configured or being offered a payment method — both of which the
 * property flow gives them. This restores the parity.
 *
 * The selection arrives in route state rather than a store: it is a single
 * hand-off between two screens, and a store would outlive the transaction and
 * need clearing. A direct visit or a refresh has no state, so the page sends
 * the guest back to the space rather than guessing.
 */

const STEPS = [
  { id: 'review', label: 'Review' },
  { id: 'payment', label: 'Payment' },
];

const Fact = ({ icon: Icon, label, value }) => (
  <div className="min-w-0">
    <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink-muted">
      <Icon className="size-3 text-brand-600" aria-hidden="true" />
      {label}
    </p>
    <p className="mt-1 break-words text-[13px] font-medium text-ink">{value}</p>
  </div>
);

export const SpaceCheckoutPage = () => {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const selection = state?.selection ?? null;

  const [step, setStep] = useState('review');
  const { data: space, isLoading } = useSpace(spaceId);
  const { book, isPending: isBooking } = useBookSpace(spaceId);

  /* Re-priced here rather than trusting a figure carried across navigation —
     the server is the only thing that knows what this booking costs. */
  const { getQuote, result: quote, isPending: isQuoting } = useSpaceQuote(spaceId);

  const { data: paymentOptions } = usePaymentOptions(space?.currency ?? 'GBP');
  const providerByCurrency = paymentOptions?.providerByCurrency ?? {};
  const currency = space?.currency ?? 'GBP';

  const providers = useMemo(
    () => providerOptionsFor(providerByCurrency, currency),
    [providerByCurrency, currency],
  );
  const [provider, setProvider] = useState(null);
  const activeProvider = provider ?? defaultProviderFor(providerByCurrency, currency);

  /* Price the selection once the space is loaded. */
  useMemo(() => {
    if (space && selection && !quote && !isQuoting) getQuote(selection);
  }, [space, selection, quote, isQuoting, getQuote]);

  if (!selection) return <Navigate to={`/spaces/${spaceId}`} replace />;

  if (isLoading || !space) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  const layout = space.layouts.find((entry) => entry.id === selection.layoutId);
  const isRequest = space.bookingMode === 'request';

  const confirm = () => {
    book({ ...selection, provider: activeProvider });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <button
        type="button"
        onClick={() => (step === 'payment' ? setStep('review') : navigate(`/spaces/${spaceId}`))}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-soft hover:text-brand-700"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        {step === 'payment' ? 'Back to review' : 'Back to the space'}
      </button>

      <ol className="mt-4 flex items-center gap-2">
        {STEPS.map((entry, index) => {
          const isCurrent = entry.id === step;
          const isDone = STEPS.findIndex((s) => s.id === step) > index;

          return (
            <li key={entry.id} className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-[11.5px] font-semibold',
                  isCurrent && 'bg-brand-700 text-white',
                  isDone && 'bg-brand-50 text-brand-700',
                  !isCurrent && !isDone && 'bg-line-soft text-ink-muted',
                )}
              >
                {isDone && <Check className="mr-1 inline size-2.5" aria-hidden="true" />}
                {entry.label}
              </span>
              {index < STEPS.length - 1 && <span aria-hidden="true" className="h-px w-5 bg-line" />}
            </li>
          );
        })}
      </ol>

      <h1 className="mt-5 font-display text-[24px] font-semibold text-ink">
        {step === 'review' ? 'Review your booking' : 'How would you like to pay?'}
      </h1>

      {/* ------------------------------------------------------------ review */}
      {step === 'review' && (
        <>
          <section className="mt-5 overflow-hidden rounded-card border border-line bg-surface shadow-card">
            <div className="grid gap-4 p-4 sm:grid-cols-[140px_1fr]">
              <SpaceImage space={space} wrapperClassName="aspect-4/3 w-full overflow-hidden rounded-lg" />

              <div className="min-w-0">
                <h2 className="font-display text-[16px] font-semibold text-ink">{space.name}</h2>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
                  <MapPin className="size-3 text-brand-600" aria-hidden="true" />
                  {[space.city, space.country].filter(Boolean).join(', ')}
                </p>

                <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 sm:grid-cols-3">
                  <Fact icon={CalendarDays} label="Date" value={formatDate(selection.date)} />
                  <Fact
                    icon={Clock}
                    label="Time"
                    value={`${formatTime(selection.startTime)} – ${formatTime(selection.endTime)}`}
                  />
                  <Fact
                    icon={Users}
                    label="Layout"
                    value={`${layout?.name ?? 'Layout'} · ${selection.guestCount}`}
                  />
                </dl>
              </div>
            </div>

            {selection.addons?.length > 0 && (
              <div className="border-t border-line px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-ink-muted">Add-ons</p>
                <ul className="mt-1.5 space-y-1">
                  {selection.addons.map((line) => {
                    const addon = space.addons.find((entry) => entry.id === line.addonId);
                    return (
                      <li key={line.addonId} className="flex justify-between text-[12.5px]">
                        <span className="text-ink-soft">
                          {addon?.name ?? 'Add-on'} × {line.qty}
                        </span>
                        <span className="tabular-nums text-ink">
                          {formatCurrency((addon?.price ?? 0) * line.qty, currency)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="border-t border-line bg-line-soft/40 px-4 py-3">
              {isQuoting || !quote ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <dl className="space-y-1 text-[12.5px]">
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">
                      {quote.slots ?? 1} × {rateSuffix(space)}
                    </dt>
                    <dd className="tabular-nums text-ink">{formatCurrency(quote.basePrice, currency)}</dd>
                  </div>
                  {quote.addonsPrice > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-ink-soft">Add-ons</dt>
                      <dd className="tabular-nums text-ink">{formatCurrency(quote.addonsPrice, currency)}</dd>
                    </div>
                  )}
                  {quote.taxLineItems.map((line) => (
                    <div key={line.label} className="flex justify-between">
                      <dt className="text-ink-soft">{line.label}</dt>
                      <dd className="tabular-nums text-ink">{formatCurrency(line.amount, currency)}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-line pt-1.5 text-[14px] font-semibold">
                    <dt className="text-ink">Total</dt>
                    <dd className="tabular-nums text-ink">{formatCurrency(quote.totalPrice, currency)}</dd>
                  </div>
                </dl>
              )}
            </div>
          </section>

          {isRequest && (
            <Alert variant="info" className="mt-4" title="This host confirms before charging">
              You are sending a request, not a booking. Nothing is taken until {space.approvalExpiryHours} hours have
              passed or the host accepts — whichever comes first.
            </Alert>
          )}

          <Button size="lg" fullWidth className="mt-5" disabled={!quote || isQuoting} onClick={() => setStep('payment')}>
            Continue to payment
          </Button>
        </>
      )}

      {/* ----------------------------------------------------------- payment */}
      {step === 'payment' && (
        <>
          <p className="mt-2 text-[13px] text-ink-soft">
            {/* The mapping is the server's rule — the UI reads it rather than
                restating it, so the two can never disagree. */}
            Payment is handled by our provider for {currency}. Others are shown so you can see why they are not
            offered.
          </p>

          <div className="mt-4 space-y-2">
            {providers.map((entry) => (
              <button
                key={entry.id}
                type="button"
                disabled={entry.isDisabled}
                onClick={() => setProvider(entry.id)}
                aria-pressed={entry.id === activeProvider}
                className={cn(
                  'flex w-full items-center gap-3 rounded-card border p-4 text-left transition-colors',
                  entry.id === activeProvider && !entry.isDisabled && 'border-brand-700 bg-brand-50',
                  entry.isDisabled && 'cursor-not-allowed border-line bg-line-soft/50 opacity-60',
                  entry.id !== activeProvider && !entry.isDisabled && 'border-line hover:border-brand-300',
                )}
              >
                <ProviderLogo provider={entry.id} className="size-8 shrink-0" />

                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold text-ink">{entry.name}</span>
                  <span className="block text-[11.5px] text-ink-muted">
                    {entry.isDisabled ? entry.disabledReason : entry.description}
                  </span>
                </span>

                {entry.id === activeProvider && !entry.isDisabled && (
                  <Check className="size-4 shrink-0 text-brand-700" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-card border border-line bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-ink-soft">Total due</span>
              <span className="font-display text-[19px] font-semibold text-ink">
                {quote ? formatCurrency(quote.totalPrice, currency) : '—'}
              </span>
            </div>
          </div>

          <Button
            size="lg"
            fullWidth
            className="mt-4"
            isLoading={isBooking}
            disabled={isBooking || !quote}
            onClick={confirm}
            leftIcon={<CreditCard className="size-4" aria-hidden="true" />}
          >
            {isRequest ? 'Send request and pay' : 'Pay and book'}
          </Button>

          <p className="mt-2 text-center text-[11px] text-ink-muted">
            You will be taken to {providers.find((p) => p.id === activeProvider)?.name ?? 'our provider'} to complete
            payment securely.
          </p>
        </>
      )}
    </div>
  );
};
