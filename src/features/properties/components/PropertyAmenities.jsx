import {
  Accessibility,
  AirVent,
  CheckCircle2,
  Dumbbell,
  MoveVertical,
  PanelTop,
  ShieldCheck,
  Smartphone,
  Waves,
  Wifi,
} from 'lucide-react';

/** Amenity label -> icon. Unknown amenities fall back to a generic tick. */
const AMENITY_ICONS = {
  'Infinity Pool': Waves,
  '24/7 Security': ShieldCheck,
  'High Speed Wi-Fi': Wifi,
  'Private Balcony': PanelTop,
  'Air Conditioning': AirVent,
  'Smart Home System': Smartphone,
  'Fitness Center': Dumbbell,
  'Elevator Access': MoveVertical,
};

export const PropertyAmenities = ({ amenities = [] }) => (
  <section className="rounded-card border border-line bg-surface p-5 shadow-card">
    <h2 className="text-[15px] font-semibold text-brand-700">Amenities</h2>

    <ul className="mt-5 grid grid-cols-2 gap-y-7 sm:grid-cols-4">
      {amenities.map((amenity) => {
        const Icon = AMENITY_ICONS[amenity] ?? CheckCircle2;

        return (
          <li key={amenity} className="flex flex-col items-center gap-2 px-2 text-center">
            <Icon className="size-5 text-brand-600" aria-hidden="true" />
            <span className="text-[12px] text-ink-soft">{amenity}</span>
          </li>
        );
      })}
    </ul>
  </section>
);

/**
 * Accessibility features.
 *
 * `accessFeatures` has been parsed off every property since the schema was
 * written and rendered nowhere — so a step-free entrance or a roll-in shower
 * was recorded by the admin and never reached the guest deciding whether they
 * could stay. Kept separate from amenities: a wet room is not a perk, it is
 * the thing that makes the booking possible or not.
 */
export const PropertyAccessibility = ({ features = [] }) => {
  if (!features.length) return null;

  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-card">
      <h2 className="inline-flex items-center gap-2 text-[15px] font-semibold text-brand-700">
        <Accessibility className="size-4" aria-hidden="true" />
        Accessibility
      </h2>
      <p className="mt-1 text-[12px] text-ink-muted">
        Recorded by our team on site. Message us if you need to check anything specific.
      </p>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {features.map((feature) => (
          <li key={feature} className="inline-flex items-start gap-2 text-[13px] text-ink-soft">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>
    </section>
  );
};
