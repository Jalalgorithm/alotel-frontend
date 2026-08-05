import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bath, BedDouble, CalendarDays, Loader2, MapPin, Users } from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StepShell, StepActions } from './StepShell';
import { PriceSummary } from './PriceSummary';
import { guestDetailsSchema } from '@/utils/validators';
import { formatCurrency } from '@/utils/format';
import { paths } from '@/routes/paths';
import { addDays, todayIso } from '@/lib/bookingSchema';

/** Compact summary of the residence being booked, shown beside the form. */
const PropertyPreview = ({ property, pricing, currency, nights, register, errors, checkIn }) => (
  // A container query, not a media query: this card is full width on phones but
  // only ~320px inside the two-column layout, so its own width is what decides
  // whether the fields fit side by side.
  <div className="@container overflow-hidden rounded-card border border-line bg-surface shadow-card">
    <Image src={property.images?.[0]} alt={property.name} wrapperClassName="aspect-4/3 w-full" />

    <div className="p-4">
      <h2 className="font-display text-[15px] font-semibold text-brand-700">{property.name}</h2>

      <p className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink-soft">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3 text-brand-600" aria-hidden="true" />
          {property.city}, {property.country}
        </span>
        {pricing && (
          <span className="font-semibold text-ink">
            {formatCurrency(pricing.nightlyTotal, currency)}{' '}
            <span className="font-normal text-ink-muted">per</span>{' '}
            <span className="text-brand-600">
              {nights} {nights === 1 ? 'night' : 'nights'}
            </span>
          </span>
        )}
      </p>

      <p className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-soft">
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
          {property.guests} Max
        </span>
      </p>

      {/* Dates live with the property, exactly as in the design. Native date
          inputs need ~120px, so they stack until there is room. */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 border-t border-line pt-3 @[24rem]:grid-cols-2">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          Check-in
          <span className="mt-1 flex items-center gap-1 rounded-md bg-black/[0.04] px-2 py-2">
            <CalendarDays className="size-3 shrink-0 text-ink-muted" aria-hidden="true" />
            <input
              type="date"
              min={todayIso()}
              className="h-6 w-full min-w-0 bg-transparent text-[11px] text-ink focus:outline-none"
              {...register('checkIn')}
            />
          </span>
        </label>

        <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          Check-out
          <span className="mt-1 flex items-center gap-1 rounded-md bg-black/[0.04] px-2 py-2">
            <CalendarDays className="size-3 shrink-0 text-ink-muted" aria-hidden="true" />
            <input
              type="date"
              min={checkIn ? addDays(checkIn, 1) : todayIso()}
              className="h-6 w-full min-w-0 bg-transparent text-[11px] text-ink focus:outline-none"
              {...register('checkOut')}
            />
          </span>
        </label>
      </div>

      {/* Adults, children and infants are separate because the API counts them
          separately — infants don't consume the property's guest allowance. */}
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {[
          { name: 'adults', label: 'Adults', min: 1, max: property.guests || 20 },
          { name: 'children', label: 'Children', min: 0, max: property.guests || 20 },
          { name: 'infants', label: 'Infants', min: 0, max: 5 },
        ].map((field) => (
          <label key={field.name} className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            {field.label}
            <input
              type="number"
              min={field.min}
              max={field.max}
              className="mt-1 h-9 w-full min-w-0 rounded-md bg-black/[0.04] px-2 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-brand-600/15"
              {...register(field.name, { valueAsNumber: true })}
            />
          </label>
        ))}
      </div>

      {(errors.checkIn || errors.checkOut) && (
        <p className="mt-2 text-xs text-danger">{errors.checkIn?.message ?? errors.checkOut?.message}</p>
      )}

      {/* The full quote, tax included, from the very first step — so the
          number never changes shape as the guest moves through the wizard. */}
      {pricing && (
        <PriceSummary
          pricing={pricing}
          nights={nights}
          currency={currency}
          country={property.location}
          compact
          className="mt-3 border-t border-line pt-3"
        />
      )}
    </div>
  </div>
);

/** Step 1 — "Property & Guest Details". */
export const GuestDetailsStep = ({
  property,
  pricing,
  currency,
  nights,
  availability,
  isCheckingAvailability,
  draft,
  onSubmit,
}) => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(guestDetailsSchema),
    defaultValues: {
      ...draft.guest,
      checkIn: draft.stay.checkIn,
      checkOut: draft.stay.checkOut,
      adults: draft.stay.adults,
      children: draft.stay.children,
      infants: draft.stay.infants,
      specialRequests: draft.stay.specialRequests,
    },
  });

  /**
   * The signed-in guest's profile arrives asynchronously, usually a beat after
   * this form mounts — and `defaultValues` are only read once. Without this the
   * name and email fields stay empty and validation blocks the step even though
   * the wizard has the details.
   *
   * `isDirty` guards it: once the guest starts typing, their input wins.
   */
  useEffect(() => {
    if (isDirty || !draft.guest.email) return;

    reset({
      ...draft.guest,
      checkIn: draft.stay.checkIn,
      checkOut: draft.stay.checkOut,
      adults: draft.stay.adults,
      children: draft.stay.children,
      infants: draft.stay.infants,
      specialRequests: draft.stay.specialRequests,
    });
  }, [draft, isDirty, reset]);

  const checkIn = watch('checkIn');

  const submit = (values) => {
    const { checkIn: from, checkOut, adults, children, infants, specialRequests, ...guest } = values;
    onSubmit({
      guest,
      stay: { checkIn: from, checkOut, adults, children, infants, specialRequests },
    });
  };

  // The wizard's own availability check runs against the draft, which only
  // updates on submit — so this reflects the last confirmed selection.
  const isUnavailable = availability && !availability.isAvailable;

  return (
    <StepShell title="Property & Guest Details" subtitle="Confirm your dates and who is staying">
      <form onSubmit={handleSubmit(submit)} noValidate>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <PropertyPreview
            property={property}
            pricing={pricing}
            currency={currency}
            nights={nights}
            register={register}
            errors={errors}
            checkIn={checkIn}
          />

          <div className="space-y-4">
            <Input
              label="First Name"
              placeholder="Please type here…"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last Name"
              placeholder="Please type here…"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="Please type here…"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="Please type here…"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Textarea
              label="Special requests (optional)"
              rows={3}
              placeholder="Late arrival, accessibility needs, anything we should know…"
              {...register('specialRequests')}
            />
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-xs text-center" aria-live="polite">
          {isCheckingAvailability && (
            <p className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Rechecking availability…
            </p>
          )}

          {!isCheckingAvailability &&
            isUnavailable &&
            availability.conflicts.map((reason) => (
              <p key={reason} className="inline-flex items-start gap-1.5 text-[12px] text-danger">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {reason}
              </p>
            ))}
        </div>

        <StepActions>
          <Button type="submit" size="lg" fullWidth>
            Continue
          </Button>
          <Button
            type="button"
            variant="muted"
            fullWidth
            onClick={() => navigate(paths.propertyDetail(property.id))}
          >
            Cancel
          </Button>
        </StepActions>
      </form>
    </StepShell>
  );
};
