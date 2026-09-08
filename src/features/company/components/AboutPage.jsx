import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  CalendarRange,
  Clock,
  Handshake,
  HeartHandshake,
  Languages,
  Mail,
  MapPin,
  Newspaper,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
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
import { companyService } from '../services/companyService';
import { paths } from '@/routes/paths';

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
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-card" />
        ))}
      </div>
    );
  }

  return (
    <>
      <dl className="grid gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.id} className="rounded-card border border-line bg-surface p-4 text-center shadow-card">
            <dd className="font-display text-[26px] font-semibold text-ink">{stat.value}</dd>
            <dt className="mt-0.5 text-[11.5px] text-ink-muted">{stat.label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-2.5 text-center text-[11px] text-ink-muted">
        Counted from our live catalogue, not rounded up.
      </p>
    </>
  );
};

export const AboutPage = () => (
  <div className="mx-auto max-w-shell px-4 py-10 sm:px-6">
    {/* ------------------------------------------------------------- hero */}
    <header className="max-w-3xl">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand-700">About us</p>
      <h1 className="mt-1.5 font-display text-[30px] font-semibold leading-tight text-ink sm:text-[40px]">
        Everything between a night and a lease
      </h1>
      <p className="mt-3 font-serif text-[16px] leading-7 text-ink-soft sm:text-[17px]">
        Alotel Spaces manages apartments, serviced accommodation and commercial assets across the world’s most
        desirable destinations. Because we control that inventory end to end, we put every space to work exactly
        how it is needed — by the hour, by the night, or on flexible terms of weeks to months.
      </p>
    </header>

    <div className="mt-9">
      <StatStrip />
    </div>

    {/* ------------------------------------------------------------ story */}
    <Section id="story" eyebrow={STORY.eyebrow} title={STORY.heading} className="mt-14">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="max-w-2xl space-y-4">
          {STORY.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-[14px] leading-7 text-ink-soft">
              {paragraph}
            </p>
          ))}
        </div>

        <ul className="space-y-3 self-start">
          {VALUES.map((value) => (
            <li key={value.id} className="rounded-card border border-line bg-surface p-4 shadow-card">
              <p className="text-[13px] font-semibold text-ink">{value.title}</p>
              <p className="mt-1 text-[12.5px] leading-5 text-ink-soft">{value.body}</p>
            </li>
          ))}
        </ul>
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
      <Link
        to={paths.destinations}
        className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-800"
      >
        Read the destination guides
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </Section>

    {/* --------------------------------------------------------- partners */}
    <Section id="partners" eyebrow="Partners" title="Who we work with" lead={PARTNERS.lead} className="mt-14">
      <div className="grid gap-4 lg:grid-cols-2">
        {PARTNERS.offers.map((offer) => (
          <article key={offer.id} className="rounded-card border border-line bg-surface p-5 shadow-card">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <Handshake className="size-4" aria-hidden="true" />
            </span>
            <h3 className="mt-2.5 font-display text-[15px] font-semibold text-ink">{offer.title}</h3>
            <p className="mt-1.5 text-[13px] leading-6 text-ink-soft">{offer.body}</p>
          </article>
        ))}
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
      <div className="mt-8 rounded-card border border-line bg-brand-50/40 p-5">
        <h3 className="font-display text-[14px] font-semibold text-ink">
          Who handles payments, identity and signatures
        </h3>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {SERVICE_PROVIDERS.map((provider) => (
            <li key={provider.id} className="text-[12.5px] leading-5">
              <span className="font-semibold text-ink">{provider.name}</span>{' '}
              <span className="text-ink-soft">— {provider.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>

    {/* ---------------------------------------------------------- careers */}
    <Section id="careers" eyebrow="Careers" title="Building the team behind the standard" className="mt-14">
      <p className="max-w-2xl text-[14px] leading-7 text-ink-soft">{CAREERS.body}</p>

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
        <ul className="mt-6 space-y-3">
          {CAREERS.roles.map((role) => (
            <li key={role.id} className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-[15px] font-semibold text-ink">
                    {role.title}
                    <span className="text-ink-muted"> — {role.market}</span>
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3" aria-hidden="true" />
                      {role.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Languages className="size-3" aria-hidden="true" />
                      {role.language}
                    </span>
                  </p>
                </div>

                <a
                  href={`mailto:${CAREERS.applyEmail}?subject=${encodeURIComponent(
                    `${role.title} — ${role.market}`,
                  )}`}
                  className="shrink-0 rounded-full border border-line px-4 py-2 text-[12.5px] font-medium text-ink transition-colors hover:border-brand-400 hover:text-brand-700"
                >
                  Apply
                </a>
              </div>

              <p className="mt-2.5 max-w-3xl text-[13px] leading-6 text-ink-soft">{role.summary}</p>

              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                You&apos;ll need
              </p>
              <ul className="mt-1.5 space-y-1">
                {role.requirements.map((requirement) => (
                  <li key={requirement} className="flex gap-2 text-[12.5px] leading-5 text-ink-soft">
                    <span className="mt-[7px] size-1 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                    {requirement}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
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
);
