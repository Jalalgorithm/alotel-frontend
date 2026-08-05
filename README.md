# Alotel Spaces — Frontend

Premium extended-stay property platform, built from the Alotel Spaces Figma designs.

**Vite · React 19 (JavaScript/JSX) · React Router v6 · TanStack Query v5 · Zustand · Tailwind CSS v4 · Axios**

The app runs entirely on a mocked backend out of the box — `npm install && npm run dev` is all you need.

---

## Quick start

```bash
npm install
cp .env.example .env      # optional: the defaults already work
npm run dev               # http://localhost:5173
```

| Script            | What it does                            |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Dev server with HMR on port 5173        |
| `npm run build`   | Production bundle into `dist/`          |
| `npm run preview` | Serve the built bundle on port 4173     |
| `npm run lint`    | ESLint over the whole project           |

### Demo account

Mock mode ships a seeded user (also shown on the login screen):

```
demo@alotelspaces.com
Password123
```

Signing up creates a real record in the mock user table, so new accounts persist across reloads too.

---

## What's implemented

**Authentication**

- Sign up, log in, log out, forgot password, reset password.
- Session persisted to `localStorage` **and** a simulated `alotel_session` cookie.
- Login state survives a refresh with no auth flicker: React Query seeds `initialData` from storage, then revalidates in the background.
- `ProtectedRoute` guards `/dashboard` and `/book/:propertyId`; `PublicOnlyRoute` keeps signed-in guests off the auth screens.
- Attempted URLs are remembered — a guard redirect returns you to where you were heading after login.

**Screens (all from the designs)**

| Route                     | Screen                                                                |
| ------------------------- | --------------------------------------------------------------------- |
| `/`                       | Landing: hero + search, destinations, value props, featured stays, CTA band, testimonials |
| `/properties`             | Catalogue with category filters, pagination, grid/list toggle         |
| `/properties/:propertyId` | Detail: gallery, facts, highlights, amenities, location, FAQ, similar |
| `/search`                 | Results list with filter chips and a map panel                        |
| `/book/:propertyId` 🔒    | Six-step booking wizard                                               |
| `/dashboard` 🔒           | Welcome, stats, and booking history                                   |
| `/login` `/signup` `/forgot-password` `/reset-password` | Split-screen auth screens           |

**Booking wizard** — Guest details → Review → Verify identity → Payment → Upload receipt → Confirmation. The draft is persisted to `sessionStorage`, so a refresh mid-flow loses nothing.

---

## Project structure

```
src/
├── assets/styles/index.css     # Tailwind v4 entry + @theme design tokens
├── components/
│   ├── ui/                     # Button, Input, Card, Modal, Badge, Accordion, FileDropzone…
│   └── shared/                 # Navbar, Footer, SiteLayout, SearchBar, ErrorBoundary, Toaster…
├── features/                   # Feature-first modules — every route lives in one
│   ├── auth/                   # components/ hooks/ services/ index.js
│   ├── home/
│   ├── properties/
│   ├── booking/
│   └── dashboard/
├── hooks/                      # useLocalStorage, useMediaQuery, useDebouncedValue, useClickOutside
├── lib/                        # apiClient (axios + interceptors), queryClient, queryKeys, storage, mock/
├── providers/                  # AppProviders, QueryProvider, AuthProvider, ThemeProvider
├── routes/                     # index.jsx, ProtectedRoute.jsx, PublicOnlyRoute.jsx, paths.js
├── stores/                     # Zustand: auth, ui, booking draft, favorites
├── utils/                      # classNames, format, validators, errors
├── App.jsx
└── main.jsx
```

### Conventions

- Components are `.jsx`; hooks, services and utilities are `.js`.
- **Named exports only** — there is no `export default` anywhere in `src/`.
- Every route belongs to a feature; there is no `pages/` folder.
- Each feature owns its `components/`, `hooks/`, `services/` and exposes a public API through `index.js`. Nothing imports another feature's internals.
- Server state → TanStack Query (queries and mutations live in feature `services/` + `hooks/`). Client state → Zustand in `stores/`.
- Import from the root with the `@/` alias (`@/components/ui/Button`).

---

## Mock mode vs. a real backend

`VITE_USE_MOCK` decides which implementation each service uses. Both live side by side in the same file with an identical public surface, so **no component or hook changes** when you switch.

```js
// src/features/auth/services/authService.js
const backend = env.useMock ? mockAuth : realAuth;
```

To point at a real API:

```dotenv
VITE_API_URL=https://api.your-backend.com
VITE_USE_MOCK=false
```

The expected endpoints are:

| Method | Endpoint                       | Used by                    |
| ------ | ------------------------------ | -------------------------- |
| POST   | `/auth/login`                  | `authService.login`        |
| POST   | `/auth/register`               | `authService.signup`       |
| POST   | `/auth/logout`                 | `authService.logout`       |
| GET    | `/auth/me`                     | `authService.getCurrentUser` |
| POST   | `/auth/refresh`                | axios interceptor          |
| POST   | `/auth/forgot-password`        | password recovery          |
| POST   | `/auth/reset-password`         | password recovery          |
| GET    | `/properties`, `/properties/:id`, `/properties/:id/similar` | catalogue |
| GET    | `/destinations`, `/testimonials`, `/stats`                  | landing   |
| GET/POST/PATCH | `/bookings`, `/bookings/:id`, `/bookings/:id/documents` | booking |
| GET    | `/dashboard/summary`           | dashboard                  |

Login is expected to return `{ user, token, refreshToken }`.

