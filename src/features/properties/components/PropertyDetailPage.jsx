import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MapPin } from 'lucide-react';
import { Loading } from '@/components/shared/Loading';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/Button';
import { Accordion } from '@/components/ui/Accordion';
import { PropertyGallery } from './PropertyGallery';
import { PropertyAmenities } from './PropertyAmenities';
import { LocationLandmarks } from './LocationLandmarks';
import { BookingSidebar } from './BookingSidebar';
import { SimilarProperties } from './SimilarProperties';
import { useProperty } from '../hooks/useProperty';
import { faqs } from '@/lib/mock/data';
import { paths } from '@/routes/paths';

/** Compact fact tile: bedrooms, bathrooms, capacity, total area. */
const FactTile = ({ label, value }) => (
  <div className="rounded-lg border border-line bg-surface px-4 py-3 text-center">
    <p className="text-[11px] text-ink-muted">{label}</p>
    <p className="mt-1 text-[13px] font-semibold text-ink">{value}</p>
  </div>
);

const Panel = ({ title, children }) => (
  <section className="rounded-card border border-line bg-surface p-5 shadow-card">
    <h2 className="text-[15px] font-semibold text-brand-700">{title}</h2>
    <div className="mt-3">{children}</div>
  </section>
);

/** Full property detail route. */
export const PropertyDetailPage = () => {
  const { propertyId } = useParams();
  const { data: property, isLoading, isError } = useProperty(propertyId);

  if (isLoading) return <Loading label="Loading this residence…" />;

  if (isError || !property) {
    return (
      <EmptyState
        title="We couldn't find that property"
        description="It may have been unlisted. Browse our current collection instead."
        action={<Button to={paths.properties}>Browse properties</Button>}
        className="min-h-[60vh]"
      />
    );
  }

  return (
    <div className="shell py-8">
      <Link
        to={paths.properties}
        className="inline-flex items-center gap-2 py-2 text-[13px] text-ink-soft transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Properties
      </Link>

      <header className="mt-4">
        <h1 className="font-display text-[22px] font-bold text-brand-700 sm:text-[26px]">{property.name}</h1>
        <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-ink-soft">
          <MapPin className="size-3.5 text-brand-600" aria-hidden="true" />
          {property.city}, {property.country}
        </p>
      </header>

      <div className="mt-5">
        <PropertyGallery property={property} />
      </div>

      {/*
        Three blocks rather than two columns, so the booking panel can sit in
        the middle of the content on a phone.

        Source order is the mobile order: details → booking panel → location and
        FAQs. Stacked, that puts the price and the "Book now" button directly
        after the amenities, instead of stranding it below the FAQ accordion
        where nobody scrolls. On `lg` the explicit row/column placement
        reassembles it into the original two-column layout.
      */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        {/* Details — the part a guest reads before deciding */}
        <div className="space-y-6 lg:col-start-1 lg:row-start-1">
          {/* The API models the counts but not the prose describing them, so
              each tile falls back to the number alone rather than printing a
              half-sentence with a missing half. */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <FactTile
              label={property.beds ? `${property.beds} Bedrooms` : 'Studio'}
              value={property.bedConfiguration ?? property.furnished ?? '—'}
            />
            <FactTile
              label={`${property.baths} Bathrooms`}
              value={property.bathroomConfiguration ? `${property.baths} ${property.bathroomConfiguration}` : property.pets ?? '—'}
            />
            <FactTile label="Capacity" value={`${property.guests} Guests Max`} />
            <FactTile
              label="Total Area"
              value={property.areaSqft ? `${property.areaSqft.toLocaleString()} sq.ft` : '—'}
            />
          </div>

          {property.description?.length > 0 && (
            <Panel title="About This Property">
              <div className="space-y-3 text-[13px] leading-6 text-ink-soft">
                {property.description.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
            </Panel>
          )}

          {property.highlights?.length > 0 && (
            <Panel title="Key Highlights">
              <ul className="space-y-2.5">
                {property.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2 text-[13px] text-ink-soft">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <PropertyAmenities amenities={property.amenities} />
        </div>

        {/* Booking panel — second on mobile, right-hand column on desktop */}
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <BookingSidebar property={property} />
        </div>

        {/* Supporting detail — read after the decision, not before it */}
        <div className="space-y-6 lg:col-start-1 lg:row-start-2">
          <LocationLandmarks property={property} />

          <section>
            <h2 className="font-display text-lg font-semibold text-brand-700">Frequently Asked Questions</h2>
            <Accordion items={faqs} className="mt-4" />
          </section>
        </div>
      </div>

      <SimilarProperties propertyId={property.id} />
    </div>
  );
};
