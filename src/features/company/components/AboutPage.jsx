import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Briefcase, Handshake, Newspaper, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/utils/format';
import { COMPLIANCE, CONTACT_CHANNELS, PARTNERS, PRESS, ROLES, STORY, VALUES } from '@/lib/companyContent';
import { companyService } from '../services/companyService';
import { paths } from '@/routes/paths';

/**
 * About Alotel Spaces.
 *
 * One page rather than four thin ones, with anchored sections the footer links
 * into directly — Our Story, Compliance Hub, Careers, Press and Partners all
 * pointed here already, and each had too little to justify a route of its own.
 *
 * The numbers are counted live. The previous trust strip claimed "100K+
 * verified guests"; that figure was invented, and a company page is where an
 * invented figure stops being decoration and becomes a claim.
 */

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
        We run the buildings we list
      </h1>
      <p className="mt-3 font-serif text-[16px] leading-7 text-ink-soft sm:text-[17px]">
        Alotel Spaces is a serviced-residence operator across five markets. We do not aggregate other people’s
        listings — we inspect, verify, contract and service every stay ourselves, which is the only way the
        promises on this page could be kept.
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

    {/* ------------------------------------------------------- compliance */}
    <Section
      id="compliance"
      eyebrow="Compliance hub"
      title="How a stay is actually protected"
      lead="Most of what separates us from a listings site is invisible until something goes wrong. Here is what runs behind every booking."
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
      title="Five markets, known properly"
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

    {/* ---------------------------------------------------------- careers */}
    <Section
      id="careers"
      eyebrow="Careers"
      title="Open roles"
      lead="Small team, five cities, and a strong preference for people who have run buildings rather than only written about them."
      className="mt-14"
    >
      <ul className="space-y-2.5">
        {ROLES.map((role) => (
          <li
            key={role.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
          >
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 font-display text-[14.5px] font-semibold text-ink">
                <Briefcase className="size-3.5 text-brand-600" aria-hidden="true" />
                {role.title}
              </p>
              <p className="mt-1 text-[12.5px] text-ink-soft">{role.summary}</p>
              <p className="mt-1.5 text-[11px] text-ink-muted">
                {role.team} · {role.location} · {role.type}
              </p>
            </div>

            <a
              href={`mailto:${CONTACT_CHANNELS[0].value}?subject=${encodeURIComponent(role.title)}`}
              className="shrink-0 rounded-full border border-line px-4 py-2 text-[12.5px] font-medium text-ink transition-colors hover:border-brand-400 hover:text-brand-700"
            >
              Apply
            </a>
          </li>
        ))}
      </ul>
    </Section>

    {/* ------------------------------------------------------------ press */}
    <Section id="press" eyebrow="Press" title="What has been written about us" className="mt-14">
      <ul className="grid gap-3 md:grid-cols-3">
        {PRESS.map((item) => (
          <li key={item.id} className="rounded-card border border-line bg-surface p-4 shadow-card">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-brand-700">
              <Newspaper className="size-3" aria-hidden="true" />
              {item.outlet}
            </p>
            <p className="mt-1.5 font-display text-[14px] font-semibold leading-5 text-ink">{item.title}</p>
            <p className="mt-1.5 text-[11px] text-ink-muted">{formatDate(item.date)}</p>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[12px] text-ink-soft">
        Press enquiries:{' '}
        <a href={`mailto:${CONTACT_CHANNELS[0].value}`} className="font-medium text-brand-700 hover:underline">
          {CONTACT_CHANNELS[0].value}
        </a>
      </p>
    </Section>

    {/* --------------------------------------------------------- partners */}
    <Section
      id="partners"
      eyebrow="Partners"
      title="Who we work with"
      lead="The companies handling money, identity and signatures on your behalf. Named, because you are trusting them too."
      className="mt-14"
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PARTNERS.map((partner) => (
          <li key={partner.id} className="flex items-start gap-2.5 rounded-card border border-line bg-surface p-4">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <Handshake className="size-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink">{partner.name}</p>
              <p className="mt-0.5 text-[12px] leading-5 text-ink-soft">{partner.role}</p>
            </div>
          </li>
        ))}
      </ul>
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
