import { cn } from '@/utils/classNames';

/**
 * Section title + supporting line, matching the rhythm used across the designs
 * ("Featured Destinations", "Discover Your Perfect Space", "Our Properties").
 */
export const SectionHeading = ({ title, subtitle, align = 'left', size = 'lg', className, action }) => (
  <div
    className={cn(
      'flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between',
      align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
      className,
    )}
  >
    <div>
      <h2
        className={cn(
          'font-display font-semibold text-ink',
          size === 'lg' ? 'text-[26px] sm:text-[32px]' : 'text-xl sm:text-2xl',
        )}
      >
        {title}
      </h2>
      {subtitle && <p className="section-sub mt-2 max-w-2xl">{subtitle}</p>}
    </div>

    {action}
  </div>
);