### API client

`src/lib/apiClient.js` is a single axios instance that:

- attaches `Authorization: Bearer <token>` to every request;
- sends cookies (`withCredentials`) so a cookie-session backend works unchanged;
- on a `401`, refreshes the token once and replays the original request — concurrent 401s queue behind that single refresh;
- on refresh failure, clears the session and dispatches `alotel:session-expired`, which `AuthProvider` turns into a clean logout.

In dev, requests to `/api` are proxied to `VITE_API_URL` (see `vite.config.js`).

---

## Styling

Tailwind CSS v4 via PostCSS (`postcss.config.js` → `@tailwindcss/postcss`). Design tokens are declared CSS-first in the `@theme` block of `src/assets/styles/index.css`; `tailwind.config.js` holds the source globs and is loaded through the `@config` directive.

| Token                       | Value     | Use                          |
| --------------------------- | --------- | ---------------------------- |
| `brand-700`                 | `#12603F` | Primary buttons              |
| `brand-600`                 | `#1B6E4A` | Links, icons, active states   |
| `brand-50`                  | `#EDF7F1` | Soft fills, badges           |
| `logo` / `logo-deep`        | `#5AAA40` / `#2A4A20` | The logo lockup only |
| `canvas` / `surface`        | `#E8F0E0` / `#FFFFFF` | Page and card backgrounds |
| `line`                      | `#E0E6D9` | Hairline borders             |
| `ink` / `ink-soft` / `ink-muted` | `#16181A` / `#5C6169` / `#8A9099` | Text hierarchy |
| `gold`                      | `#F0A92C` | Ratings, "Verified" badge    |
| `--font-display`            | Poppins   | Headings and italic CTAs     |
| `--font-sans`               | Inter     | Body and UI                  |
| `--font-serif`              | Georgia   | The "Alotel" wordmark        |
| `--breakpoint-xs`           | `26rem`   | Extra stop for small phones  |

### Brand

The page canvas is the logo's own backdrop (`#E8F0E0`), so the mark sits flush with no visible plate behind it. To fall back to a neutral off-white, change one line in `index.css`:

```css
--color-canvas: #f7f7f4;
```

`Logo` in [src/components/shared/Logo.jsx](src/components/shared/Logo.jsx) draws the A-frame inline from the supplied artwork's path data with the background rect removed, so it is transparent everywhere and scales without artefacts. Strokes use `currentColor`, so `tone="light"` renders it solid white over photography. The original files are kept in [public/brand/](public/brand/) and the favicon uses the same geometry.

Note the two greens are intentional: the logo keeps its brighter `#5AAA40`, while buttons and links keep the deeper forest green from the Figma comps.

## Responsive behaviour

Layouts were verified at 320, 390, 768 and 1024 px across every route — no horizontal scroll at any width.

- **Breakpoints**: base (phone) → `xs` 416px → `sm` 640px → `lg` 1024px. The search bar goes stacked → 2×2 → single row; property grids 1 → 2 → 4 columns; detail and search pages drop their sidebar/map below `lg`.
- **Container queries** where viewport width is the wrong signal: the booking property card is full width on a phone but only ~320px inside the two-column desktop layout, so its date fields key off `@container`, not the viewport.
- **Grid gotcha**: every multi-column grid declares `grid-cols-1` at the base width. Without it the implicit column is auto-sized, and a single `truncate`d title sets a min-content floor that pushes the whole page into horizontal scroll.
- **Flex gotcha**: `flex-1` in a `flex-col` container sets the basis on the *height*. The footer newsletter field uses `sm:flex-1` so it doesn't collapse while stacked.
- Overflowing pill rails (property categories, search filters) scroll horizontally and bleed to the screen edge on touch rather than wrapping.

Listing photography comes from Unsplash URLs in `src/lib/mock/data.js`. The shared `<Image>` component falls back to a branded gradient if a photo fails to load, so the layout never breaks offline. Swap those URLs for your own CDN when real inventory arrives.

---

## Notes

- Route components are lazily loaded, so the landing page does not ship the booking wizard or dashboard code.
- `ErrorBoundary` wraps both the app root and the page outlet — one broken page keeps the site chrome intact.
- Forms use React Hook Form with Zod schemas from `src/utils/validators.js`; every field reports errors through `aria-invalid`/`aria-describedby`.
- The map panels on `/search` and the property detail page are lightweight SVG stand-ins — no API key, nothing to break. Drop in Mapbox/Google where `ResultsMap` and `MapCanvas` render.

## Deployment

Environment values are chosen by Vite's mode, so the same commands work locally
and on Vercel with nothing to remember:

| File | Loaded when | API it points at |
|---|---|---|
| `.env.development` | `npm run dev` | `http://localhost:8000/api/v1` |
| `.env.production` | `npm run build` (what Vercel runs) | `https://api.alotel.synoloopsolutions.com.ng/api/v1` |
| `.env.local` | always, and wins | your own overrides — gitignored |

Both mode files are committed on purpose: every `VITE_` value is compiled into
the bundle and served to the browser, so none of it is secret. Anything that
*is* secret must never be a `VITE_` variable.

To point a deploy somewhere else, set `VITE_API_URL` in the Vercel project's
environment variables — dashboard values override the committed file at build
time. Verify a build picked up the right one with:

```bash
npm run build && grep -o 'https://[^"]*api/v1' dist/assets/*.js | head -1
```

`vercel.json` rewrites every path to `index.html`; without it a deep link like
`/properties/<id>` 404s on refresh, because the router only exists client-side.
