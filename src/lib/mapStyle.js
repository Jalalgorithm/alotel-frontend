/**
 * A MapLibre-compatible style built on Mapbox raster tiles.
 *
 * We render with MapLibre GL — the open fork of Mapbox GL v1 — because it
 * carries no per-map-load licence fee. The catch is that Mapbox's *vector*
 * styles (`/styles/v1/mapbox/light-v11`) reference `mapbox://` URLs for their
 * source, sprites and glyphs, and MapLibre has no handler for that protocol.
 * Handing it one produced a map that looked alive — a canvas, a navigation
 * control, the right size — but never finished loading, so `load` never fired
 * and no marker was ever added. A blank grey panel with no pins.
 *
 * Mapbox's Static Tiles API serves the same cartography pre-rendered as PNG,
 * which MapLibre consumes as an ordinary raster source with no protocol
 * extension at all. Same token, same look, and nothing vendor-specific in the
 * style object.
 *
 * `@2x` asks for retina tiles; they cost the same request and are what makes
 * labels legible on a modern display.
 */
export const mapStyle = (token, { style = 'light-v11' } = {}) => ({
  version: 8,
  sources: {
    basemap: {
      type: 'raster',
      tiles: [
        `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/256/{z}/{x}/{y}@2x?access_token=${token}`,
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
});
