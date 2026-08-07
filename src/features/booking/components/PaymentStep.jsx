import { useEffect, useMemo, useState } from 'react';
import { CreditCard, ExternalLink, Loader2, Lock, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ProviderLogo } from '@/components/ui/ProviderLogo';
import { StepShell, StepActions } from './StepShell';
import { useBooking } from '../hooks/useBookingMutations';
import { PriceSummary } from './PriceSummary';
import { cn } from '@/utils/classNames';
import { formatCurrency } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import { defaultProviderFor, providerOptionsFor } from '@/lib/bookingSchema';

const ProviderOption = ({ option, isSelected, onSelect }) => (
  <button
    type="button"
    disabled={option.isDisabled}
    onClick={() => onSelect(option.id)}
    aria-pressed={isSelected}
    className={cn(
      'flex w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-colors',
      isSelected && !option.isDisabled && 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-600/20',
      !isSelected && !option.isDisabled && 'border-line bg-white hover:border-brand-300',
      // A disabled provider stays visible so the regional rule is legible,
      // rather than silently vanishing from the list.
      option.isDisabled && 'cursor-not-allowed border-line bg-line-soft opacity-60',
    )}
  >
    <ProviderLogo provider={option.id} isMuted={option.isDisabled} />

    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-[13.5px] font-semibold text-ink">{option.name}</span>
        {option.isDefault && (
          <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            Recommended
          </span>
        )}
      </span>

      <span className="mt-0.5 block text-[12px] text-ink-muted">{option.blurb}</span>

      <span className="mt-1 block text-[11.5px] text-ink-muted">
        {option.isDisabled ? option.disabledReason : option.regions}
      </span>
    </span>

    <span
      aria-hidden="true"
      className={cn(
        'mt-1 size-4 shrink-0 rounded-full border-2',
        isSelected && !option.isDisabled ? 'border-brand-600 bg-brand-600' : 'border-line',
      )}
    />
  </button>
);

/**
 * Payment step.
 *
 * The provider is chosen by the currency the booking was priced in, and that
 * mapping comes from the server (`payment_provider_by_currency`) rather than
 * being restated here — the initiate endpoint enforces the same rule, so a
 * hardcoded copy could only ever drift out of agreement with it.
 */
export const PaymentStep = ({
  bookingId,
  amount,
  currency,
  pricing,
  nights,
  country,
  providerByCurrency,
  isLoadingOptions,
  onPay,
  onBack,
  isPending,
  error,
}) => {
  const options = useMemo(
    () => providerOptionsFor(providerByCurrency, currency),
    [providerByCurrency, currency],
  );

  const [provider, setProvider] = useState(() => defaultProviderFor(providerByCurrency, currency));

  const { data: booking } = useBooking(bookingId);

  /**
   * A safety net only — the wizard now gates this behind its own agreement
   * step, so this should never be false in normal use. It stays because the
   * API refuses to confirm an unagreed booking, and failing here is clearer
   * than failing after payment.
   */
  const hasAgreed = !booking || booking.contractRequired || booking.agreementAccepted;

  // The default follows the currency: a guest who went back and changed dates
  // into another market must not carry the old provider forward.
  useEffect(() => {
    setProvider(defaultProviderFor(providerByCurrency, currency));
  }, [providerByCurrency, currency]);

  const [localError, setLocalError] = useState('');

  const pay = async () => {
    setLocalError('');
    try {
      await onPay(provider);
    } catch (payError) {
      setLocalError(getErrorMessage(payError));
    }
  };

  const message = localError || (error ? getErrorMessage(error) : '');

  return (
    <StepShell title="Payment" subtitle="You will be taken to a secure checkout page to finish paying.">
      <div className="rounded-card border border-line bg-surface p-6 shadow-card">
        {/* The same breakdown as every earlier step — a guest should never
            reach the payment screen and meet a number they have not seen. */}
        {pricing ? (
          <PriceSummary
            pricing={pricing}
            nights={nights}
            currency={currency}
            country={country}
            className="border-b border-line pb-4"
          />
        ) : (
          <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
            <span className="text-[13px] text-ink-soft">Total due now</span>
            <span className="font-display text-[22px] font-bold text-brand-700">
              {formatCurrency(amount, currency)}
            </span>
          </div>
        )}

        <h2 className="mt-5 text-[10px] font-bold uppercase tracking-[0.07em] text-ink-muted">Payment method</h2>

        {isLoadingOptions ? (
          <p className="mt-3 inline-flex items-center gap-2 text-[12.5px] text-ink-muted">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Loading payment methods…
          </p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {options.map((option) => (
              <ProviderOption
                key={option.id}
                option={option}
                isSelected={provider === option.id}
                onSelect={setProvider}
              />
            ))}
          </div>
        )}

        {message && (
          <Alert variant="error" title="Payment could not be started" className="mt-4">
            {message}
          </Alert>
        )}

        <p className="mt-4 inline-flex items-start gap-1.5 text-[11.5px] text-ink-muted">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
          Card details are entered on the provider&apos;s own checkout page. We never see or store them.
        </p>
      </div>

      <StepActions>
        <Button
          fullWidth
          size="lg"
          onClick={pay}
          disabled={isPending || isLoadingOptions || !provider || !hasAgreed}
          leftIcon={
            isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <CreditCard className="size-4" aria-hidden="true" />
            )
          }
          rightIcon={!isPending ? <ExternalLink className="size-3.5" aria-hidden="true" /> : undefined}
        >
          {isPending
            ? 'Opening checkout…'
            : hasAgreed
              ? `Pay ${formatCurrency(amount, currency)}`
              : 'Accept the agreement to continue'}
        </Button>

        <Button variant="ghost" fullWidth onClick={onBack} disabled={isPending}>
          Back
        </Button>

        {message && (
          <p className="inline-flex items-start gap-1.5 text-[11.5px] text-ink-muted">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warn" aria-hidden="true" />
            Your booking is saved. You can return and pay later from your dashboard.
          </p>
        )}
      </StepActions>
    </StepShell>
  );
};
