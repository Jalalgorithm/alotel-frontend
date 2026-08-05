import { Sparkles } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { Image } from '@/components/ui/Image';
import { cn } from '@/utils/classNames';

/**
 * Split-screen shell shared by every auth screen: form card on the left,
 * full-bleed residence photography on the right with a floating caption pill.
 */
export const AuthLayout = ({ image, imageAlt = 'An Alotel Spaces residence', children, className }) => (
  <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-2">
    {/* Form column */}
    <div className="flex min-h-screen flex-col px-4 py-6 sm:px-8 lg:min-h-0">
      <Logo />

      <div className="flex flex-1 items-center justify-center py-8">
        <div
          className={cn(
            'w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8',
            className,
          )}
        >
          {children}
        </div>
      </div>
    </div>

    {/* Imagery column — decorative, so it is hidden from assistive tech on mobile */}
    <div className="relative hidden lg:block">
      <Image src={image} alt={imageAlt} wrapperClassName="absolute inset-0 size-full" />

      <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 shadow-card backdrop-blur">
        <Sparkles className="size-3.5 text-brand-600" aria-hidden="true" />
        <span className="font-display text-[12px] font-medium italic text-ink">
          Everything you need to manage premium stays
        </span>
      </div>
    </div>
  </div>
);
