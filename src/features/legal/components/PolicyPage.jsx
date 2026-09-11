import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { PolicyEmbed } from './PolicyEmbed';
import { POLICIES } from '../policies';
import { paths } from '@/routes/paths';
import { cn } from '@/utils/classNames';

/**
 * Shell shared by every legal page.
 *
 * All of them are the same thing — a title, a short plain-English line, the
 * embedded policy, and a way to reach the others — so they are one component
 * driven by the policy registry rather than four near-identical files.
 *
 * @param {{ policyId: keyof typeof POLICIES }} props
 */
export const PolicyPage = ({ policyId }) => {
  const policy = POLICIES[policyId];
  if (!policy) return null;

  return (
    <div>
      {/*
        A brand band, matching About and Support. These pages opened on a bare
        heading over the tinted canvas, which made the most sensitive documents
        on the site look like the least considered.
      */}
      <header className="bg-brand-900 py-11">
        <div className="shell">
          <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-brand-300">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Legal
          </p>
          <h1 className="mt-2 font-display text-[26px] font-semibold text-white sm:text-[34px]">{policy.title}</h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-white/75">{policy.summary}</p>

          {/* Sibling policies — people rarely want only one of these. */}
          <nav aria-label="Policies" className="scrollbar-none mt-6 flex gap-2 overflow-x-auto pb-1">
            {Object.values(POLICIES).map((entry) => (
              <Link
                key={entry.id}
                to={entry.path}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors',
                  entry.id === policy.id
                    ? 'border-white bg-white text-brand-900'
                    : 'border-white/25 text-white/75 hover:border-white/60 hover:text-white',
                )}
              >
                {entry.navLabel}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="shell py-10">
      {/*
        No card around the document any more. The policy now carries its own
        section cards and a pinned contents column, and wrapping that in a
        second panel produced boxes inside boxes.
      */}
      <div>
        <PolicyEmbed policyKey={policy.key} name={policy.title} />
      </div>

      <p className="mt-6 text-[12px] text-ink-muted">
        Questions about any of this? Email{' '}
        <a href="mailto:support@alotelspaces.com" className="text-brand-700 underline">
          support@alotelspaces.com
        </a>{' '}
        or visit <Link to={paths.support} className="text-brand-700 underline">support</Link>.
      </p>
      </div>
    </div>
  );
};
