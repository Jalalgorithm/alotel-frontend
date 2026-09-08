import { cn } from '@/utils/classNames';
import { BRAND_MARK_SHAPES, BRAND_MARK_VIEWBOX } from '@/lib/brandMark';

/**
 * The Alotel mark, drawing itself.
 *
 * A loading state is the one screen every guest sees, so it may as well be the
 * logo rather than a generic spinner. Each stroked part of the A-frame traces
 * from start to finish and away again, staggered so the roof, the apex ring,
 * the doorway and the lintel arrive in the order someone would draw them.
 *
 * The trick that makes this work on arbitrary geometry is `pathLength="1"`:
 * it renormalises every shape — path, line and circle alike — to a length of
 * one, so a single `stroke-dasharray: 1` and an offset from 1 to -1 traces any
 * of them without measuring anything at runtime. Nothing here needs to know
 * how long the roofline actually is, which means the mark can change in
 * `brandMark.js` and this keeps working.
 *
 * Under reduced motion the strokes are simply drawn and left alone — see
 * `.brand-loader-shape` in the stylesheet, where the offset resets to 0. A
 * traced logo that never finishes tracing would otherwise be invisible.
 */

const SIZES = {
  sm: 'size-8',
  md: 'size-12',
  lg: 'size-16',
};

export const BrandLoader = ({ size = 'md', label = 'Loading', className }) => (
  <span role="status" aria-label={label} className={cn('relative inline-grid place-items-center', className)}>
    {/* A slow halo behind the mark, so the pause between traces does not read
        as the page having stalled. */}
    <span className="brand-loader-halo absolute inset-0 rounded-full bg-brand-500/10" aria-hidden="true" />

    <svg
      viewBox={BRAND_MARK_VIEWBOX}
      className={cn('relative text-logo', SIZES[size] ?? SIZES.md)}
      fill="none"
      aria-hidden="true"
    >
      {BRAND_MARK_SHAPES.map((shape, index) => {
        /* Staggered so the mark assembles rather than flashing all at once. */
        const style = { animationDelay: `${index * 0.11}s` };

        if (shape.fill) {
          return (
            <circle
              key={index}
              cx={shape.cx}
              cy={shape.cy}
              r={shape.r}
              fill="currentColor"
              className="brand-loader-dot"
              style={style}
            />
          );
        }

        const paint = {
          pathLength: 1,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: shape.width,
          className: 'brand-loader-shape',
          style,
          ...(shape.join ? { strokeLinejoin: shape.join } : {}),
          ...(shape.cap ? { strokeLinecap: shape.cap } : {}),
        };

        if (shape.tag === 'path') return <path key={index} d={shape.d} {...paint} />;
        if (shape.tag === 'circle') return <circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} {...paint} />;
        return <line key={index} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} {...paint} />;
      })}
    </svg>
  </span>
);
