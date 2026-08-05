import { Star } from 'lucide-react';
import { cn } from '@/utils/classNames';

/**
 * Read-only star rating.
 *
 * @param {{ value?: number, max?: number, size?: string, className?: string }} props
 */
export const StarRating = ({ value = 5, max = 5, size = 'size-3.5', className }) => (
  <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} out of ${max} stars`}>
    {Array.from({ length: max }, (_, index) => (
      <Star
        key={index}
        aria-hidden="true"
        className={cn(size, index < Math.round(value) ? 'fill-gold text-gold' : 'text-black/15')}
      />
    ))}
  </span>
);
