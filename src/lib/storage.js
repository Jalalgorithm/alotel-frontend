/**
 * Browser persistence for the auth session.
 *
 * The token is written to BOTH localStorage and a `document.cookie` entry:
 * localStorage is what the app reads, while the cookie simulates the
 * `Set-Cookie` a real backend would issue — so switching to httpOnly cookies
 * later only means deleting the localStorage half.
 */

const KEYS = {
  token: 'alotel.auth.token',
  refreshToken: 'alotel.auth.refresh',
  user: 'alotel.auth.user',
};

const COOKIE_NAME = 'alotel_session';
const SESSION_DAYS = 7;

/** localStorage throws in private-mode Safari and sandboxed iframes. */
const safeLocalStorage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage unavailable — the in-memory session still works for this tab */
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* no-op */
    }
  },
};

/* -------------------------------------------------------------------------- */
/* Cookie helpers (simulated session cookie)                                   */
/* -------------------------------------------------------------------------- */

const setCookie = (name, value, days = SESSION_DAYS) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

export const readCookie = (name) => {
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

export const authStorage = {
  getToken: () => safeLocalStorage.get(KEYS.token) ?? readCookie(COOKIE_NAME),

  getRefreshToken: () => safeLocalStorage.get(KEYS.refreshToken),

  /** @returns {object | null} the cached user, so the UI can paint before any request. */
  getUser: () => {
    const raw = safeLocalStorage.get(KEYS.user);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      safeLocalStorage.remove(KEYS.user);
      return null;
    }
  },

  setSession: ({ token, refreshToken, user }) => {
    if (token) {
      safeLocalStorage.set(KEYS.token, token);
      setCookie(COOKIE_NAME, token);
    }
    if (refreshToken) safeLocalStorage.set(KEYS.refreshToken, refreshToken);
    if (user) safeLocalStorage.set(KEYS.user, JSON.stringify(user));
  },

  setUser: (user) => {
    if (user) safeLocalStorage.set(KEYS.user, JSON.stringify(user));
    else safeLocalStorage.remove(KEYS.user);
  },

  clear: () => {
    Object.values(KEYS).forEach(safeLocalStorage.remove);
    deleteCookie(COOKIE_NAME);
  },
};

/** Generic namespaced JSON storage used by the mock backend and small features. */
export const jsonStorage = {
  read(key, fallback) {
    const raw = safeLocalStorage.get(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    safeLocalStorage.set(key, JSON.stringify(value));
  },
  remove(key) {
    safeLocalStorage.remove(key);
  },
};
