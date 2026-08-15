import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Check, Info, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/utils/classNames';
import { formatCurrency } from '@/utils/format';
import { selectIsAuthenticated, useAuthStore } from '@/stores/authStore';
import { capacityCheck, rateSuffix } from '@/lib/spaceSchema';
import { useSpaceAvailability, useSpaceQuote } from '../hooks/useSpaces';
import { TimeWindowPicker } from './TimeWindowPicker';

/**
 * The booking panel — date, window, layout, add-ons, price, book.
 *
 * Kept as one scrolling panel rather than a multi-page wizard: every decision
 * here changes the price, and splitting them across pages hides that
 * relationship exactly when the guest is trying to weigh it. The running total
 * stays pinned at the bottom for the same reason.
 *
 * Submission is blocked, not merely validated, whenever the selection cannot be
 * honoured — over capacity, no window chosen, or an unavailable slot.
 */

const today = () => new Date().toISOString().slice(0, 10);

const AddonRow = ({ addon, qty, guestCount, currency, onChange }) => {
  const isPerPerson = addon.unitType === 'per_person';
  const isChecked = qty > 0;

  /* Per-person add-ons follow the head count — nobody orders 32 lunches by
     pressing "+" 32 times, and a mismatch there is a catering error. */
  const toggle = () => onChange(isChecked ? 0 : isPerPerson ? Math.max(addon.minQty, guestCount || 1) : 1);

  return (
    <li className="flex items-start gap-2.5 py-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={isChecked}
        onClick={toggle}
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
          isChecked ? 'border-brand-600 bg-brand-600' : 'border-line bg-surface hover:border-brand-400',
        )}
      >
        {isChecked && <Check className="size-2.5 text-white" aria-hidden="true" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-ink">{addon.name}</p>
        <p className="text-[11px] text-ink-muted">
          {formatCurrency(addon.price, currency)}
          {addon.unitType === 'per_person' && ' per person'}
          {addon.unitType === 'per_hour' && ' per hour'}
          {addon.minQty > 0 && ` · minimum ${addon.minQty}`}
        </p>
      </div>

      {isChecked && addon.unitType !== 'flat' && (
        <input
          type="number"
          min={addon.minQty || 1}
          max={addon.maxQty ?? undefined}
          value={qty}
          onChange={(event) => onChange(Number(event.target.value) || 0)}
          aria-label={`${addon.name} quantity`}
          className="h-7 w-16 rounded border border-line px-1.5 text-right text-[12px] tabular-nums"
        />
      )}
    </li>
  );
};

