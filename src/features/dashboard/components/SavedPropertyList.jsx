import { Link } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';
import { Image } from '@/components/ui/Image';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency } from '@/utils/format';
import { paths } from '@/routes/paths';
import { useToggleFavorite } from '@/features/properties';

/**
 * The guest's wishlist.
 *
 * The API returns a slim row — name, city, base rate and a thumbnail — so this
 * is deliberately a compact card rather than the full property tile, which
 * would need a second request per entry to fill in.
 */
export const SavedPropertyList = ({ saved = [] }) => {
  const { toggleFavorite, isPending } = useToggleFavorite();

  if (!saved.length) {
    return (
      <EmptyState
        title="Nothing saved yet"
        description="Tap the heart on any residence to keep it here for later."
        action={<Button to={paths.properties}>Browse residences</Button>}
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {saved.map((entry) => (
        <li
          key={entry.propertyId}
          className="group relative flex gap-3 overflow-hidden rounded-lg border border-line p-2.5 transition-colors hover:border-brand-300"
        >
          <Image
            src={entry.image}
            alt={entry.name}
            wrapperClassName="size-16 shrink-0 rounded-md"
          />

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[13px] font-semibold">
              <Link
                to={paths.propertyDetail(entry.propertyId)}
                className="transition-colors hover:text-brand-700"
              >
                {entry.name || 'Saved residence'}
              </Link>
            </h3>

            {entry.city && (
              <p className="mt-0.5 inline-flex items-center gap-1 truncate text-[11.5px] text-ink-muted">
                <MapPin className="size-3 shrink-0 text-brand-600" aria-hidden="true" />
                {entry.city}
              </p>
            )}

            {entry.price > 0 && (
              <p className="mt-1 text-[12px] font-semibold text-brand-700">
                {formatCurrency(entry.price)}
                <span className="ml-1 text-[10.5px] font-normal text-ink-muted">/night</span>
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={() => toggleFavorite({ propertyId: entry.propertyId, isSaved: true })}
            aria-label={`Remove ${entry.name || 'this residence'} from saved properties`}
            className="flex size-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-danger-soft disabled:opacity-50"
          >
            <Heart className="size-3.5 fill-danger text-danger" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
};
