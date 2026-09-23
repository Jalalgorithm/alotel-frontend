/**
 * Where the app is allowed to send someone after they sign in.
 *
 * The guard stores the page a guest was heading for and the sign-in screen
 * navigates there afterwards. That value comes from the URL, so it is attacker
 * input: a crafted link can put anything in it, and a redirect straight after
 * a password prompt is the most convincing moment in a phishing flow.
 *
 * React Router 6.30 has an open-redirect advisory of exactly this shape
 * (backslashes slipping past its own checks). The fix is React Router 7, a
 * breaking upgrade we are not taking in a security patch — so this validates
 * the value ourselves, which holds regardless of what the router does with it.
 *
 * Allowed: a site-relative path, e.g. `/bookings/abc?tab=stay`.
 * Refused: anything with a scheme (`https://…`, `javascript:`), a host
 * (`//evil.example`), or a backslash, which some parsers read as a slash.
 */
export const safeReturnTo = (value, fallback = '/') => {
  if (typeof value !== 'string' || value === '') return fallback;

  const path = value.trim();

  if (!path.startsWith('/')) return fallback;
  /* `//host` and `/\host` are both protocol-relative in practice. */
  if (path.startsWith('//') || path.startsWith('/\\')) return fallback;
  if (path.includes('\\')) return fallback;
  /* Control characters can truncate the check a browser then ignores. */
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(path)) return fallback;

  return path;
};
