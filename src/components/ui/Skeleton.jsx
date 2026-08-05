import { cn } from '@/utils/classNames';

/** Shimmer placeholder used while queries resolve. */
export const Skeleton = ({ className, ...props }) => (
  <div
    aria-hidden="true"
    className={cn('animate-pulse rounded-lg bg-black/[0.07]', className)}
    {...props}
  />
);

/** Matches the footprint of `PropertyCard` so grids never jump on load. */
export const PropertyCardSkeleton = () => (
  <div className="overflow-hidden rounded-card border border-line bg-surface">
    <Skeleton className="aspect-4/3 rounded-none" />
    <div className="space-y-3 p-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-9 w-full" />
    </div>
  </div>
);
