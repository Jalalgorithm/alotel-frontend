import { ArrowRight, Headset, ShieldCheck, UserCheck } from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { Button } from '@/components/ui/Button';
import { paths } from '@/routes/paths';
import BANNER_IMAGE from '@/assets/images/luxury-banner.jpg';


const ASSURANCES = [
  { label: 'Secure & Compliant', Icon: ShieldCheck },
  { label: 'KYC Verified', Icon: UserCheck },
  { label: '24/7 Support', Icon: Headset },
];

/** Full-bleed CTA band: "Where Luxury Meets Every Journey." */
export const LuxuryBanner = () => (
  <section className="relative">
    <Image src={BANNER_IMAGE} alt="" wrapperClassName="absolute inset-0 size-full" />
    <div className="absolute inset-0 bg-black/55" aria-hidden="true" />

    <div className="shell relative py-20 text-center sm:py-24">
      <h2 className="mx-auto max-w-3xl font-display text-[28px] font-bold leading-tight text-white sm:text-[40px]">
        Where Luxury Meets Every Journey.
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-[13px] leading-6 text-white/85 sm:text-sm">
        Discover handpicked luxury homes designed for business trips, extended stays, and unforgettable
        escapes.
      </p>

      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button to={paths.properties} italic size="lg" rightIcon={<ArrowRight className="size-4" />}>
          Book Your Stay
        </Button>
        <Button
          to={paths.destinations}
          variant="secondary"
          italic
          size="lg"
          rightIcon={<ArrowRight className="size-4" />}
        >
          Explore Destinations
        </Button>
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-[12px] text-white/70">
        Premium residences across the UK, Spain, USA, UAE, and Nigeria — professionally managed for
        exceptional comfort, security, and seamless stays.
      </p>

      <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {ASSURANCES.map(({ label, Icon }) => (
          <li key={label} className="inline-flex items-center gap-2 text-[12px] text-white/85">
            <span className="flex size-6 items-center justify-center rounded-full bg-white/15">
              <Icon className="size-3" aria-hidden="true" />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  </section>
);
