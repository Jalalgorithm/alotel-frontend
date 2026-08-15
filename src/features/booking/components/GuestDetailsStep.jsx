import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bath, BedDouble, CalendarDays, Loader2, MapPin, Users } from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StepShell, StepActions } from './StepShell';
import { PriceSummary } from './PriceSummary';
import { DateRangeCalendar } from '@/features/properties';
import { guestDetailsSchema } from '@/utils/validators';
import { formatCurrency, formatDate } from '@/utils/format';
import { paths } from '@/routes/paths';

/** Compact summary of the residence being booked, shown beside the form. */
/** Range summary that expands into the shared availability calendar. */
const DateRangeField = ({ checkIn, checkOut, blockedDates, minStay, maxStay, onChange }) => {
  const [isOpen, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-2 rounded-md bg-black/[0.04] px-2 py-2 text-left transition-colors hover:bg-black/[0.06]"
      >
        <CalendarDays className="size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Dates</span>
          <span className="block truncate text-[11.5px] text-ink">
            {checkIn && checkOut ? `${formatDate(checkIn)} → ${formatDate(checkOut)}` : 'Choose your nights'}
          </span>
        </span>
        <span className="text-[11px] font-medium text-brand-700">{isOpen ? 'Done' : 'Change'}</span>
      </button>

      {isOpen && (
        <div className="mt-2 rounded-lg border border-line bg-surface p-2">
          <DateRangeCalendar
            blockedDates={blockedDates}
            checkIn={checkIn}
            checkOut={checkOut}
            minStay={minStay}
            maxStay={maxStay}
            monthsToShow={1}
            onChange={onChange}
            onDone={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

const PropertyPreview = ({
  property,
  pricing,
  currency,
  nights,
  register,
  errors,
  checkIn,
  checkOut,
  blockedDates,
  onDatesChange,
}) => (
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

      {/*
        Dates open the same calendar the property page uses, so the nights this
        property has already sold are greyed out here too. Native date inputs
        cannot express that — they were showing every night as bookable, and a
        guest only discovered the clash after picking.
      */}
      <div className="mt-4 border-t border-line pt-3">
        <DateRangeField
          checkIn={checkIn}
          checkOut={checkOut}
          blockedDates={blockedDates}
          minStay={property.minStay ?? 1}
          maxStay={property.maxStay}
          onChange={onDatesChange}
        />

        {/* The resolver still validates these; the calendar writes into them. */}
        <input type="hidden" {...register('checkIn')} />
        <input type="hidden" {...register('checkOut')} />
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
  blockedDates,
  draft,
  onSubmit,
}) => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
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
  const checkOut = watch('checkOut');

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
            checkOut={checkOut}
            blockedDates={blockedDates}
            onDatesChange={({ checkIn: from, checkOut: to }) => {
              /* `shouldValidate` so an invalid range surfaces immediately
                 rather than on submit. */
              setValue('checkIn', from, { shouldValidate: true, shouldDirty: true });
              setValue('checkOut', to ?? '', { shouldValidate: true, shouldDirty: true });
            }}
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
