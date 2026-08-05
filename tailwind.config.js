/**
 * Tailwind CSS v4 configuration.
 *
 * v4 is CSS-first: design tokens (colors, fonts, radii, shadows) live in the
 * `@theme` block of `src/assets/styles/index.css`. This file is still loaded —
 * via the `@config` directive at the top of that stylesheet — and is the right
 * place for source globs, safelisting and plugins.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
