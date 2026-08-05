import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BadgeCheck, CreditCard, Headset } from 'lucide-react';
import { SearchBar } from '@/components/shared/SearchBar';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Image } from '@/components/ui/Image';
import { PropertyGrid } from './PropertyGrid';
import { PropertyFilters } from './PropertyFilters';
import { Pagination } from './Pagination';
import { useProperties } from '../hooks/useProperties';
import { propertyAssurances } from '@/lib/mock/data';
import HERO_IMAGE from '@/assets/images/properties-hero.jpg';


const ASSURANCE_ICONS = {
  'badge-check': BadgeCheck,
  'credit-card': CreditCard,
  headset: Headset,
};

const PAGE_SIZE = 8;

/** "Discover Exceptional Properties" — the catalogue route. */
export const PropertiesPage = () => {
  const [searchParams] = useSearchParams();
  const [type, setType] = useState('All');
  const [page, setPage] = useState(1);
  const [layout, setLayout] = useState('grid');

  const { data, isLoading } = useProperties({
    type,
    page,
    pageSize: PAGE_SIZE,
    query: searchParams.get('where') ?? undefined,
    guests: searchParams.get('guests') ?? undefined,
  });

  const handleTypeChange = (nextType) => {
    setType(nextType);
    setPage(1); // A new filter always restarts pagination.
  };

  return (
    <>
      {/* Hero + search */}
      <section className="relative">
        <Image src={HERO_IMAGE} alt="" wrapperClassName="absolute inset-0 size-full" />
        <div className="absolute inset-0 hero-scrim" aria-hidden="true" />

        <div className="shell relative py-16 sm:py-20">
          <h1 className="max-w-2xl font-display text-[30px] font-bold leading-tight text-white sm:text-[38px]">
            Discover Exceptional Properties
          </h1>
          <p className="mt-2 max-w-xl text-[13px] text-white/85 sm:text-sm">
            Handpicked luxury homes and residences in the world&apos;s most desirable destinations
          </p>

          <SearchBar className="mt-8 max-w-5xl" defaultValues={{ where: searchParams.get('where') ?? '' }} />
        </div>
      </section>

      {/* Assurances */}
      <section className="shell grid gap-4 pt-10 sm:grid-cols-3">
        {propertyAssurances.map((assurance) => {
          const Icon = ASSURANCE_ICONS[assurance.icon] ?? BadgeCheck;

          return (
            <div
              key={assurance.id}
              className="rounded-card border border-line bg-surface px-5 py-6 text-center shadow-card"
            >
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand-50">
                <Icon className="size-4 text-brand-600" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-[15px] font-semibold">{assurance.title}</h3>
              <p className="mx-auto mt-1.5 max-w-[24ch] text-[12px] leading-5 text-ink-soft">
                {assurance.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* Catalogue */}
      <section className="shell py-12 sm:py-16">
        <SectionHeading title="Our Properties" subtitle="Quality homes curated for comfort, convenience, and style." />

        <div className="mt-6">
          <PropertyFilters
            activeType={type}
            onTypeChange={handleTypeChange}
            total={data?.total ?? 0}
            layout={layout}
            onLayoutChange={setLayout}
          />
        </div>

        <PropertyGrid
          className={layout === 'list' ? 'sm:grid-cols-1 lg:grid-cols-2' : undefined}
          properties={data?.items ?? []}
          isLoading={isLoading}
          skeletonCount={PAGE_SIZE}
          emptyTitle="No properties in this category yet"
          emptyDescription="Try another category — new residences are added every week."
        />

        <Pagination
          className="mt-10"
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          onChange={setPage}
        />
      </section>
    </>
  );
};
