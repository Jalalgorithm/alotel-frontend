import { Presentation } from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { cn } from '@/utils/classNames';

/**
 * A space's photograph, or a stand-in for it.
 *
 * Images are live now, but a host who has not uploaded any is a normal state
 * rather than an error — that listing gets a branded plate carrying its own
 * name, so the page keeps its shape instead of showing a broken frame.
 */
export const SpaceImage = ({ space, index = 0, className, wrapperClassName }) => {
  const url = space.images?.[index]?.url;

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
