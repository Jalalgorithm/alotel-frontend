import { Link } from 'react-router-dom';
import { cn } from '@/utils/classNames';
import { paths } from '@/routes/paths';
import { BRAND_MARK_SHAPES, BRAND_MARK_VIEWBOX } from '@/lib/brandMark';

/**
 * The Alotel Spaces mark — the A-frame with an arched doorway.
 *
 * Geometry lives in `@/lib/brandMark` so the printed receipt — which builds
 * HTML by hand and cannot import components — draws the identical mark.
 * Strokes use `currentColor`, letting the parent decide the colour (brand green
 * on light, white over photography).
 */
export const LogoMark = ({ className }) => (
  <svg viewBox={BRAND_MARK_VIEWBOX} className={cn('shrink-0', className)} aria-hidden="true" fill="none">
    {BRAND_MARK_SHAPES.map((shape, index) => {
      const paint = shape.fill
        ? { fill: 'currentColor' }
        : {
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: shape.width,
            ...(shape.join ? { strokeLinejoin: shape.join } : {}),
            ...(shape.cap ? { strokeLinecap: shape.cap } : {}),
          };

      if (shape.tag === 'path') return <path key={index} d={shape.d} {...paint} />;
      if (shape.tag === 'circle') return <circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} {...paint} />;
      return <line key={index} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} {...paint} />;
    })}
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
