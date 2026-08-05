import { AlertTriangle, Bath, BedDouble, MapPin, Users } from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { StepShell, StepActions } from './StepShell';
import { PriceSummary } from './PriceSummary';
import { formatBookingDate } from '@/utils/format';

const Row = ({ label, value, emphasis = false }) => (
  <div className="flex items-center justify-between gap-4 py-2 text-[13px]">
    <span className={emphasis ? 'font-display font-semibold text-ink' : 'text-ink-soft'}>{label}</span>
    <span className={emphasis ? 'font-display font-semibold italic text-ink' : 'font-medium italic text-ink'}>
      {value}
    </span>
  </div>
);

/**
 * Step 2 — "Review Booking".
 *
 * Every figure shown here comes from the availability quote, which is the same
 * calculation the booking will be created with. Nothing is re-derived on the
 * client, so what the guest approves is exactly what they are charged.
 */
export const ReviewStep = ({
  property,
  pricing,
  currency,
  nights,
  availability,
  draft,
  onBack,
  onContinue,
  isPending,
}) => {
  const { adults, children, infants } = draft.stay;
  const partySize = [
    `${adults} ${adults === 1 ? 'adult' : 'adults'}`,
    children > 0 && `${children} ${children === 1 ? 'child' : 'children'}`,
    infants > 0 && `${infants} ${infants === 1 ? 'infant' : 'infants'}`,
  ]
    .filter(Boolean)
    .join(', ');

  const isUnavailable = availability && !availability.isAvailable;
  const canContinue = Boolean(pricing) && !isUnavailable;

  return (
    <StepShell title="Review Booking" subtitle="Please review your booking details" width="max-w-md">
      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <div className="relative">
          <Image src={property.images?.[0]} alt={property.name} wrapperClassName="aspect-16/10 w-full" />
          {property.verified && (
            <Badge variant="gold" className="absolute right-3 top-3">
              Verified
            </Badge>
          )}
        </div>

        <div className="p-5">
          <h2 className="font-display text-[15px] font-semibold text-brand-700">{property.name}</h2>

          <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-ink-soft">
            <MapPin className="size-3 text-brand-600" aria-hidden="true" />
            {property.city}, {property.country}
          </p>

          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-soft">
            <span className="inline-flex items-center gap-1">
              <BedDouble className="size-3" aria-hidden="true" />
              {property.beds || 'Studio'} {property.beds ? 'Beds' : ''}
            </span>
            <span className="inline-flex items-center gap-1">
              <Bath className="size-3" aria-hidden="true" />
              {property.baths} Baths
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" aria-hidden="true" />
              {adults + children} Guests
            </span>
          </p>

          <div className="mt-4 divide-y divide-line border-t border-line pt-1">
            <Row label="Check-in" value={formatBookingDate(draft.stay.checkIn)} />
            <Row label="Check-out" value={formatBookingDate(draft.stay.checkOut)} />
            <Row label="Nights" value={`${nights} ${nights === 1 ? 'night' : 'nights'}`} />
            <Row label="Party" value={partySize} />
          </div>

          {draft.stay.specialRequests && (
            <p className="mt-3 rounded-lg bg-line-soft px-3 py-2 text-[12px] text-ink-soft">
              <span className="font-semibold text-ink">Requests: </span>
              {draft.stay.specialRequests}
            </p>
          )}

          <h3 className="mt-5 font-display text-[14px] font-semibold italic text-ink">Payment Summary</h3>

          {pricing ? (
            <PriceSummary
              pricing={pricing}
              nights={nights}
              currency={currency}
              country={property.location}
              className="mt-2"
            />
          ) : (
            <p className="py-3 text-[12.5px] text-ink-muted">Working out your total…</p>
          )}
        </div>
      </div>

      {isUnavailable && (
        <Alert variant="error" title="These dates are no longer available" className="mt-4">
          <ul className="mt-1 space-y-1">
            {availability.conflicts.map((reason) => (
              <li key={reason} className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {reason}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <StepActions>
        <Button size="lg" fullWidth onClick={onContinue} isLoading={isPending} disabled={!canContinue}>
          Confirm and hold my dates
        </Button>
        <Button variant="muted" fullWidth onClick={onBack}>
          Back
        </Button>
      </StepActions>
    </StepShell>
  );
};
