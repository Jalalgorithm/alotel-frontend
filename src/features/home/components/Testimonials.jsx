import { Image } from '@/components/ui/Image';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTestimonials, useTrustStats } from '../hooks/useHomeContent';

/** Social-proof band: headline stats plus three guest testimonials. */
export const Testimonials = () => {
  const { data: testimonials = [], isLoading } = useTestimonials();
  const { data: stats = [] } = useTrustStats();

  return (
    <section className="shell py-14 text-center sm:py-16">
      <h2 className="font-display text-[26px] font-bold sm:text-[32px]">
        Stay Where Every Journey Feels Exceptional
      </h2>
      <p className="section-sub mx-auto mt-3 max-w-xl">
        Thousands of guests have chosen Alotel Spaces for premium accommodations, seamless bookings, and
        exceptional hospitality.
      </p>

      {/* Headline stats */}
      <dl className="mt-9 grid gap-6 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.id}>
            <dt className="sr-only">{stat.label}</dt>
            <dd className="flex items-center justify-center gap-2">
              <span className="font-display text-[22px] font-bold text-brand-600">{stat.value}</span>
              {stat.stars && <StarRating value={5} size="size-4" />}
            </dd>
            <p className="mt-1 text-[12px] text-ink-soft">{stat.label}</p>
          </div>
        ))}
      </dl>

      {/* Testimonials */}
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-52 rounded-card" />)
          : testimonials.map((testimonial) => (
              <figure
                key={testimonial.id}
                className="flex flex-col rounded-card border border-line bg-surface p-5 text-left shadow-card"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={testimonial.avatar}
                    alt=""
                    wrapperClassName="size-11 shrink-0 rounded-full"
                  />
                  <figcaption>
                    <p className="font-display text-[14px] font-semibold">{testimonial.name}</p>
                    <p className="text-[11px] text-ink-muted">{testimonial.stay}</p>
                    <StarRating value={testimonial.rating} size="size-3" className="mt-0.5" />
                  </figcaption>
                </div>

                <blockquote className="mt-4 flex-1 text-[13px] leading-6 text-ink-soft">
                  &ldquo; {testimonial.quote} &rdquo;
                </blockquote>

                <Badge className="mt-4 self-start">Verified Guest</Badge>
              </figure>
            ))}
      </div>
    </section>
  );
};
