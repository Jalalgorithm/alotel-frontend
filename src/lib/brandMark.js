/**
 * The Alotel Spaces mark, as raw geometry.
 *
 * Kept as data rather than JSX because two very different consumers need it:
 * the `Logo` React component, and the printed receipt, which is built as an
 * HTML string inside an iframe and cannot import components. Sharing the
 * geometry means the mark on a receipt can never drift from the one on screen.
 *
 * Taken verbatim from the supplied brand asset (`alotel-logo-only.svg`) with
 * the `<rect>` matte removed, so the mark is transparent on any surface.
 */
export const BRAND_MARK_VIEWBOX = '0 0 1000 1000';

/**
 * Each entry is one SVG element of the mark. `stroke`/`fill` are left as
 * `currentColor` so the caller decides the colour.
 */
export const BRAND_MARK_SHAPES = [
  // A-frame
  { tag: 'path', d: 'M500 120 L820 760 L180 760 Z', stroke: true, width: 42, join: 'round' },
  // Apex ring
  { tag: 'circle', cx: 500, cy: 120, r: 26, stroke: true, width: 24 },
  // Arched doorway
  { tag: 'path', d: 'M420 760 L420 500 Q420 430 500 430 Q580 430 580 500 L580 760', stroke: true, width: 42 },
  // Lintel
  { tag: 'line', x1: 370, y1: 560, x2: 630, y2: 560, stroke: true, width: 42, cap: 'round' },
  // Door handle
  { tag: 'circle', cx: 545, cy: 650, r: 17, fill: true },
];

/**
 * Serialise the mark to an SVG string, for contexts that build HTML by hand.
 *
 * @param {{ size?: number|string, color?: string, className?: string }} options
 */
export const brandMarkSvg = ({ size = 24, color = 'currentColor', className = '' } = {}) => {
  const shapes = BRAND_MARK_SHAPES.map((shape) => {
    const paint = shape.fill
      ? `fill="${color}"`
      : `fill="none" stroke="${color}" stroke-width="${shape.width}"` +
        (shape.join ? ` stroke-linejoin="${shape.join}"` : '') +
        (shape.cap ? ` stroke-linecap="${shape.cap}"` : '');

    if (shape.tag === 'path') return `<path d="${shape.d}" ${paint} />`;
    if (shape.tag === 'circle') return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" ${paint} />`;
    return `<line x1="${shape.x1}" y1="${shape.y1}" x2="${shape.x2}" y2="${shape.y2}" ${paint} />`;
  }).join('');

  return `<svg viewBox="${BRAND_MARK_VIEWBOX}" width="${size}" height="${size}" class="${className}" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${shapes}</svg>`;
};
