import { SearchX } from 'lucide-react';
import { cn } from '@/utils/classNames';

/**
 * Local empty state.
 *
 * The guest app has no shared `EmptyState` primitive (the admin one does), and
 * adding a global component for three call sites in one feature would be a
 * wider change than this needs.
 */
export const SpacesEmpty = ({ title, description, action, className }) => (
  <div className={cn('rounded-card border border-dashed border-line p-10 text-center', className)}>
    <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-50 text-brand-700">
      <SearchX className="size-5" aria-hidden="true" />
    </span>
    <p className="mt-3 font-display text-[15px] font-semibold text-ink">{title}</p>
    {description && <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-ink-soft">{description}</p>}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);
