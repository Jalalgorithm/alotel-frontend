import { Heart } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { useIsFavorite, useToggleFavorite } from '../hooks/useFavorites';

/**
 * Heart toggle overlaid on listing imagery.
 *
 * Backed by the guest's wishlist when signed in, and by local storage when not
 * — the button itself does not need to know which.
 */
export const FavoriteButton = ({ propertyId, className }) => {
  const isFavorite = useIsFavorite(propertyId);
  const { toggleFavorite } = useToggleFavorite();

  return (
    <button
      type="button"
      onClick={(event) => {
        // The card is wrapped in a link — keep the click from navigating.
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite({ propertyId, isSaved: isFavorite });
      }}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? 'Remove from saved properties' : 'Save this property'}
      className={cn(
        'flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform hover:scale-105',
        className,
      )}
    >
      <Heart
        className={cn('size-4 transition-colors', isFavorite ? 'fill-danger text-danger' : 'text-ink-soft')}
        aria-hidden="true"
      />
    </button>
  );
};
