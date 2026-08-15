import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CalendarCheck,
  CalendarX,
  CreditCard,
  KeyRound,
  Mail,
  MessageSquare,
  Presentation,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { Accordion } from '@/components/ui/Accordion';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/utils/classNames';
import { selectIsAuthenticated, useAuthStore } from '@/stores/authStore';
import { CONTACT_CHANNELS } from '@/lib/companyContent';
import { findTopic, searchFaqs, TOPICS } from '@/lib/supportContent';
import { DataRightsPanel } from './DataRightsPanel';
import { paths } from '@/routes/paths';

/**
 * Support.
 *
 * Search first, because someone arriving here has a specific question and the
 * fastest useful thing is filtering to it. Topics are a second route in for
 * people who would rather browse than name their problem.
 *
 * The answers describe how the product actually behaves — payment provider by
 * market, the six-month contract threshold, how deposits are held — rather than
 * generic help-centre filler. See `supportContent` for the caveat that comes
 * with that.
 */

const TOPIC_ICONS = {
  CalendarCheck,
  CreditCard,
  ShieldCheck,
  KeyRound,
  CalendarX,
  Presentation,
  Building2,
};

/**
 * The contact form.
 *
 * There is no `POST /support/contact/` endpoint. Rather than pretend a message
 * was sent — or quietly drop it — submitting explains plainly that direct
 * messaging is not live and offers the two routes that do work. Nothing is
 * discarded silently, because a support form that eats messages is worse than
 * no form at all.
 */
