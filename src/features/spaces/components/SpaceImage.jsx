import { Presentation } from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { cn } from '@/utils/classNames';

/**
 * A space's photograph, or a stand-in for it.
 *
 * Spaces have no image model on the API yet, so every listing currently has an
 * empty gallery. Rather than render a broken frame or collapse the layout, this
 * draws a branded plate carrying the space's own name — the page keeps its
 * shape and hierarchy, and nothing looks like a loading failure.
 *
 * The moment `GET /spaces/{id}/images/` exists, `space.images` fills and this
 * falls through to the real photo with no other change.
 */
export const SpaceImage = ({ space, index = 0, className, wrapperClassName }) => {
  const url = space.images?.[index];

  if (url) return <Image src={url} alt={space.name} wrapperClassName={wrapperClassName} className={className} />;

  return (
    <div
      role="img"
      aria-label={`${space.name} — no photograph yet`}
      className={cn(
        'flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-50 to-brand-100 p-4 text-center',
        wrapperClassName,
      )}
    >
      <Presentation className="size-6 text-brand-600/50" aria-hidden="true" />
      <span className="line-clamp-2 text-[11.5px] font-medium text-brand-700/70">{space.name}</span>
    </div>
  );
};
