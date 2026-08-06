import { forwardRef } from 'react';
import { formatCurrency, formatDate } from '@/utils/format';

/**
 * The printable receipt.
 *
 * Rendered off-screen and revealed only for `window.print()`, which lets the
 * browser's own "Save as PDF" produce the file. That avoids shipping a PDF
 * library for one document, and the output is selectable text rather than an
 * image — which matters if a guest needs to forward it for expenses.
 *
 * Every figure comes from `/bookings/{id}/receipt/`; nothing is recomputed.
 */
export const BookingReceipt = forwardRef(function BookingReceipt(
  { receipt, booking, property, guest },
  ref,
) {
  if (!receipt) return null;

  const currency = receipt.currency;

  return (
    <div ref={ref} className="print-receipt" aria-hidden="true">
      <div className="mx-auto max-w-[640px] bg-white p-10 text-ink">
        <header className="flex items-start justify-between gap-6 border-b border-line pb-5">
          <div>
            <p className="font-display text-[20px] font-bold text-brand-700">Alotel Spaces</p>
            <p className="mt-0.5 text-[11px] text-ink-muted">Booking receipt</p>
          </div>
          <div className="text-right text-[11px] text-ink-muted">
            <p>
              Issued <span className="text-ink">{formatDate(receipt.generatedAt ?? new Date().toISOString())}</span>
            </p>
            <p className="mt-0.5">
              Reference <span className="font-mono text-ink">{receipt.bookingId}</span>
            </p>
            <p className="mt-0.5">
              Status <span className="text-ink">{receipt.statusLabel}</span>
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 border-b border-line py-5 text-[12px]">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.07em] text-ink-muted">Billed to</p>
            <p className="text-ink">{guest?.fullName ?? '—'}</p>
            <p className="text-ink-muted">{guest?.email}</p>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.07em] text-ink-muted">Stay</p>
            <p className="text-ink">{property?.name ?? 'Residence'}</p>
            {property?.city && (
              <p className="text-ink-muted">
                {property.city}
                {property.country ? `, ${property.country}` : ''}
              </p>
            )}
            {booking && (
              <p className="mt-1 text-ink-muted">
                {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} · {booking.nights}{' '}
                {booking.nights === 1 ? 'night' : 'nights'}
              </p>
            )}
          </div>
        </section>

        <table className="w-full border-collapse py-4 text-[12px]">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="py-2 font-semibold">Description</th>
              <th className="py-2 text-right font-semibold">Qty</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {receipt.lineItems.map((item, index) => (
              <tr key={`${item.type}-${index}`} className="border-b border-line/60">
                <td className="py-2 text-ink">{item.label}</td>
                <td className="py-2 text-right text-ink-muted">{item.quantity}</td>
                <td className="py-2 text-right tabular-nums text-ink">
                  {formatCurrency(item.total, item.currency ?? currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {receipt.totals && (
          <div className="ml-auto mt-4 w-full max-w-[260px] text-[12px]">
            <div className="flex justify-between border-t-2 border-ink py-2 font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(receipt.totals.totalDueNow, currency)}</span>
            </div>
            {receipt.totals.securityDeposit > 0 && (
              <p className="mt-1 text-right text-[10px] text-ink-muted">
                Includes a refundable {formatCurrency(receipt.totals.securityDeposit, currency)} deposit
              </p>
            )}
          </div>
        )}

        <section className="mt-6 border-t border-line pt-4 text-[11px]">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.07em] text-ink-muted">Payments</p>
          {receipt.payments.length ? (
            <ul className="space-y-1">
              {receipt.payments.map((payment, index) => (
                <li key={payment.id ?? index} className="flex justify-between">
                  <span className="text-ink-muted">
                    {payment.provider} · {payment.status}
                    {payment.reference ? ` · ${String(payment.reference).slice(0, 24)}` : ''}
                  </span>
                  <span className="tabular-nums text-ink">
                    {formatCurrency(payment.amount, payment.currency ?? currency)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-muted">No payment has settled against this booking yet.</p>
          )}
        </section>

        <footer className="mt-8 border-t border-line pt-4 text-[10px] text-ink-muted">
          <p>
            This receipt is generated from the booking record and reflects its state at the time of issue. Refunds and
            deposit releases follow the cancellation policy agreed at booking.
          </p>
          <p className="mt-1">Alotel Spaces · support@alotelspaces.com</p>
        </footer>
      </div>
    </div>
  );
});
