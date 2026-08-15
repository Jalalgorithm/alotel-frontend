import { useQuery } from '@tanstack/react-query';
import { Download, FileCheck, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/classNames';
import { formatCurrency, formatDate } from '@/utils/format';
import { queryKeys } from '@/lib/queryKeys';
import { ROOM_AREA_LABELS } from '@/lib/bookingSchema';
import { bookingService } from '../services/bookingService';

/**
 * What was found after checkout, and what it cost.
 *
 * This is the only place a guest can see damage charged against their deposit.
 * The standalone damage endpoint is staff-only; the guest report nests the same
 * items, so a deduction always arrives with the evidence and the reasoning
 * attached rather than as a number on a statement.
 *
 * Absent until staff generate it, which is the normal state for most of a
 * stay's life — so a 404 renders nothing at all rather than an empty panel.
 */

const SEVERITY = {
  minor: { label: 'Minor', tone: 'neutral' },
  moderate: { label: 'Moderate', tone: 'warn' },
  major: { label: 'Major', tone: 'danger' },
  severe: { label: 'Severe', tone: 'danger' },
};

export const CheckoutReportPanel = ({ booking, className }) => {
  const { data: report, isLoading } = useQuery({
    queryKey: queryKeys.bookings.checkoutReport(booking?.id),
    queryFn: () => bookingService.getCheckoutReport(booking.id),
    enabled: Boolean(booking?.id) && ['completed', 'active'].includes(booking?.status),
    retry: false,
  });

  if (isLoading) return <Skeleton className={cn('h-32 w-full rounded-card', className)} />;

  /* No report yet is the ordinary state, not an error worth a panel. */
  if (!report) return null;

  const currency = report.damageItems[0]?.currency ?? booking.currency ?? 'GBP';
  const deducted = report.damageItems.filter((item) => item.deductFromDeposit);

  return (
    <section className={cn('rounded-card border border-line bg-surface p-5 shadow-card', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="inline-flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
            <FileCheck className="size-4 text-brand-600" aria-hidden="true" />
            Check-out report
          </h2>
          <p className="mt-1 text-[12.5px] leading-5 text-ink-soft">
            {report.deductionTotal > 0
              ? 'What we found after you left, and what is being deducted from your deposit.'
              : 'What we found after you left. Nothing is being deducted from your deposit.'}
            {report.generatedAt && ` Prepared ${formatDate(report.generatedAt)}.`}
          </p>
        </div>

        <Badge variant={report.deductionTotal > 0 ? 'gold' : 'verified'}>
          {report.deductionTotal > 0 ? formatCurrency(report.deductionTotal, currency) : 'Nothing deducted'}
        </Badge>
      </div>

      {report.damageItems.length > 0 ? (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {report.damageItems.map((item) => {
            const severity = SEVERITY[item.severity] ?? SEVERITY.minor;
            /* The approved figure is what is actually charged; the estimate is
               shown only when it differs, so a guest can see it was revised. */
            const charged = item.approvedCost ?? item.estimatedCost;

            return (
              <li key={item.id} className="flex items-start gap-3 py-3">
                {item.photo && (
                  <a href={item.photo} target="_blank" rel="noreferrer noopener" className="shrink-0">
                    <img
                      src={item.photo}
                      alt={item.description || 'Damage photograph'}
                      className="size-14 rounded-lg border border-line object-cover"
                    />
                  </a>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-ink">
                    {ROOM_AREA_LABELS[item.roomArea] ?? item.roomArea}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-5 text-ink-soft">{item.description}</p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge variant={severity.tone}>{severity.label}</Badge>
                    {!item.deductFromDeposit && (
                      <span className="text-[11px] text-ink-muted">Not charged to you</span>
                    )}
                    {item.approvedCost != null && item.approvedCost !== item.estimatedCost && (
                      <span className="text-[11px] text-ink-muted">
                        Revised from {formatCurrency(item.estimatedCost, item.currency)}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={cn(
                    'shrink-0 text-[12.5px] font-semibold tabular-nums',
                    item.deductFromDeposit ? 'text-ink' : 'text-ink-muted line-through',
                  )}
                >
                  {formatCurrency(charged, item.currency)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-line p-3 text-[12.5px] text-ink-soft">
          Nothing was found. Your deposit is released in full.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {deducted.length > 0 && (
          <p className="inline-flex items-start gap-1.5 text-[11.5px] text-ink-soft">
            <TriangleAlert className="mt-px size-3 shrink-0 text-gold" aria-hidden="true" />
            Disagree with any of this? Message us below before the deposit is settled.
          </p>
        )}

        {report.pdfUrl && (
          <Button
            href={report.pdfUrl}
            target="_blank"
            rel="noreferrer noopener"
            size="sm"
            variant="secondary"
            leftIcon={<Download className="size-3.5" aria-hidden="true" />}
          >
            Download the report
          </Button>
        )}
      </div>
    </section>
  );
};
