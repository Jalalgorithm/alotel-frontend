import { CreditCard, PenLine, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { Image } from '@/components/ui/Image';
import { cn } from '@/utils/classNames';
import { paths } from '@/routes/paths';
import { Link } from 'react-router-dom';

/**
 * The shell every auth screen sits in.
 *
 * Two columns on a large screen: the form on plain white, and a residence
 * photograph carrying a deep-green scrim with the one thing worth saying on a
 * sign-in screen — who handles the sensitive parts of a booking. Those three
 * lines are the platform's actual arrangements, not decoration: Stripe runs
 * the identity check, Dropbox Sign holds the long-stay contracts, and card
 * details are only ever entered on the provider's own page.
 *
 * The previous version floated a white card on the sage canvas with a stock
 * caption pill over the photo, which read as a placeholder: the card's edges
 * fought the column, and the pill said nothing a guest could use.
 *
 * Design notes
 *  - Colour: brand-900 → transparent scrim over the photo, a single gold
 *    hairline as the accent, and the same sage canvas the rest of the guest
 *    site sits on behind the form, so signing in does not look like a
 *    different product.
 *  - Type: Poppins for the panel headline (italic, as the brand uses it),
 *    Inter for the trust rows at 12.5px.
 *  - Layout: 1fr/1.1fr split so the photo leads slightly; on phones the photo
 *    is dropped entirely and the trust rows move under the form, where they
 *    still do their job at a fraction of the weight.
 */

const TRUST = [
  { icon: ShieldCheck, label: 'ID checks run by Stripe Identity' },
  { icon: PenLine, label: 'Long-stay contracts signed with Dropbox Sign' },
  { icon: CreditCard, label: 'Card details are entered on the provider’s page, never ours' },
];

const DEFAULT_CAPTION = 'Premium furnished stays, from a weekend to a year.';

export const AuthLayout = ({
  image,
  imageAlt = 'An Alotel Spaces residence',
  caption = DEFAULT_CAPTION,
  children,
  className,
}) => (
  <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[1fr_1.1fr]">
    {/* Form column */}
    <div className="flex min-h-screen flex-col px-5 pb-20 pt-6 sm:px-10 lg:min-h-0 lg:px-12 lg:pb-8">
      <Logo />

      <div className="flex flex-1 items-center justify-center py-8">
        <div className={cn('w-full max-w-[400px]', className)}>{children}</div>
      </div>

      {/* The same assurances as the panel, for phones where the panel is gone. */}
      <ul className="mx-auto w-full max-w-[400px] space-y-1.5 border-t border-line pt-4 lg:hidden">
        {TRUST.map((item) => (
          <li key={item.label} className="flex items-start gap-2 text-[11.5px] leading-4 text-ink-muted">
            <item.icon className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>

      <p className="mx-auto mt-4 w-full max-w-[400px] text-[11.5px] text-ink-muted lg:mt-6">
        <Link to={paths.privacy} className="transition-colors hover:text-brand-700">
          Privacy
        </Link>
        <span className="px-1.5" aria-hidden="true">
          ·
        </span>
        <Link to={paths.terms} className="transition-colors hover:text-brand-700">
          Terms
        </Link>
        <span className="px-1.5" aria-hidden="true">
          ·
        </span>
        <Link to={paths.support} className="transition-colors hover:text-brand-700">
          Support
        </Link>
      </p>
    </div>

    {/* Imagery column — decorative, so it never carries content a guest needs.
        Pinned to the viewport: the grid row is as tall as the form, and on a
        long form (sign-up) a panel that grew with it pushed its own caption
        below the fold. */}
    <div className="relative hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:self-start">
      <Image src={image} alt={imageAlt} wrapperClassName="absolute inset-0 size-full" />

      {/* The scrim only covers the bottom half, where the type sits. Earlier
          passes tinted the whole panel and the photograph disappeared into a
          flat green wash. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brand-900/95 via-brand-900/55 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 p-10 xl:p-12">
        <span className="block h-px w-12 bg-gold" aria-hidden="true" />

        <p className="mt-5 max-w-[22ch] text-balance font-display text-[28px] font-semibold italic leading-tight text-white xl:text-[32px]">
          {caption}
        </p>

        <ul className="mt-6 space-y-2.5 border-t border-white/15 pt-5">
          {TRUST.map((item) => (
            <li key={item.label} className="flex items-start gap-2.5 text-[12.5px] leading-5 text-white/85">
              <item.icon className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);
