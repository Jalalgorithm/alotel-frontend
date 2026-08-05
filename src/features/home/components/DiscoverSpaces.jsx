import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { PropertyGrid, useFeaturedProperties } from '@/features/properties';
import { paths } from '@/routes/paths';

/** "Discover Your Perfect Space" — the featured residences grid. */
export const DiscoverSpaces = () => {
  const { data: properties = [], isLoading } = useFeaturedProperties(8);

  return (
    <section className="shell py-14 sm:py-16">
      <SectionHeading
        title="Discover Your Perfect Space"
        subtitle="Explore thoughtfully selected residences designed for comfort, style, and exceptional stays across our featured destinations."
      />

      <div className="mt-7">
        <PropertyGrid properties={properties} isLoading={isLoading} variant="discover" />
      </div>

      <div className="mt-8 flex justify-end">
        <Link
          to={paths.properties}
          className="inline-flex items-center gap-2 py-2 font-display text-[13px] font-semibold italic text-brand-700 hover:underline"
        >
          View all properties
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
};
