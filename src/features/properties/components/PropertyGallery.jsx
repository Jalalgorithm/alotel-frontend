import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, Play, Share2 } from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { Badge } from '@/components/ui/Badge';
import { FavoriteButton } from './FavoriteButton';
import { cn } from '@/utils/classNames';
import { usePropertyVideos } from '../hooks/useProperty';
import { toast } from '@/stores/uiStore';

/**
 * Hero carousel + thumbnail strip for the property detail page.
 * Arrow keys move between shots when the carousel has focus.
 */
export const PropertyGallery = ({ property }) => {
  const { data: videos = [] } = usePropertyVideos(property.id);

  /**
   * Videos ride in the same gallery rather than a separate widget — a guest
   * looking at the property should not have to know which medium a given view
   * happens to be. Photos first: a still loads instantly, a walkthrough does
   * not, and the first frame of the gallery should never be a spinner.
   */
  const media = useMemo(() => {
    const stills = (property.images?.length ? property.images : [undefined]).map((url) => ({
      key: url ?? 'placeholder',
      url,
      isVideo: false,
    }));

    return [
      ...stills,
      ...videos.map((video) => ({
        key: video.id,
        url: video.url,
        poster: video.poster,
        caption: video.caption,
        roomType: video.roomType,
        duration: video.duration,
        isVideo: true,
      })),
    ];
  }, [property.images, videos]);

  const images = media;
  const [index, setIndex] = useState(0);
  const current = media[index] ?? media[0];

  const step = (delta) => setIndex((current) => (current + delta + images.length) % images.length);

  const firstVideoIndex = media.findIndex((item) => item.isVideo);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: property.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied', 'Share this residence with your travel party.');
      }
    } catch {
      /* the guest dismissed the share sheet — nothing to report */
    }
  };

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-card"
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${property.name} photos`}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') step(1);
          if (event.key === 'ArrowLeft') step(-1);
        }}
      >
        {current?.isVideo ? (
          /* `preload="none"` matters: a walkthrough should cost nothing to
             anyone who never presses play. The poster stands in until then. */
          <video
            key={current.key}
            src={current.url}
            poster={current.poster ?? undefined}
            controls
            playsInline
            preload="none"
            className="aspect-16/9 w-full rounded-card bg-ink object-cover"
          />
        ) : (
          <Image
            src={current?.url}
            alt={`${property.name} — photo ${index + 1}`}
            wrapperClassName="aspect-16/9 w-full"
          />
        )}

        {property.verified && (
          <Badge variant="gold" className="absolute left-4 top-4 shadow-sm">
            Verified Property
          </Badge>
        )}

        <div className="absolute right-4 top-4 flex items-center gap-2">
          <FavoriteButton propertyId={property.id} />
          <button
            type="button"
            onClick={share}
            aria-label="Share this property"
            className="flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform hover:scale-105"
          >
            <Share2 className="size-4 text-ink-soft" aria-hidden="true" />
          </button>
          {/* Only offered when there is something to play — this used to be a
              permanent button that promised a walkthrough "shortly", which was
              a lie on every listing that had one already. */}
          {firstVideoIndex >= 0 && (
            <button
              type="button"
              onClick={() => setIndex(firstVideoIndex)}
              aria-label="Play video tour"
              className="flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform hover:scale-105"
            >
              <Play className="size-3.5 text-ink-soft" aria-hidden="true" />
            </button>
          )}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform hover:scale-105"
            >
              <ChevronLeft className="size-4 text-ink" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform hover:scale-105"
            >
              <ChevronRight className="size-4 text-ink" aria-hidden="true" />
            </button>
          </>
        )}

        <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1 text-[11px] text-white backdrop-blur">
          <Images className="size-3" aria-hidden="true" />
          {index + 1} of {images.length}
        </span>
      </div>

      {images.length > 1 && (
        <div className="scrollbar-none mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((item, thumbIndex) => (
            <button
              key={`${item.key}-${thumbIndex}`}
              type="button"
              onClick={() => setIndex(thumbIndex)}
              aria-label={
                item.isVideo
                  ? `Play ${item.roomType || 'walkthrough'} video`
                  : `Show photo ${thumbIndex + 1}`
              }
              aria-current={thumbIndex === index}
              className={cn(
                'relative shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                thumbIndex === index ? 'border-brand-600' : 'border-transparent hover:border-brand-200',
              )}
            >
              {/* A video's poster is optional, so the tile falls back to a plain
                  dark plate rather than a broken image. */}
              {item.isVideo && !item.poster ? (
                <span className="flex h-16 w-24 items-center justify-center bg-ink" />
              ) : (
                <Image src={item.isVideo ? item.poster : item.url} alt="" wrapperClassName="h-16 w-24" />
              )}

              {item.isVideo && (
                <>
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/35">
                    <span className="flex size-7 items-center justify-center rounded-full bg-white/90">
                      <Play className="size-3.5 translate-x-px text-ink" aria-hidden="true" />
                    </span>
                  </span>
                  {item.duration > 0 && (
                    <span className="absolute bottom-1 right-1 rounded bg-ink/75 px-1 text-[9px] font-medium text-white">
                      {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