const ContactForm = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const [form, setForm] = useState({ name: '', email: '', topic: 'booking', message: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitted, setSubmitted] = useState(false);

  const set = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = (event) => {
    event.preventDefault();

    const found = {};
    if (!form.name.trim()) found.name = 'Tell us who you are.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) found.email = 'We need a valid email to reply to.';
    if (form.message.trim().length < 12) found.message = 'A little more detail will get you a better answer.';

    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitted(true);
  };

  const mailtoHref = `mailto:${CONTACT_CHANNELS[0].value}?subject=${encodeURIComponent(
    findTopic(form.topic)?.label ?? 'Support',
  )}&body=${encodeURIComponent(form.message)}`;

  if (isSubmitted) {
    return (
      <Alert
        variant="warn"
        title="Direct messaging is not live yet"
        facts={[{ label: 'Reply time', value: 'One working day' }]}
        actions={
          <>
            <Button href={mailtoHref} size="sm">
              Send this as an email
            </Button>
            {isAuthenticated && (
              <Button to={paths.dashboard} size="sm" variant="secondary">
                Message from a booking
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setSubmitted(false)}>
              Edit message
            </Button>
          </>
        }
      >
        We have not sent anything — your message is still in the form above, and we would rather say so than let you
        think it reached us. Use either route below and it goes to the same team.
      </Alert>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3.5 rounded-card border border-line bg-surface p-5 shadow-card">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Your name" value={form.name} onChange={set('name')} error={errors.name} />
        <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
      </div>

      <Select
        label="What is it about?"
        value={form.topic}
        onChange={set('topic')}
        options={TOPICS.map((topic) => ({ value: topic.id, label: topic.label }))}
      />

      <Textarea
        label="Your message"
        rows={4}
        value={form.message}
        onChange={set('message')}
        error={errors.message}
        placeholder="If it is about an existing stay, include the booking reference."
      />

      <Button type="submit" fullWidth>
        Send message
      </Button>
    </form>
  );
};

export const SupportPage = () => {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState(null);

  const results = useMemo(() => {
    const found = searchFaqs(query);
    return topic ? found.filter((faq) => faq.topic === topic) : found;
  }, [query, topic]);

  /* Grouped so a browsing reader sees structure, not one long undivided list. */
  const grouped = useMemo(() => {
    return TOPICS.map((entry) => ({
      ...entry,
      faqs: results.filter((faq) => faq.topic === entry.id),
    })).filter((group) => group.faqs.length);
  }, [results]);

  const isFiltered = Boolean(query.trim() || topic);

  return (
    <div className="mx-auto max-w-shell px-4 py-10 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand-700">Support</p>
        <h1 className="mt-1.5 font-display text-[28px] font-semibold text-ink sm:text-[36px]">
          How can we help?
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-ink-soft">
          Answers to what guests actually ask — bookings, payments, identity checks, and what happens when something
          goes wrong mid-stay.
        </p>

        <div className="relative mt-5">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search help — deposits, cancelling, check-in…"
            aria-label="Search help topics"
            className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-[14px] text-ink shadow-card focus:border-brand-600 focus:outline-none"
          />
        </div>
      </header>

      {/* ----------------------------------------------------------- topics */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TOPICS.map((entry) => {
          const Icon = TOPIC_ICONS[entry.icon] ?? CalendarCheck;
          const isActive = topic === entry.id;

          return (
            <button
              key={entry.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setTopic(isActive ? null : entry.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12.5px] transition-colors',
                isActive
                  ? 'border-brand-700 bg-brand-700 font-medium text-white'
                  : 'border-line bg-surface text-ink-soft hover:border-brand-300 hover:text-brand-700',
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {entry.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* -------------------------------------------------------- answers */}
        <div className="min-w-0">
          {isFiltered && (
            <p className="mb-3 text-[12.5px] text-ink-muted">
              {results.length} answer{results.length === 1 ? '' : 's'}
              {topic && ` in ${findTopic(topic)?.label}`}
              {query.trim() && ` matching “${query.trim()}”`}
              {isFiltered && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setTopic(null);
                  }}
                  className="ml-2 font-medium text-brand-700 hover:underline"
                >
                  Clear
                </button>
              )}
            </p>
          )}

          {grouped.length ? (
            <div className="space-y-7">
              {grouped.map((group) => (
                <section key={group.id} id={group.id} className="scroll-mt-24">
                  <h2 className="font-display text-[16px] font-semibold text-ink">{group.label}</h2>
                  <Accordion
                    className="mt-2"
                    /* Accordion reads `question` / `answer`, which is already
                       the shape the FAQ content uses — passed straight through. */
                    items={group.faqs}
                  />
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-card border border-dashed border-line p-10 text-center">
              <p className="font-display text-[15px] font-semibold text-ink">Nothing matches that</p>
              <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-ink-soft">
                Try a different word, or ask us directly using the form.
              </p>
            </div>
          )}

          {/* Sits with the policies: same place a reader goes when they are
              thinking about what we hold and what they agreed to. */}
          <DataRightsPanel className="mt-10" />

          {/* ------------------------------------------------------ policies */}
          <section className="mt-10 rounded-card border border-line bg-surface p-5">
            <h2 className="font-display text-[15px] font-semibold text-ink">Policies</h2>
            <p className="mt-1 text-[12.5px] text-ink-soft">
              The full legal terms, kept current and jurisdiction-aware.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: 'Privacy policy', to: paths.privacy },
                { label: 'Terms of service', to: paths.terms },
                { label: 'Cookie policy', to: paths.cookies },
                { label: 'Disclaimer', to: paths.disclaimer },
              ].map((policy) => (
                <Link
                  key={policy.to}
                  to={policy.to}
                  className="rounded-full border border-line px-3.5 py-1.5 text-[12.5px] text-ink-soft transition-colors hover:border-brand-400 hover:text-brand-700"
                >
                  {policy.label}
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* -------------------------------------------------------- contact */}
        <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
          <div className="rounded-card border border-line bg-surface p-4 shadow-card">
            <h2 className="font-display text-[15px] font-semibold text-ink">Reach a person</h2>
            <ul className="mt-3 space-y-3">
              {CONTACT_CHANNELS.map((channel) => (
                <li key={channel.id} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                    {channel.id === 'email' ? (
                      <Mail className="size-3.5" aria-hidden="true" />
                    ) : (
                      <MessageSquare className="size-3.5" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-ink-muted">
                      {channel.label}
                    </p>
                    <p className="mt-0.5 text-[12.5px] font-medium text-ink">{channel.value}</p>
                    <p className="text-[11px] text-ink-muted">{channel.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <ContactForm />
        </aside>
      </div>
    </div>
  );
};
