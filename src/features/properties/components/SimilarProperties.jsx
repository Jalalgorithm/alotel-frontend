import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PropertyCard } from './PropertyCard';
import { PropertyCardSkeleton } from '@/components/ui/Skeleton';
import { useSimilarProperties } from '../hooks/useProperty';

/** Horizontally scrollable "Similar Properties" rail. */
export const SimilarProperties = ({ propertyId }) => {
  const { data: properties = [], isLoading } = useSimilarProperties(propertyId);
  const railRef = useRef(null);

  const scrollBy = (delta) =>
    railRef.current?.scrollBy({ left: delta * railRef.current.clientWidth * 0.8, behavior: 'smooth' });

  if (!isLoading && !properties.length) return null;

  const arrowClass =
    'flex size-8 items-center justify-center rounded-full border border-line bg-white text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-700';

  return (
    <section className="py-12">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-semibold text-brand-700">Similar Properties</h2>

        <div className="flex gap-2">
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Scroll left" className={arrowClass}>
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll right" className={arrowClass}>
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="scrollbar-none mt-5 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
      >
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="w-[264px] shrink-0">
                <PropertyCardSkeleton />
              </div>
            ))
          : properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                className="w-[264px] shrink-0 snap-start"
              />
            ))}
      </div>
    </section>
  );
};
