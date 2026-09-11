import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  CalendarRange,
  Clock,
  HeartHandshake,
  Languages,
  Mail,
  Mic,
  Plus,
  MapPin,
  Newspaper,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { ProviderLogo } from '@/components/ui/ProviderLogo';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  CAREERS,
  COMPLIANCE,
  CONTACT_CHANNELS,
  OFFERING,
  OFFICES,
  PARTNERS,
  PRESS,
  SERVICE_PROVIDERS,
  STAY_PROTECTION,
  STORY,
  VALUES,
} from '@/lib/companyContent';
import { DESTINATIONS } from '@/lib/destinationContent';
import { companyService } from '../services/companyService';
import { paths } from '@/routes/paths';

import heroImage from '@/assets/images/auth-signup.jpg';
import storyImage from '@/assets/images/auth-reset.jpg';

/**
 * About Alotel Spaces.
 *
 * One page rather than four thin ones, with anchored sections the footer links
 * into directly — Our Story, Compliance Hub, Careers, Press and Partners all
 * pointed here already, and each had too little to justify a route of its own.
 *
 * The numbers are counted live. An earlier trust strip claimed "100K+ verified
 * guests"; that figure was invented, and a company page is where an invented
 * figure stops being decoration and becomes a claim.
 */

const DURATION_ICONS = {
  hour: Clock,
  night: Building2,
  month: CalendarRange,
  ongoing: Sparkles,
};

