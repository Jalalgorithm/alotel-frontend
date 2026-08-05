import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/classNames';

const SIZES = { sm: 'size-4', md: 'size-6', lg: 'size-9' };

export const Spinner = ({ size = 'md', className, label = 'Loading' }) => (
  <Loader2
    role="status"
    aria-label={label}
    className={cn('animate-spin text-brand-600', SIZES[size] ?? SIZES.md, className)}
  />
);