export const SpaceBookingPanel = ({ space }) => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const [date, setDate] = useState(today());
  const [window, setWindow] = useState({ startTime: '', endTime: '' });
  const [layoutId, setLayoutId] = useState(space.layouts[0]?.id ?? '');
  const [guestCount, setGuestCount] = useState(1);
  const [addonQty, setAddonQty] = useState({});

  const { data: availability, isLoading: loadingAvailability } = useSpaceAvailability(space.id, date);
  const { getQuote, result: quote, isPending: quoting } = useSpaceQuote(space.id);

  const layout = space.layouts.find((entry) => entry.id === layoutId);
  const capacity = capacityCheck(layout, guestCount);
  const hasWindow = Boolean(window.startTime && window.endTime);

  const addons = useMemo(
    () =>
      Object.entries(addonQty)
        .filter(([, qty]) => qty > 0)
        .map(([addonId, qty]) => ({ addonId, qty })),
    [addonQty],
  );

  /* Re-price whenever anything that affects the price moves. */
  useEffect(() => {
    if (!hasWindow || capacity !== 'ok') return;
    getQuote({ date, startTime: window.startTime, endTime: window.endTime, layoutId, guestCount, addons });
  }, [date, window.startTime, window.endTime, layoutId, guestCount, addons, hasWindow, capacity, getQuote]);

  /* A window chosen on one date means nothing on another. */
  useEffect(() => setWindow({ startTime: '', endTime: '' }), [date]);

  const canBook = hasWindow && capacity === 'ok' && quote?.capacityCheck === 'ok' && !quoting;

  const submit = () => {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/spaces/${space.id}`)}`);
      return;
    }

    /*
     * Hand off to checkout rather than booking here. The panel configures a
     * space; committing money is a separate decision, and it deserves the same
     * review-then-choose-a-provider flow a property booking gets.
     */
    navigate(`/spaces/${space.id}/book`, {
      state: {
        selection: { date, startTime: window.startTime, endTime: window.endTime, layoutId, guestCount, addons },
      },
    });
  };

  const isRequest = space.bookingMode === 'request';

  return (
    <div className="rounded-card border border-line bg-surface shadow-card">
      <div className="border-b border-line p-4">
        <p className="font-display text-[18px] font-semibold text-ink">
          {formatCurrency(space.baseRate, space.currency, { decimals: 0 })}
          <span className="text-[12.5px] font-normal text-ink-muted"> / {rateSuffix(space)}</span>
        </p>
        <p className="mt-1 inline-flex items-center gap-1.5 text-[11.5px] text-ink-soft">
          {isRequest ? (
            <>
              <Info className="size-3 text-brand-600" aria-hidden="true" />
              The host confirms within {space.approvalExpiryHours} hours
            </>
          ) : (
            <>
              <Zap className="size-3 text-brand-600" aria-hidden="true" />
              Confirmed instantly
            </>
          )}
        </p>
      </div>

      <div className="space-y-4 p-4">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">Date</span>
          <div className="relative">
            <CalendarDays
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="date"
              min={today()}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-[13px] text-ink focus:border-brand-600 focus:outline-none"
            />
          </div>
        </label>

        <div>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
            Time
          </span>
          {loadingAvailability ? (
            <Spinner className="size-4" />
          ) : (
            <TimeWindowPicker space={space} availability={availability} value={window} onChange={setWindow} />
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
            Layout
          </span>
          <div className="space-y-1.5">
            {space.layouts.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setLayoutId(entry.id)}
                aria-pressed={entry.id === layoutId}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors',
                  entry.id === layoutId ? 'border-brand-700 bg-brand-50' : 'border-line hover:border-brand-300',
                )}
              >
                <span className="text-[12.5px] font-medium text-ink">{entry.name}</span>
                <span className="text-[11.5px] text-ink-muted">up to {entry.maxCapacity}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
            Guests
          </span>
          <div className="relative">
            <Users
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="number"
              min="1"
              value={guestCount}
              onChange={(event) => setGuestCount(Number(event.target.value) || 1)}
              className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-[13px] tabular-nums text-ink focus:border-brand-600 focus:outline-none"
            />
          </div>
        </label>

        {/* Caught here rather than by the server after submission — §A.3.3. */}
        {capacity === 'exceeds_layout' && (
          <Alert
            variant="warn"
            title="Too many guests for this layout"
            facts={[
              { label: 'You need', value: `${guestCount} seats` },
              { label: `${layout?.name} holds`, value: `${layout?.maxCapacity}` },
            ]}
          >
            Choose a larger layout, or reduce the number of guests.
          </Alert>
        )}

        {space.addons.length > 0 && (
          <div>
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
              Add-ons
            </span>
            {Object.entries(
              space.addons.reduce((groups, addon) => {
                (groups[addon.category] ??= []).push(addon);
                return groups;
              }, {}),
            ).map(([groupName, groupAddons]) => (
              <div key={groupName} className="mt-1.5">
                <p className="text-[11px] font-semibold text-ink-soft">{groupName}</p>
                <ul className="divide-y divide-line">
                  {groupAddons.map((addon) => (
                    <AddonRow
                      key={addon.id}
                      addon={addon}
                      qty={addonQty[addon.id] ?? 0}
                      guestCount={guestCount}
                      currency={space.currency}
                      onChange={(qty) => setAddonQty((current) => ({ ...current, [addon.id]: qty }))}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky summary — the running total stays visible while choices change. */}
      <div className="sticky bottom-0 rounded-b-card border-t border-line bg-surface/95 p-4 backdrop-blur">
        {quote?.capacityCheck === 'ok' && (
          <dl className="mb-3 space-y-1 text-[12.5px]">
            <div className="flex justify-between">
              <dt className="text-ink-soft">
                {quote.slots} × {rateSuffix(space)}
              </dt>
              <dd className="tabular-nums text-ink">{formatCurrency(quote.basePrice, space.currency)}</dd>
            </div>
            {quote.addonsPrice > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">Add-ons</dt>
                <dd className="tabular-nums text-ink">{formatCurrency(quote.addonsPrice, space.currency)}</dd>
              </div>
            )}
            {quote.taxLineItems.map((line) => (
              <div key={line.label} className="flex justify-between">
                <dt className="text-ink-soft">{line.label}</dt>
                <dd className="tabular-nums text-ink">{formatCurrency(line.amount, space.currency)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-1.5 font-semibold">
              <dt className="text-ink">Total</dt>
              <dd className="tabular-nums text-ink">{formatCurrency(quote.totalPrice, space.currency)}</dd>
            </div>
          </dl>
        )}

        <Button fullWidth size="lg" disabled={!canBook} isLoading={quoting} onClick={submit}>
          {!isAuthenticated ? 'Sign in to book' : 'Review and book'}
        </Button>

        {!hasWindow && (
          <p className="mt-2 text-center text-[11px] text-ink-muted">Choose a time to see the total.</p>
        )}

        {quote?.isTaxEstimated && quote?.capacityCheck === 'ok' && (
          <p className="mt-2 text-center text-[10.5px] text-ink-muted">
            Tax shown is an estimate until the space is confirmed.
          </p>
        )}
      </div>
    </div>
  );
};