const Section = ({ id, eyebrow, title, lead, children, className = '' }) => (
  <section id={id} className={`scroll-mt-24 ${className}`}>
    {eyebrow && (
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand-700">{eyebrow}</p>
    )}
    <h2 className="mt-1.5 font-display text-[22px] font-semibold text-ink sm:text-[26px]">{title}</h2>
    {lead && <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-ink-soft">{lead}</p>}
    <div className="mt-6">{children}</div>
  </section>
);

const StatStrip = () => {
  const { data: stats = [], isLoading } = useQuery({
    queryKey: ['company', 'stats'],
    queryFn: companyService.stats,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="relative z-10 mx-auto -mt-10 max-w-shell px-4 sm:px-6">
        <Skeleton className="h-[104px] rounded-card" />
      </div>
    );
  }

  /*
   * Nothing to count, nothing to show.
   *
   * These figures come from the live catalogue, so an unreachable API leaves
   * `stats` empty — and the panel then rendered as a blank white slab sitting
   * over the hero with a caption underneath promising numbers that were not
   * there. Dropping the whole block is the honest failure: the hero simply
   * runs into the next section, which looks deliberate.
   */
  if (!stats.length) return null;

  return (
    <div className="relative z-10 mx-auto -mt-10 max-w-shell px-4 sm:px-6">
      {/* One panel rather than four cards. It sits half over the hero image,
          and four separate cards floating on a photograph read as debris. */}
      <dl className="grid gap-4 rounded-card border border-line bg-surface p-5 shadow-raised sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.id} className="text-center">
            <dd className="font-display text-[28px] font-semibold text-ink">{stat.value}</dd>
            <dt className="mt-0.5 text-[11.5px] text-ink-muted">{stat.label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-2.5 text-center text-[11px] text-ink-muted">
        Counted from our live catalogue, not rounded up.
      </p>
    </div>
  );
};

/**
 * Open roles, grouped by the kind of work rather than listed flat.
 *
 * Five of the seven share one title — Social Media & Branding Manager — so the
 * market is what actually distinguishes a row, and it leads. A flat list read
 * as the same job printed five times.
 */
const ROLE_FAMILIES = [
  { id: 'brand', label: 'Brand & marketing', match: (role) => role.title.startsWith('Social Media') },
  { id: 'sales', label: 'Sales', match: (role) => role.title.startsWith('Sales') },
  { id: 'content', label: 'Content', match: (role) => role.title.startsWith('Podcast') },
];

const RoleRow = ({ role }) => (
  <details className="group border-b border-line last:border-b-0">
    <summary className="flex cursor-pointer list-none items-center gap-4 p-4 transition-colors hover:bg-brand-50/40">
      <span className="w-[128px] shrink-0 text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-brand-700">
        {role.market}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[14.5px] font-semibold text-ink">{role.title}</span>
        <span className="mt-0.5 block text-[11.5px] text-ink-muted">{role.location}</span>
      </span>

      {/*
        The right half of these rows was empty at desktop width. Language is
        the other thing a candidate screens on before reading a word of the
        description, so it earns the space. It truncates rather than wraps —
        the full requirement is two lines down, inside the panel.
      */}
      <span className="hidden shrink-0 items-center gap-1.5 text-[11.5px] text-ink-muted lg:inline-flex lg:max-w-[280px]">
        <Languages className="size-3 shrink-0" aria-hidden="true" />
        <span className="truncate">{role.language}</span>
      </span>

      <span className="ml-2 hidden shrink-0 rounded-full border border-line px-3.5 py-1.5 text-[12px] font-medium text-ink transition-colors group-hover:border-brand-400 group-hover:text-brand-700 sm:inline-block">
        Details
      </span>

      <Plus
        className="size-4 shrink-0 text-ink-muted transition-transform group-open:rotate-45"
        aria-hidden="true"
      />
    </summary>

    <div className="px-4 pb-5 sm:pl-[160px]">
      <p className="max-w-2xl text-[13px] leading-6 text-ink-soft">{role.summary}</p>
      {/* Shown in full here; the row above truncates it. */}
      <p className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] text-ink-muted lg:hidden">
        <Languages className="size-3" aria-hidden="true" />
        {role.language}
      </p>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">You&apos;ll need</p>
      <ul className="mt-1.5 space-y-1">
        {role.requirements.map((requirement) => (
          <li key={requirement} className="flex gap-2 text-[12.5px] leading-5 text-ink-soft">
            <span className="mt-[7px] size-1 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
            {requirement}
          </li>
        ))}
      </ul>
      <a
        href={`mailto:${CAREERS.applyEmail}?subject=${encodeURIComponent(`${role.title} — ${role.market}`)}`}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-brand-800"
      >
        Apply for this role
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </a>
    </div>
  </details>
);

/**
 * The providers, drifting.
 *
 * The list is rendered twice and the track travels exactly half its own width,
 * so the second copy arrives where the first began and the loop has no seam.
 * The duplicate is `aria-hidden` and is dropped entirely under reduced motion,
 * where the strip becomes a normal horizontal scroller — see `.marquee` in the
 * stylesheet.
 */
const ProviderMarquee = () => (
  /*
    Each provider is a bordered card, not loose text on a rail.
    A card sliced by the edge of the strip reads as "there is more" — the
    ordinary carousel convention. Loose text sliced the same way produced
    "utterwave" and half a sentence, which read as a rendering fault.
  */
  <div className="marquee relative overflow-hidden py-1">
    <span
      className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-canvas to-transparent sm:w-20"
      aria-hidden="true"
    />
    <span
      className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-canvas to-transparent sm:w-20"
      aria-hidden="true"
    />

    <div className="marquee-track">
      {[0, 1].map((copy) => (
        <ul
          key={copy}
          className="flex shrink-0 gap-3 pr-3"
          aria-hidden={copy === 1 || undefined}
          {...(copy === 1 ? { 'data-marquee-clone': '' } : {})}
        >
          {SERVICE_PROVIDERS.map((provider) => (
            <li
              key={provider.id}
              className="flex w-[290px] shrink-0 items-center gap-3.5 rounded-card border border-line bg-surface p-4 shadow-card sm:w-[310px]"
            >
              <ProviderLogo provider={provider.id} className="size-10 shrink-0" />
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-ink">{provider.name}</p>
                <p className="mt-0.5 text-[11.5px] leading-4 text-ink-soft">{provider.role}</p>
              </div>
            </li>
          ))}
        </ul>
      ))}
    </div>
  </div>
);

export const AboutPage = () => (
  <div>
    {/* ------------------------------------------------------------- hero */}
    {/*
      Full-bleed, so it escapes the page shell. The page opened on bare text
      before and read as a memo; a company page about spaces should show one.
      Two scrim layers rather than one — the single bottom-weighted gradient
      left the lead paragraph at roughly 2.5:1 against a bright interior.
    */}
    <header className="relative h-[380px] overflow-hidden sm:h-[420px]">
      <img src={heroImage} alt="" className="absolute inset-0 size-full object-cover" />
      <span className="absolute inset-0 bg-black/35" aria-hidden="true" />
      <span
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/25"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex h-full max-w-shell flex-col justify-end px-4 pb-16 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand-200">About us</p>
          <h1 className="mt-2 font-display text-[34px] font-semibold leading-tight text-white sm:text-[46px]">
            Everything between a night and a lease
          </h1>
          <p className="mt-3 font-serif text-[15.5px] leading-7 text-white/90 sm:text-[17px]">
            Alotel Spaces manages apartments, serviced accommodation and commercial assets across the world’s
            most desirable destinations. Because we control that inventory end to end, we put every space to work
            exactly how it is needed — by the hour, by the night, or on flexible terms of weeks to months.
          </p>
        </div>
      </div>
    </header>

    <StatStrip />

    <div className="mx-auto max-w-shell px-4 pb-10 sm:px-6">
      {/* ------------------------------------------------------------ story */}
      <Section id="story" eyebrow={STORY.eyebrow} title={STORY.heading} className="mt-14">
        {/*
          The photograph is on the left and pinned. Previously the prose sat in
          a wide column with the values stacked beside it, which left roughly
          half the section empty below two paragraphs.
        */}
        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          {/* No caption: the section heading says the same words two inches
              above it, and printing them twice looked like a mistake. */}
          <div className="relative min-h-[300px] overflow-hidden rounded-card lg:sticky lg:top-24 lg:self-start">
            <img src={storyImage} alt="" className="absolute inset-0 size-full object-cover" />
          </div>

          <div>
            <div className="max-w-2xl space-y-4">
              {STORY.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="text-[14.5px] leading-7 text-ink-soft">
                  {paragraph}
                </p>
              ))}
            </div>

            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {VALUES.map((value) => (
                <li key={value.id} className="rounded-card border border-line bg-surface p-4 shadow-card">
                  <p className="text-[13px] font-semibold text-ink">{value.title}</p>
                  <p className="mt-1 text-[12.5px] leading-5 text-ink-soft">{value.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

    {/* --------------------------------------------------------- offering */}
    <Section id="offering" eyebrow="Our offering" title="However long you need it" lead={OFFERING.lead} className="mt-14">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {OFFERING.groups.map((group) => {
          const Icon = DURATION_ICONS[group.id] ?? Clock;

          return (
            <article
              key={group.id}
              className="flex flex-col rounded-card border border-line bg-surface p-4 shadow-card"
            >
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-brand-700">
                <Icon className="size-3.5" aria-hidden="true" />
                {group.duration}
              </p>

              <ul className="mt-3 flex-1 space-y-3.5">
                {group.items.map((item) => (
                  <li key={item.title}>
                    <p className="font-display text-[13.5px] font-semibold text-ink">{item.title}</p>
                    <p className="mt-1 text-[12.5px] leading-5 text-ink-soft">{item.body}</p>
                    {/* A condition on availability, kept visible rather than
                        folded into the sentence above it. */}
                    {item.note && <p className="mt-1 text-[11.5px] text-ink-muted">{item.note}</p>}
                  </li>
                ))}
              </ul>

              {group.id === 'ongoing' && (
                <Link
                  to={`${paths.support}#stay`}
                  className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-700 hover:underline"
                >
                  See the full offering
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </Section>

    {/* -------------------------------------------------- stay protection */}
    <Section
      id="compliance"
      eyebrow="Stay protection"
      title={STAY_PROTECTION.heading}
      lead={STAY_PROTECTION.body}
      className="mt-14"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {COMPLIANCE.map((item) => (
          <article key={item.id} className="rounded-card border border-line bg-surface p-4 shadow-card">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <h3 className="mt-2.5 font-display text-[14.5px] font-semibold text-ink">{item.title}</h3>
            <p className="mt-1.5 text-[12.5px] leading-5 text-ink-soft">{item.body}</p>
          </article>
        ))}
      </div>
    </Section>

    {/* --------------------------------------------------------- where we */}
    <Section
      id="markets"
      eyebrow="Where we operate"
      title="Cities we know properly"
      lead="Each city has a guide written by people who have stayed there — neighbourhoods, practicalities and the honest trade-offs."
      className="mt-14"
    >
      {/*
        The eight cities, not a lone button. A section headed "where we
        operate" that showed nothing but a link asked the reader to take our
        word for it and click; the tiles answer the question in place.
      */}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DESTINATIONS.map((destination) => (
          <li key={destination.slug}>
            <Link
              to={paths.destinationDetail(destination.slug)}
              className="group relative block h-[200px] overflow-hidden rounded-card"
            >
              {/* Malaga has no photograph yet; `Image` paints a branded
                  gradient rather than leaving a hole. */}
              <Image
                src={destination.image}
                alt=""
                wrapperClassName="absolute inset-0 size-full"
                className="transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-black/25" aria-hidden="true" />
              <span
                className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/45 to-transparent"
                aria-hidden="true"
              />

              <span className="absolute inset-x-0 bottom-0 p-4">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] text-white/70">
                  <MapPin className="size-3" aria-hidden="true" />
                  {destination.country}
                </span>
                <span className="mt-0.5 block font-display text-[16px] font-semibold text-white">
                  {destination.city}
                </span>
                <span className="mt-1 block text-[11.5px] italic leading-4 text-white/75">
                  {destination.tagline}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        to={paths.destinations}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-800"
      >
        Read the destination guides
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </Section>

    {/* --------------------------------------------------------- partners */}
    <Section id="partners" eyebrow="Partners" title="Who we work with" lead={PARTNERS.lead} className="mt-14">
      <div className="grid gap-4 lg:grid-cols-2">
        {PARTNERS.offers.map((offer) => {
          /* Both cards carried the same handshake, which said nothing about
             either offer. A studio is a studio; a vacant floor is a building. */
          const OfferIcon = offer.id === 'studio-licensing' ? Mic : Building2;

          return (
          <article key={offer.id} className="rounded-card border border-line bg-surface p-5 shadow-card">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <OfferIcon className="size-4" aria-hidden="true" />
            </span>
            <h3 className="mt-2.5 font-display text-[15px] font-semibold text-ink">{offer.title}</h3>
            <p className="mt-1.5 text-[13px] leading-6 text-ink-soft">{offer.body}</p>
          </article>
          );
        })}
      </div>

      <a
        href={`mailto:${CONTACT_CHANNELS[0].value}?subject=${encodeURIComponent('Partnering with Alotel Spaces')}`}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-800"
      >
        Interested in partnering? Get in touch
        <ArrowRight className="size-4" aria-hidden="true" />
      </a>

      {/*
        Separated from the partner network above on purpose: these are the third
        parties a guest's card details and identity documents actually pass
        through, which is a disclosure rather than a logo wall.
      */}
      <div className="mt-9">
        <h3 className="font-display text-[15px] font-semibold text-ink">
          Who handles payments, identity and signatures
        </h3>
        <p className="mt-1 max-w-2xl text-[12.5px] leading-5 text-ink-soft">
          The third parties your card details and identity documents actually pass through. Named, because you are
          trusting them too.
        </p>
        <div className="mt-4">
          <ProviderMarquee />
        </div>
      </div>
    </Section>

    {/* ---------------------------------------------------------- careers */}
    <Section id="careers" eyebrow="Careers" title="Building the team behind the standard" className="mt-14">
      {/*
        `CAREERS.body` opens "We're building the team behind the standard",
        which is the section heading verbatim. Dropping that first sentence
        leaves the part that actually says something.
      */}
      <p className="max-w-2xl text-[14px] leading-7 text-ink-soft">
        {CAREERS.body.replace(/^We're building the team behind the standard\.\s*/, '')}
      </p>

      {/*
        The equal-opportunity statement sits above the roles, not in small
        print beneath them. It names concrete accommodations — any application
        format, an adapted process — which a candidate needs before deciding
        whether to apply, not after.
      */}
      <div className="mt-5 flex max-w-3xl gap-3 rounded-card border border-brand-200 bg-brand-50/50 p-4">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700">
          <HeartHandshake className="size-3.5" aria-hidden="true" />
        </span>
        <p className="text-[12.5px] leading-6 text-ink-soft">{CAREERS.equalOpportunity}</p>
      </div>

      {CAREERS.roles.length > 0 ? (
        /*
          Grouped and collapsed. Seven fully expanded cards ran longer than
          every other section on the page combined, and the summary a reader
          needs to decide whether to open one is three lines, not fifteen.
        */
        <div className="mt-6 space-y-6">
          {ROLE_FAMILIES.map((family) => {
            const roles = CAREERS.roles.filter(family.match);
            if (!roles.length) return null;

            return (
              <div key={family.id}>
                <div className="mb-2 flex items-center gap-3">
                  <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.07em] text-brand-700">
                    {family.label}
                  </p>
                  <span className="h-px flex-1 bg-line" aria-hidden="true" />
                  <span className="shrink-0 text-[11px] text-ink-muted">
                    {roles.length} open
                  </span>
                </div>

                <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
                  {roles.map((role) => (
                    <RoleRow key={role.id} role={role} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <a
          href={`mailto:${CAREERS.applyEmail}?subject=${encodeURIComponent('Working at Alotel Spaces')}`}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:border-brand-400 hover:text-brand-700"
        >
          Send us your CV
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      )}
    </Section>

    {/* ------------------------------------------------------------ press */}
    <Section id="press" eyebrow="Press" title="Media enquiries" className="mt-14">
      <div className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
          <Newspaper className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] leading-6 text-ink-soft">{PRESS.body}</p>
          <a
            href={`mailto:${PRESS.email}`}
            className="mt-1 inline-block text-[13.5px] font-semibold text-brand-700 hover:underline"
          >
            {PRESS.email}
          </a>
        </div>
      </div>
    </Section>

    {/* ---------------------------------------------------------- contact */}
    <Section id="contact" eyebrow="Contact" title="Talk to us" className="mt-14">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <ul className="space-y-2.5">
          {CONTACT_CHANNELS.map((channel) => (
            <li
              key={channel.id}
              className="flex items-start gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
            >
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                {channel.id === 'phone' ? (
                  <Phone className="size-3.5" aria-hidden="true" />
                ) : (
                  <Mail className="size-3.5" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                  {channel.label}
                </p>
                <a href={channel.href} className="text-[13.5px] font-semibold text-brand-700 hover:underline">
                  {channel.value}
                </a>
                <p className="mt-0.5 text-[12px] text-ink-soft">{channel.note}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="rounded-card border border-line bg-surface p-5 shadow-card">
          <h3 className="font-display text-[14px] font-semibold text-ink">EMEA offices</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {OFFICES.map((office) => (
              <address key={office.id} className="not-italic">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                  <MapPin className="size-3" aria-hidden="true" />
                  {office.region}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-5 text-ink-soft">
                  {office.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              </address>
            ))}
          </div>
        </div>
      </div>
    </Section>

    {/* -------------------------------------------------------------- cta */}
    <div className="mt-14 rounded-card border border-line bg-brand-50/60 p-7 text-center">
      <h2 className="font-display text-[20px] font-semibold text-ink">Something we have not answered?</h2>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] text-ink-soft">
        The support pages cover bookings, payments, identity checks and listing with us.
      </p>
      <Link
        to={paths.support}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-700 px-6 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-800"
      >
        Go to support
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
      </div>
    </div>
  </div>
);
