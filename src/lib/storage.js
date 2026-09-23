/**
 * Browser persistence for the auth session.
 *
 * Where the session lives is the guest's choice: "Remember me" keeps it in
 * `localStorage`, which survives closing the browser; leaving it unticked puts
 * it in `sessionStorage`, which dies with the tab — the behaviour the checkbox
 * has always implied and never had. A marker records which store is in use so
 * later writes and the sign-out sweep can find it.
 *
 * An earlier version also mirrored the access token into a `document.cookie`
 * entry as a stepping stone towards httpOnly cookies. It was readable by any
 * script, carried no `Secure` flag, and — being `SameSite=Lax` against an API
 * on another domain — was never actually sent anywhere. It has been removed;
 * `clear()` still deletes the old cookie so browsers holding one are cleaned
 * up on the next sign-out.
 */

const KEYS = {
  token: 'alotel.auth.token',
  refreshToken: 'alotel.auth.refresh',
  user: 'alotel.auth.user',
  /** Which store the session above lives in: 'session', or absent for 'local'. */
  scope: 'alotel.auth.scope',
};

/** The cookie this module used to write. Kept only so `clear()` can remove it. */
const LEGACY_COOKIE = 'alotel_session';

/** Storage throws in private-mode Safari and in sandboxed iframes. */
const safeStorage = (getBackend) => ({
  get(key) {
    try {
      return getBackend().getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      getBackend().setItem(key, value);
    } catch {
      /* storage unavailable — the in-memory session still works for this tab */
    }
  },
  remove(key) {
    try {
      getBackend().removeItem(key);
    } catch {
      /* no-op */
    }
  },
});

const local = safeStorage(() => window.localStorage);
const session = safeStorage(() => window.sessionStorage);

/**
 * The store holding the current session.
 *
 * Defaults to `localStorage`, which is where every session created before this
 * change lives — those guests must stay signed in across the deploy.
 */
const currentStore = () => (session.get(KEYS.scope) === 'session' ? session : local);

/** Reads fall back across both stores, so a half-migrated session still resolves. */
const readEither = (key) => session.get(key) ?? local.get(key);

const clearBoth = (key) => {
  session.remove(key);
  local.remove(key);
};

const deleteLegacyCookie = () => {
  document.cookie = `${LEGACY_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

export const authStorage = {
  getToken: () => readEither(KEYS.token),

  getRefreshToken: () => readEither(KEYS.refreshToken),

  /** @returns {object | null} the cached user, so the UI can paint before any request. */
  getUser: () => {
    const raw = readEither(KEYS.user);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      clearBoth(KEYS.user);
      return null;
    }
  },

  /**
   * Persist a session.
   *
   * `remember` is only meaningful at sign-in: `true` keeps the session on the
   * device, `false` keeps it for the tab. Leaving it undefined — which is what
   * the token refresh does — keeps the session exactly where it already is,
   * so a refresh can never silently relocate it.
   */
  setSession: ({ token, refreshToken, user, remember }) => {
    if (remember !== undefined) {
      const keys = [KEYS.token, KEYS.refreshToken, KEYS.user];
      if (remember) {
        keys.forEach((key) => session.remove(key));
        session.remove(KEYS.scope);
      } else {
        keys.forEach((key) => local.remove(key));
        session.set(KEYS.scope, 'session');
      }
    }

    const store = currentStore();
    if (token) store.set(KEYS.token, token);
    if (refreshToken) store.set(KEYS.refreshToken, refreshToken);
    if (user) store.set(KEYS.user, JSON.stringify(user));
  },

  setUser: (user) => {
    if (user) currentStore().set(KEYS.user, JSON.stringify(user));
    else clearBoth(KEYS.user);
  },

  clear: () => {
    Object.values(KEYS).forEach(clearBoth);
    deleteLegacyCookie();
  },
};

/** Generic namespaced JSON storage used by the mock backend and small features. */
export const jsonStorage = {
  read(key, fallback) {
    const raw = local.get(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    local.set(key, JSON.stringify(value));
  },
  remove(key) {
    local.remove(key);
  },
};
