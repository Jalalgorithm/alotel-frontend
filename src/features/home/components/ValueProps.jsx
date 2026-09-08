import {
  Accessibility,
  ArrowRight,
  BadgeCheck,
  Clapperboard,
  ConciergeBell,
  Globe,
  Handshake,
  LayoutGrid,
  Mic,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { VALUE_PROPS } from '@/lib/homeContent';
import { CONTACT_CHANNELS } from '@/lib/companyContent';
import { LogoMark } from '@/components/shared/Logo';

import propertiesHero from '@/assets/images/properties-hero.jpg';
import authLogin from '@/assets/images/auth-login.jpg';
import authReset from '@/assets/images/auth-reset.jpg';
import authVerify from '@/assets/images/auth-verify.jpg';
import authSignup from '@/assets/images/auth-signup.jpg';
import londonImage from '@/assets/images/destinations/london.jpg';

/**
 * What Alotel Spaces offers, split by who it is for.
 *
 * The two halves are deliberately not the same design, because they are not
 * the same offer. The first six are what a traveller gets, and they are shown
 * as photographs — a claim about space is best made by showing one. The last
 * four sell studios, content production and studio licensing to a business
 * buyer, and they get a dark panel of their own.
 *
 * That split also solves an honesty problem. There is no photography of the
 * Cubicle, Studio or Debate Room anywhere — the spaces API returns no images
 * for them — so putting a picture beside "Podcast & content studios" would
 * have meant illustrating a recording booth with someone's living room. The
 * band carries the brand mark instead, which claims nothing.
 */

const ICONS = {
  LayoutGrid,
  BadgeCheck,
  Accessibility,
  ShieldCheck,
  ConciergeBell,
  Globe,
  Mic,
  Clapperboard,
  Handshake,
  Users,
};

/**
 * Which photograph argues which point. Kept here rather than in
 * `homeContent` because it is asset wiring, not copy: the writing is the
 * client's and should not have our import paths threaded through it.
 */
const PHOTO = {
  'spaces-not-rooms': authSignup,
  managed: authLogin,
  inclusive: propertiesHero,
  protection: authVerify,
  concierge: authReset,
  local: londonImage,
};

const [visitors, corporate] = VALUE_PROPS;

/**
 * Two layers, not one.
 *
 * A single bottom-weighted gradient left headings sitting at roughly 3:1 on
 * the brighter frames — a blown-out window behind a title swallowed it. The
 * flat wash underneath holds a floor under every image regardless of what is
 * in it, and the gradient does the work where the text actually is.
 */
const Scrim = () => (
  <>
    <span className="absolute inset-0 bg-black/20" aria-hidden="true" />
    <span
      className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent"
      aria-hidden="true"
    />
  </>
);

const Tile = ({ item, className, size = 'md' }) => {
  const Icon = ICONS[item.icon] ?? LayoutGrid;
  const isLead = size === 'lg';

  return (
    <article className={`group relative overflow-hidden rounded-card ${className}`}>
      {/* Decorative: the heading sits over the image and says the same thing. */}
      <img
        src={PHOTO[item.id]}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
      />
      <Scrim />

      <span className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full border border-white/25 bg-black/25 backdrop-blur">
        <Icon className="size-4 text-white" aria-hidden="true" />
      </span>

      <div className={`absolute inset-x-0 bottom-0 ${isLead ? 'p-6' : 'p-4'}`}>
        <h3
          className={`text-balance font-display font-semibold leading-tight text-white ${
            isLead ? 'text-[22px]' : 'text-[15px]'
          }`}
        >
          {item.title}
        </h3>
        <p
          className={`mt-1.5 text-white/85 ${
            isLead ? 'max-w-sm text-[13.5px] leading-6' : 'text-[12px] leading-5'
          }`}
        >
          {item.body}
        </p>
      </div>
    </article>
  );
};

export const ValueProps = () => (
  <section>
    {/* ------------------------------------------------------- visitors */}
    <div className="shell py-14 sm:py-16">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand-700">
        {visitors.audience}
      </h2>
      <p className="mt-1.5 font-display text-[24px] font-semibold text-ink sm:text-[26px]">
        Six reasons a stay holds up
      </p>

      {/*
        Six columns rather than four. The mosaic needs a 3/3 split on the first
        two rows and a 2/2/2 on the last, and four columns cannot express both
        without leaving a hole — which is exactly what the earlier layout did.
        Everything collapses to full width below `lg`.
      */}
      <div className="mt-6 grid auto-rows-[196px] gap-4 lg:grid-cols-6">
        <Tile item={visitors.items[0]} size="lg" className="col-span-6 row-span-2 lg:col-span-3" />
        <Tile item={visitors.items[1]} className="col-span-6 lg:col-span-3" />
        <Tile item={visitors.items[2]} className="col-span-6 lg:col-span-3" />
        <Tile item={visitors.items[3]} className="col-span-6 sm:col-span-3 lg:col-span-2" />
        <Tile item={visitors.items[4]} className="col-span-6 sm:col-span-3 lg:col-span-2" />
        <Tile item={visitors.items[5]} className="col-span-6 lg:col-span-2" />
      </div>
    </div>

    {/* ------------------------------------------------------ corporate */}
    <div className="relative overflow-hidden bg-brand-900 py-14 sm:py-16">
      {/* Surface without a subject — see the note at the top of this file. */}
      <LogoMark
        className="pointer-events-none absolute -right-20 -top-20 size-[420px] text-white/[0.035]"
      />

      <div className="shell relative">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand-300">
          {corporate.audience}
        </h2>
        <p className="mt-1.5 max-w-lg font-display text-[24px] font-semibold leading-tight text-white sm:text-[26px]">
          Studios, content and a franchise model
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {corporate.items.map((item, index) => {
            const Icon = ICONS[item.icon] ?? Users;

            return (
              <li key={item.id} className="rounded-card border border-white/10 bg-white/[0.05] p-5">
                <div className="flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand-400/15">
                    <Icon className="size-4 text-brand-200" aria-hidden="true" />
                  </span>
                  <span className="font-display text-[12px] font-bold tabular-nums text-white/25">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* `text-balance` keeps the longer titles from dropping a single
                    orphaned word onto a second line. */}
                <h3 className="mt-3 text-balance font-display text-[14.5px] font-semibold leading-snug text-white">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[12px] leading-5 text-white/65">{item.body}</p>
              </li>
            );
          })}
        </ul>

        <a
          href={`mailto:${CONTACT_CHANNELS[0].value}?subject=${encodeURIComponent(
            'Corporate services enquiry',
          )}`}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-brand-900 transition-colors hover:bg-brand-50"
        >
          Talk to our corporate team
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  </section>
);
