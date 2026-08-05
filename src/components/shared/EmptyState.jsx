import { SearchX } from 'lucide-react';
import { cn } from '@/utils/classNames';

/** Shown when a filtered list returns nothing. */
export const EmptyState = ({
  icon,
  title = 'Nothing to show here',
  description,
  action,
  className,
}) => (
  <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
    <span className="flex size-14 items-center justify-center rounded-full bg-brand-50">
      {icon ?? <SearchX className="size-6 text-brand-600" aria-hidden="true" />}
    </span>
    <h3 className="mt-4 text-lg font-semibold">{title}</h3>
    {description && <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
