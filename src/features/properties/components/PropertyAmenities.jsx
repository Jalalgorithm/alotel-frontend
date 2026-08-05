import {
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
