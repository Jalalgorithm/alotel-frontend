import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/utils/classNames';

/**
 * Image with a branded fallback.
 *
 * Listing photography is remote, so a dead URL or an offline device must never
 * leave a broken-image glyph in the middle of the layout.
 */
export const Image = ({ src, alt = '', className, wrapperClassName, ...props }) => {
  const [hasFailed, setHasFailed] = useState(false);

  return (
    <span className={cn('relative block overflow-hidden bg-brand-50', wrapperClassName)}>
      {hasFailed || !src ? (
        <span className="flex size-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200">
          <ImageOff className="size-6 text-brand-600/50" aria-hidden="true" />
          <span className="sr-only">{alt}</span>
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setHasFailed(true)}
          className={cn('size-full object-cover', className)}
          {...props}
        />
      )}
    </span>
  );
};
