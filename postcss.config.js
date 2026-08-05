/**
 * Tailwind CSS v4 ships its PostCSS integration as a separate package.
 * Vendor prefixing and nesting are handled internally by Tailwind v4 (Lightning CSS),
 * so `autoprefixer` and `postcss-nesting` are no longer needed.
 */
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
