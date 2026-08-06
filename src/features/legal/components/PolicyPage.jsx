import { Link } from 'react-router-dom';
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
    <div className="shell py-10">
      <header className="max-w-2xl">
        <h1 className="font-display text-[24px] font-bold text-brand-700 sm:text-[28px]">{policy.title}</h1>
        <p className="mt-2 text-[13px] leading-6 text-ink-soft">{policy.summary}</p>
      </header>

      {/* Sibling policies — people rarely want only one of these. */}
      <nav aria-label="Policies" className="scrollbar-none mt-6 flex gap-2 overflow-x-auto pb-1">
        {Object.values(POLICIES).map((entry) => (
          <Link
            key={entry.id}
            to={entry.path}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors',
              entry.id === policy.id
                ? 'border-brand-700 bg-brand-700 text-white'
                : 'border-line bg-white text-ink-soft hover:border-brand-300 hover:text-brand-700',
            )}
          >
            {entry.navLabel}
          </Link>
        ))}
      </nav>

      <div className="mt-8 rounded-card border border-line bg-surface p-5 shadow-card sm:p-7">
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
  );
};
