import { env } from '@/lib/env';

/**
 * Resolve a media path returned by the API into something a browser can load.
 *
 * Django serialises uploads as root-relative URLs — `/media/inspections/x.png`.
 * The browser resolves those against the *page* origin, which in development is
 * the Vite dev server and in production is the web host: either way, not the
 * API. The result is a 404 and a broken image, which is exactly what the
 * check-in photographs on a booking were doing.
 *
 * Absolute URLs and data URIs are returned untouched, so a mix of uploaded
 * files and remote stock photography both work.
 */
export const mediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;

  try {
    return new URL(path, new URL(env.apiUrl, window.location.origin).origin).toString();
  } catch {
    return path;
  }
};
