import { cn } from '@/utils/classNames';

/** Single KPI tile on the dashboard. */
export const StatCard = ({ label, value, icon: Icon, className }) => (
  <div className={cn('rounded-card border border-line bg-surface p-5 shadow-card', className)}>
    <div className="flex items-center justify-between gap-3">
      <p className="text-[12px] text-ink-soft">{label}</p>
      {Icon && (
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-50">
          <Icon className="size-4 text-brand-600" aria-hidden="true" />
        </span>
      )}
    </div>

    <p className="mt-3 font-display text-[26px] font-bold text-ink">{value}</p>
  </div>
);
