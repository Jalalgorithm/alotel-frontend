import { Link } from 'react-router-dom';
import { cn } from '@/utils/classNames';
import { paths } from '@/routes/paths';

/**
 * The Alotel Spaces mark — the A-frame with an arched doorway.
 *
 * Geometry is taken verbatim from the supplied brand asset
 * (`alotel-logo-only.svg`) with the `<rect>` matte removed, so the mark is
 * transparent and sits on any surface. Strokes use `currentColor`, letting the
 * parent decide the colour (brand green on light, white over photography).
 */
export const LogoMark = ({ className }) => (
  <svg viewBox="0 0 1000 1000" className={cn('shrink-0', className)} aria-hidden="true" fill="none">
    {/* A-frame */}
    <path
      d="M500 120 L820 760 L180 760 Z"
      stroke="currentColor"
      strokeWidth="42"
      strokeLinejoin="round"
    />
    {/* Apex ring */}
    <circle cx="500" cy="120" r="26" stroke="currentColor" strokeWidth="24" />
    {/* Arched doorway */}
    <path
      d="M420 760 L420 500 Q420 430 500 430 Q580 430 580 500 L580 760"
      stroke="currentColor"
      strokeWidth="42"
    />
    {/* Lintel */}
    <line x1="370" y1="560" x2="630" y2="560" stroke="currentColor" strokeWidth="42" strokeLinecap="round" />
    {/* Door handle */}
    <circle cx="545" cy="650" r="17" fill="currentColor" />
  </svg>
);

const MARK_SIZES = {
  sm: 'size-7',
  md: 'size-8 sm:size-9',
  lg: 'size-11 sm:size-12',
};

const WORD_SIZES = {
  sm: 'text-[15px]',
  md: 'text-[17px] sm:text-[19px]',
  lg: 'text-[22px] sm:text-[26px]',
};

// Kept at/above 9px so the sub-label stays legible on small screens.
const SUB_SIZES = {
  sm: 'text-[9px] tracking-[0.28em]',
  md: 'text-[9px] tracking-[0.3em] sm:text-[10px]',
  lg: 'text-[11px] tracking-[0.32em]',
};

/**
 * Full logo lockup: mark + "Alotel" wordmark with the "SPACES" sub-label,
 * matching the supplied brand artwork.
 *
 * @param {{
 *   tone?: 'brand' | 'light',   // green on light surfaces, or solid white over imagery
 *   size?: 'sm' | 'md' | 'lg',
 *   withText?: boolean,         // false renders the mark alone (tight spaces)
 *   as?: 'link' | 'div',        // 'div' when the logo is already inside a link
 * }} props
 */
export const Logo = ({ tone = 'brand', size = 'md', withText = true, as = 'link', className }) => {
  const isLight = tone === 'light';

  const content = (
    <>
      <LogoMark className={cn(MARK_SIZES[size], isLight ? 'text-white' : 'text-logo')} />

      {withText && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-serif font-bold leading-none',
              WORD_SIZES[size],
              isLight ? 'text-white' : 'text-logo-deep',
            )}
          >
            Alotel
          </span>
          <span
            className={cn(
              'mt-0.5 font-sans font-medium uppercase leading-none',
              SUB_SIZES[size],
              isLight ? 'text-white/80' : 'text-logo',
            )}
          >
            Spaces
          </span>
        </span>
      )}
    </>
  );

  const classes = cn('inline-flex items-center gap-2', className);

  if (as === 'div') {
    return <span className={classes}>{content}</span>;
  }

  return (
    <Link to={paths.home} className={classes} aria-label="Alotel Spaces — home">
      {content}
    </Link>
  );
};
