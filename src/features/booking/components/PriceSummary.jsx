import { cn } from '@/utils/classNames';
import { formatCurrency } from '@/utils/format';
import { useTaxRules } from '../hooks/useBookingMutations';

/**
 * The one place a quote is rendered.
 *
 * Every stage of the booking shows the same six lines from the same object, so
 * the total a guest is told at the sidebar is the total they see at review, at
 * payment and on the receipt. Nothing here computes anything — the figures come
 * from the API's own pricing, which is the only thing that knows the tax rules.
 */
export const PriceSummary = ({
  pricing,
  currency,
  nights,
  /** Used only to name the tax line, e.g. "UK VAT (20%)". */
  country,
  className,
  compact = false,
}) => {
  const { data: taxRules } = useTaxRules();

  if (!pricing) return null;

  /**
   * The amount always comes from the server; the rule is looked up purely to
   * label it. If no rule matches — a market without one, or the list failing to
   * load — the line falls back to a plain "Taxes" rather than disappearing.
   */
  const rule = taxRules?.find((entry) => entry.country === country);
  const taxLabel = rule ? `${rule.name} (${rule.percentage}%)` : 'Taxes';

  const rows = [
    [`${nights} ${nights === 1 ? 'night' : 'nights'}`, pricing.nightlyTotal],
    ['Discount', pricing.discountTotal, { isCredit: true }],
    ['Cleaning fee', pricing.cleaningFee],
    [taxLabel, pricing.taxTotal, { isTax: true }],
    ['Security deposit', pricing.securityDeposit, { hint: 'Refundable after checkout' }],
  ];

  return (
    <div className={cn('space-y-1.5', className)}>
      {rows
        .filter(([, value]) => Number(value) !== 0)
        .map(([label, value, options = {}]) => (
          <div
            key={label}
            className={cn('flex items-start justify-between gap-4', compact ? 'text-[12px]' : 'text-[12.5px]')}
          >
            <span className="min-w-0 text-ink-soft">
              {label}
              {options.hint && !compact && (
                <span className="block text-[10.5px] text-ink-muted">{options.hint}</span>
              )}
            </span>
            <span className={cn('shrink-0 tabular-nums', options.isCredit ? 'text-brand-600' : 'text-ink')}>
              {options.isCredit ? '−' : ''}
              {formatCurrency(Number(value), currency)}
            </span>
          </div>
        ))}

      <div
        className={cn(
          'flex items-center justify-between gap-4 border-t border-line pt-2 font-semibold',
          compact ? 'text-[12.5px]' : 'text-[13px]',
        )}
      >
        <span className="text-ink">Total due now</span>
        <span className="tabular-nums text-brand-700">{formatCurrency(pricing.totalDueNow, currency)}</span>
      </div>
    </div>
  );
};
