import { PropertyCard } from './PropertyCard';
import { PropertyCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/utils/classNames';

/**
 * Responsive property grid with built-in loading and empty states, so callers
 * never re-implement either.
 */
export const PropertyGrid = ({
  properties = [],
  isLoading = false,
  variant = 'listing',
  skeletonCount = 8,
  emptyTitle = 'No properties match your filters',
  emptyDescription = 'Try widening your dates, changing the destination, or clearing a filter.',
  emptyAction,
  className,
}) => {
  // `grid-cols-1` keeps the base track at minmax(0,1fr) so long titles can
  // truncate instead of widening the page.
  const gridClass = cn('grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4', className);

  if (isLoading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <PropertyCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!properties.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className={gridClass}>
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} variant={variant} />
      ))}
    </div>
  );
};
