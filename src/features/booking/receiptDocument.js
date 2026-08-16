import { formatCurrency, formatDate } from '@/utils/format';
import { brandMarkSvg } from '@/lib/brandMark';

/**
 * The downloadable receipt, built as a complete standalone HTML document and
 * printed from a hidden iframe.
 *
 * The obvious approach — render the receipt inside the page and hide everything
 * else with print CSS — is fragile: it depends on where the receipt happens to
 * sit in the DOM. The first version did exactly that and produced a blank page,
 * because the receipt lives three levels inside the site layout and the rule
 * hiding "everything else" also hid its own ancestor.
 *
 * An iframe carries its own document, so nothing in the app's markup or
 * stylesheet can reach it. It cannot come out blank, and it cannot drift when
 * the page layout changes. It also avoids `window.open`, which popup blockers
 * routinely swallow.
 */

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Statuses that mean money has actually arrived. */
const SETTLED = ['confirmed', 'active', 'completed'];

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }

  body {
    font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    color: #1c2b24;
    font-size: 12px;
    line-height: 1.55;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .sheet { max-width: 760px; margin: 0 auto; padding: 0 0 32px; }

  /* Brand band — the one piece of heavy colour, so the rest stays legible
     even on a printer that drops backgrounds. */
  .band {
    background: #12603f;
    color: #fff;
    padding: 26px 34px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
  }
  .brand { display: flex; align-items: center; gap: 11px; }
  .brand svg { flex: 0 0 auto; }
  .brand .wordmark { font-size: 21px; font-weight: 700; letter-spacing: -0.2px; line-height: 1.05; }
  .brand .wordmark span { display: block; font-size: 9.5px; font-weight: 600; letter-spacing: 3.4px; opacity: .75; margin-top: 2px; }
  .doc-type { text-align: right; }
  .doc-type h1 { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase; }
  .doc-type p { margin: 4px 0 0; font-size: 10.5px; opacity: .8; }

  .status {
    display: inline-block; margin-top: 8px; padding: 3px 10px; border-radius: 999px;
    font-size: 9.5px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase;
  }
  .status.paid { background: #d8f0e2; color: #12603f; }
  .status.unpaid { background: #fceccd; color: #7a5200; }

  .body { padding: 0 34px; }

  .meta { display: flex; gap: 32px; padding: 22px 0; border-bottom: 1px solid #e3e9e5; }
  .meta > div { flex: 1; }
  .label { font-size: 8.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #7c8a83; margin-bottom: 5px; }
  .meta .value { font-size: 12px; }
  .meta .value strong { display: block; font-weight: 600; }
  .mono { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: 10px; word-break: break-all; }

  table.items { width: 100%; border-collapse: collapse; margin-top: 22px; }
  table.items thead th {
    text-align: left; font-size: 8.5px; letter-spacing: 1px; text-transform: uppercase;
    color: #7c8a83; padding: 0 0 8px; border-bottom: 1.5px solid #12603f;
  }
  table.items td { padding: 9px 0; border-bottom: 1px solid #eef2f0; vertical-align: top; }
  table.items .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  table.items .desc strong { font-weight: 600; }
  table.items .desc small { display: block; color: #7c8a83; font-size: 10px; margin-top: 1px; }

  .totals { margin-top: 18px; margin-left: auto; width: 260px; }
  .totals div { display: flex; justify-content: space-between; padding: 5px 0; }
  .totals .grand {
    margin-top: 6px; padding-top: 10px; border-top: 2px solid #12603f;
    font-size: 15px; font-weight: 700;
  }
  .totals .grand span:last-child { color: #12603f; }
  .note { margin-top: 6px; font-size: 9.5px; color: #7c8a83; text-align: right; }

  .section { margin-top: 26px; }
  .section h2 { margin: 0 0 8px; font-size: 8.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #7c8a83; }
  .payments { width: 100%; border-collapse: collapse; }
  .payments td { padding: 7px 0; border-bottom: 1px solid #eef2f0; font-size: 11.5px; }
  .payments .num { text-align: right; font-variant-numeric: tabular-nums; }
  .empty { color: #7c8a83; font-size: 11.5px; }

  footer {
    margin-top: 30px; padding-top: 14px; border-top: 1px solid #e3e9e5;
    font-size: 9.5px; color: #7c8a83; line-height: 1.6;
  }
  footer strong { color: #1c2b24; }

  /*
   * Watermark. A fixed position is what makes it repeat on every printed
   * page — a normally-positioned element would appear once and then scroll
   * away. It sits behind the content and is faint enough to read straight
   * through. The exact print-color-adjust on the body stops the printer
   * dropping it as a background.
   *
   * (No backticks in this comment: the whole block is a template literal.)
   */
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 460px;
    text-align: center;
    color: #12603f;
    opacity: 0.045;
    z-index: 0;
    pointer-events: none;
  }
  .watermark .mark-text { font-size: 62px; font-weight: 700; letter-spacing: -1px; line-height: 1; margin-top: 10px; }
  .watermark .mark-sub { font-size: 25px; font-weight: 600; letter-spacing: 15px; margin-top: 4px; }

  /* Everything else rides above the watermark. */
  .sheet { position: relative; z-index: 1; }

  @page { size: A4; margin: 14mm; }
  @media print {
    .sheet { max-width: none; }
    .band { padding: 22px 26px; }
    .body { padding: 0 26px; }
  }
`;

/**
 * @param {{ receipt, booking, property, guest }} data
 * @returns {string} a complete HTML document
 */
/**
 * @param {object} args
 * @param {object} args.receipt   line items, payments and totals
 * @param {object} [args.booking] the stay, for the dates line
 * @param {object} [args.property] what was booked
 * @param {object} [args.guest]   who it is billed to
 * @param {object} [args.labels]  overrides for the two wording-specific rows —
 *   a space is hired for a window of hours, not slept in for a number of
 *   nights, so "Residence"/"Stay" would be wrong on its receipt. Everything
 *   else is identical, which is the point: one template, one look.
 * @param {string} [args.stayLine] pre-rendered HTML for the period booked
 */
export const buildReceiptHtml = ({ receipt, booking, property, guest, labels, stayLine }) => {
  const subjectLabel = labels?.subject ?? 'Residence';
  const periodLabel = labels?.period ?? 'Stay';
  const currency = receipt.currency;
  const money = (value, code = currency) => escapeHtml(formatCurrency(Number(value) || 0, code));
  const isPaid = SETTLED.includes(receipt.status) || receipt.payments.some((p) => p.status === 'succeeded');

  const rows = receipt.lineItems
    .map(
      (item) => `
        <tr>
          <td class="desc"><strong>${escapeHtml(item.label)}</strong>${
            item.quantity > 1 ? `<small>${money(item.unitAmount, item.currency)} × ${item.quantity}</small>` : ''
          }</td>
          <td class="num">${escapeHtml(item.quantity)}</td>
          <td class="num">${money(item.total, item.currency)}</td>
        </tr>`,
    )
    .join('');

  const payments = receipt.payments.length
    ? `<table class="payments">${receipt.payments
        .map(
          (payment) => `
            <tr>
              <td>${escapeHtml(payment.provider ?? 'Payment')} · ${escapeHtml(payment.status ?? '')}${
                payment.createdAt ? ` · ${escapeHtml(formatDate(payment.createdAt))}` : ''
              }${payment.reference ? `<br><span class="mono">${escapeHtml(payment.reference)}</span>` : ''}</td>
              <td class="num">${money(payment.amount, payment.currency)}</td>
            </tr>`,
        )
        .join('')}</table>`
    : '<p class="empty">No payment has settled against this booking yet.</p>';

  const stay = stayLine
    ? stayLine
    : booking
    ? `${escapeHtml(formatDate(booking.checkIn))} → ${escapeHtml(formatDate(booking.checkOut))}<br>
       <small style="color:#7c8a83">${booking.nights} ${booking.nights === 1 ? 'night' : 'nights'} · ${
         booking.adults
       } ${booking.adults === 1 ? 'adult' : 'adults'}${booking.children ? `, ${booking.children} children` : ''}${
         booking.infants ? `, ${booking.infants} infants` : ''
       }</small>`
    : '—';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Alotel Spaces receipt ${escapeHtml(String(receipt.bookingId).slice(0, 8))}</title>
<style>${STYLES}</style>
</head>
<body>
  <div class="watermark" aria-hidden="true">
    ${brandMarkSvg({ size: 190, color: '#12603f' })}
    <div class="mark-text">Alotel</div>
    <div class="mark-sub">SPACES</div>
  </div>

  <div class="sheet">
    <div class="band">
      <div class="brand">${brandMarkSvg({ size: 38, color: '#ffffff' })}<div class="wordmark">Alotel<span>SPACES</span></div></div>
      <div class="doc-type">
        <h1>Booking receipt</h1>
        <p>Issued ${escapeHtml(formatDate(receipt.generatedAt ?? new Date().toISOString()))}</p>
        <span class="status ${isPaid ? 'paid' : 'unpaid'}">${isPaid ? 'Paid' : 'Payment outstanding'}</span>
      </div>
    </div>

    <div class="body">
      <div class="meta">
        <div>
          <div class="label">Billed to</div>
          <div class="value"><strong>${escapeHtml(guest?.fullName ?? 'Guest')}</strong>${escapeHtml(
            guest?.email ?? '',
          )}</div>
        </div>
        <div>
          <div class="label">${escapeHtml(subjectLabel)}</div>
          <div class="value"><strong>${escapeHtml(property?.name ?? subjectLabel)}</strong>${escapeHtml(
            [property?.city, property?.country].filter(Boolean).join(', '),
          )}</div>
        </div>
        <div>
          <div class="label">${escapeHtml(periodLabel)}</div>
          <div class="value">${stay}</div>
        </div>
      </div>

      <div class="meta" style="border-bottom:none;padding-bottom:0">
        <div>
          <div class="label">Booking reference</div>
          <div class="value mono">${escapeHtml(receipt.bookingId)}</div>
        </div>
        <div>
          <div class="label">Status</div>
          <div class="value">${escapeHtml(receipt.statusLabel ?? receipt.status)}</div>
        </div>
        <div>
          <div class="label">Currency</div>
          <div class="value">${escapeHtml(currency)}</div>
        </div>
      </div>

      <table class="items">
        <thead>
          <tr><th>Description</th><th class="num">Qty</th><th class="num">Amount</th></tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="3" class="empty">No line items recorded.</td></tr>'}</tbody>
      </table>

      ${
        receipt.totals
          ? `<div class="totals">
               <div class="grand"><span>Total</span><span>${money(receipt.totals.totalDueNow)}</span></div>
             </div>
             ${
               receipt.totals.securityDeposit > 0
                 ? `<p class="note">Includes a refundable security deposit of ${money(
                     receipt.totals.securityDeposit,
                   )}, released after checkout.</p>`
                 : ''
             }`
          : ''
      }

      <div class="section">
        <h2>Payments</h2>
        ${payments}
      </div>

      <footer>
        <p><strong>Alotel Spaces</strong> · support@alotelspaces.com</p>
        <p>This receipt reflects the booking record at the time of issue. Refunds and deposit releases follow the
        cancellation policy agreed at the time of booking.</p>
      </footer>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Print the receipt from an off-screen iframe.
 *
 * The iframe is removed once the print dialog closes. `onafterprint` is not
 * reliable across browsers, so a timeout backs it up — leaving the node behind
 * would be harmless but untidy.
 */
export const printReceipt = (data) => {
  const frame = document.createElement('iframe');
  frame.setAttribute('title', 'Booking receipt');
  frame.setAttribute('aria-hidden', 'true');
  // Off-screen rather than `display:none`, which stops some browsers printing.
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(frame);

  const cleanup = () => frame.remove();

  frame.onload = () => {
    const view = frame.contentWindow;
    if (!view) return cleanup();

    view.addEventListener('afterprint', cleanup, { once: true });
    view.focus();
    view.print();

    // Safari and some mobile browsers never fire `afterprint`.
    setTimeout(cleanup, 60000);
    return undefined;
  };

  const doc = frame.contentWindow?.document;
  if (!doc) return cleanup();

  doc.open();
  doc.write(buildReceiptHtml(data));
  doc.close();
  return undefined;
};
