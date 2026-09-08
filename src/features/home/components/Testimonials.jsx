import { Accessibility, BadgeCheck, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { Skeleton } from '@/components/ui/Skeleton';
import { ASSURANCES } from '@/lib/homeContent';
import { useTestimonials } from '../hooks/useHomeContent';

/**
 * The social-proof band.
 *
 * Two blocks, on different footings.
 *
 * The assurances are always shown. They replaced four headline statistics —
 * "100K+ Verified Guests", "5,200 Move-Ins" and two more — that the client's
 * own brief marked as unverified placeholders, with the instruction to use a
 * qualitative line or drop the section rather than publish a number Finance
 * could not stand behind. Each line below describes something the product
 * actually does.
 *
 * The quotes are shown only if there are any. The brief marks all three as
 * drafts needing a signed release per guest, so `TESTIMONIALS` ships empty and
 * this half of the band stays hidden until real ones land — at which point it
 * appears with no code change.
 */

const ICONS = { BadgeCheck, ShieldCheck, ClipboardCheck, Accessibility };

export const Testimonials = () => {
  const { data: testimonials = [], isLoading } = useTestimonials();
  const hasQuotes = isLoading || testimonials.length > 0;

  return (
    <section className="shell py-14 text-center sm:py-16">
      <h2 className="font-display text-[26px] font-bold sm:text-[32px]">
        Stay Where Every Journey Feels Exceptional
      </h2>
      <p className="section-sub mx-auto mt-3 max-w-xl">
        The same standard in every city we operate in — verified before you arrive, supported while you are
        there, and answerable to you afterwards.
      </p>

      <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ASSURANCES.map((item) => {
          const Icon = ICONS[item.icon] ?? BadgeCheck;

          return (
            <li key={item.id} className="rounded-card border border-line bg-surface p-5 text-left shadow-card">
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-50">
                <Icon className="size-4 text-brand-600" aria-hidden="true" />
              </span>
              <p className="mt-3 font-display text-[14px] font-semibold text-ink">{item.title}</p>
              <p className="mt-1 text-[12.5px] leading-5 text-ink-soft">{item.body}</p>
            </li>
          );
        })}
      </ul>

      {hasQuotes && (
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-52 rounded-card" />)
            : testimonials.map((testimonial) => (
                <figure
                  key={testimonial.id}
                  className="flex flex-col rounded-card border border-line bg-surface p-5 text-left shadow-card"
                >
                  <div className="flex items-center gap-3">
                    {/* A guest may not have supplied a photograph; `Image`
                        falls back to a branded tile rather than a gap. */}
                    <Image src={testimonial.avatar} alt="" wrapperClassName="size-11 shrink-0 rounded-full" />
                    <figcaption>
                      <p className="font-display text-[14px] font-semibold">{testimonial.name}</p>
                      <p className="text-[11px] text-ink-muted">{testimonial.location}</p>
                      {testimonial.rating > 0 && (
                        <StarRating value={testimonial.rating} size="size-3" className="mt-0.5" />
                      )}
                    </figcaption>
                  </div>

                  <blockquote className="mt-4 flex-1 text-[13px] leading-6 text-ink-soft">
                    &ldquo; {testimonial.quote} &rdquo;
                  </blockquote>

                  <Badge className="mt-4 self-start">Verified Guest</Badge>
                </figure>
              ))}
        </div>
      )}
    </section>
  );
};
