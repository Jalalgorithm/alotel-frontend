import { apiClient } from '@/lib/apiClient';
import { env } from '@/lib/env';
import { authStorage, jsonStorage } from '@/lib/storage';
import { ApiError } from '@/utils/errors';
import { clone, createFakeToken, createId, delay } from '@/lib/mock/utils';
import { demoUser } from '@/lib/mock/data';

/**
 * Authentication service.
 *
 * Two implementations behind one surface — `env.useMockAuth` picks which runs,
 * so hooks and components never change between offline and live development.
 *
 * ── Login is a two-outcome operation ────────────────────────────────────────
 * The API returns tokens directly when 2FA is off, but `{detail: "2FA code
 * sent"}` when it is on. `login()` therefore resolves to a tagged result —
 * `{ status: 'authenticated' | '2fa_required' }` — rather than a user, so the
 * caller can route to the code screen instead of guessing from a missing field.
 */

const USERS_KEY = 'alotel.mock.users';

/* -------------------------------------------------------------------------- */
/* Shape translation                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The API models names as `first_name`/`last_name` and verification as a `kyc`
 * block. The app works in `fullName` and a boolean. Translating here keeps that
 * difference from leaking into every component.
 *
 * @param {object} payload `/auth/profile/` or `/auth/register/` response
 */
const toAppUser = (payload) => {
  if (!payload) return null;

  const firstName = payload.first_name ?? '';
  const lastName = payload.last_name ?? '';

  return {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    firstName,
    lastName,
    otherName: payload.other_name ?? '',
    fullName: [firstName, lastName].filter(Boolean).join(' ') || payload.email,
    phone: payload.phone ?? '',
    /** The API emails a code at registration; nothing is gated on it yet. */
    emailVerified: Boolean(payload.email_verified),
    avatar: payload.avatar ?? '',
    twoFactorEnabled: Boolean(payload.profile?.enable_2fa),
    preferences: payload.profile?.preferences ?? {},
    /** Identity verification comes from the KYC record, not a made-up flag. */
    kycStatus: payload.kyc?.status ?? 'unverified',
    identityVerified: payload.kyc?.status === 'verified',
  };
};

/** Split a single "Jane Williams" field into the two the API requires. */
export const splitFullName = (fullName = '') => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: '', last_name: '' };
  if (parts.length === 1) return { first_name: parts[0], last_name: parts[0] };

  return {
    first_name: parts[0],
    last_name: parts[parts.length - 1],
    other_name: parts.slice(1, -1).join(' '),
  };
};

/* -------------------------------------------------------------------------- */
/* Real implementation                                                         */
/* -------------------------------------------------------------------------- */

const realAuth = {
  async login({ email, password, remember }) {
    const { data } = await apiClient.post('/auth/login/', { email, password });

    // 2FA enabled: no tokens yet, a code has been emailed instead.
    if (!data.access) return { status: '2fa_required', email };

    authStorage.setSession({ token: data.access, refreshToken: data.refresh, remember });
    return { status: 'authenticated' };
  },

  async confirmTwoFactor({ email, code, remember }) {
    const { data } = await apiClient.post('/auth/2fa/confirm/', { email, code });
    authStorage.setSession({ token: data.access, refreshToken: data.refresh, remember });
    return { status: 'authenticated' };
  },

  /**
   * Re-send a still-pending 2FA code.
   *
   * Uses the dedicated resend endpoint rather than replaying the login call —
   * that would mean holding the password in router state just to get a new
   * code, and would re-run the password hasher for no reason.
   */
  async resendTwoFactor({ email }) {
    await apiClient.post('/auth/2fa/resend/', { email });
  },

  async signup({ firstName, lastName, email, password, phone }) {
    const { data } = await apiClient.post('/auth/register/', {
      email,
      password,
      phone,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    });

    authStorage.setSession({ token: data.access, refreshToken: data.refresh, remember: true });
    return { status: 'authenticated' };
  },

  async logout() {
    const refresh = authStorage.getRefreshToken();
    if (refresh) await apiClient.post('/auth/logout/', { refresh });
  },

  async getCurrentUser() {
    if (!authStorage.getToken()) return null;
    const { data } = await apiClient.get('/auth/profile/');
    return toAppUser(data);
  },

  /**
   * Confirm the 6-digit code emailed at registration.
   *
   * The API answers the same way for an unknown address, an already-verified
   * one and an expired code, so the screen must not try to tell them apart.
   */
  async verifyEmail({ email, code }) {
    const { data } = await apiClient.post('/auth/verify-email/', { email, code });
    return { email: data.email, emailVerified: Boolean(data.email_verified) };
  },

  /** Send a fresh code. Subject to a cooldown and a daily cap server-side. */
  async resendEmailVerification({ email }) {
    const { data } = await apiClient.post('/auth/verify-email/resend/', { email });
    return { detail: data?.detail ?? '' };
  },

  async forgotPassword({ email }) {
    await apiClient.post('/auth/password-reset/', { email });
  },

  /** `uid` and `token` come from the emailed link and travel in the path. */
  async resetPassword({ uid, token, password }) {
    await apiClient.post(`/auth/password-reset-confirm/${uid}/${token}/`, {
      new_password: password,
    });
  },

  async updateProfile(patch) {
    const body = {};
    if (patch.fullName) Object.assign(body, splitFullName(patch.fullName));
    if (patch.firstName) body.first_name = patch.firstName;
    if (patch.lastName) body.last_name = patch.lastName;

    const { data } = await apiClient.patch('/auth/profile/', body);
    return toAppUser(data);
  },
};

/* -------------------------------------------------------------------------- */
/* Mock implementation                                                         */
/* -------------------------------------------------------------------------- */

const readUsers = () => {
  const users = jsonStorage.read(USERS_KEY, null);
  if (users) return users;

  const seeded = [{ ...demoUser }];
  jsonStorage.write(USERS_KEY, seeded);
  return seeded;
};

const writeUsers = (users) => jsonStorage.write(USERS_KEY, users);

/** Mirror the real service's user shape so components can't tell them apart. */
const mockToAppUser = ({ password, ...user }) => ({
  ...user,
  firstName: user.fullName?.split(' ')[0] ?? '',
  lastName: user.fullName?.split(' ').slice(-1)[0] ?? '',
  twoFactorEnabled: false,
  kycStatus: user.identityVerified ? 'verified' : 'unverified',
});

/**
 * A fake session for mock mode.
 *
 * The user goes in too: `mockAuth.getCurrentUser()` reads the stored copy to
 * answer "who is signed in", so a session without one left the app holding a
 * token and no identity — signing in appeared to do nothing.
 */
const issueSession = (user) => ({
  token: createFakeToken({ sub: user.id, email: user.email, role: user.role }),
  refreshToken: createFakeToken({ sub: user.id, type: 'refresh' }, 60 * 60 * 24 * 7),
  user: mockToAppUser(clone(user)),
});

const mockAuth = {
  async login({ email, password, remember }) {
    await delay(700);

    const user = readUsers().find((entry) => entry.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      throw new ApiError('Incorrect email or password. Please try again.', 401);
    }

    authStorage.setSession({ ...issueSession(user), remember });
    return { status: 'authenticated' };
  },

  async confirmTwoFactor() {
    await delay(400);
    throw new ApiError('Two-factor authentication is not simulated in mock mode.', 400);
  },

  async resendTwoFactor() {
    await delay(300);
  },

  async signup({ firstName, lastName, email, phone, password }) {
    await delay(1000);

    const users = readUsers();
    if (users.some((entry) => entry.email.toLowerCase() === email.trim().toLowerCase())) {
      throw new ApiError('An account with this email already exists.', 409);
    }

    const newUser = {
      id: createId('usr'),
      fullName: [firstName, lastName].map((part) => part.trim()).filter(Boolean).join(' '),
      email: email.trim().toLowerCase(),
      phone,
      password,
      role: 'guest',
      avatar: '',
      memberSince: new Date().toISOString(),
      identityVerified: false,
    };

    writeUsers([...users, newUser]);
    authStorage.setSession({ ...issueSession(newUser), remember: true });
    return { status: 'authenticated' };
  },

  async logout() {
    await delay(250);
  },

  async getCurrentUser() {
    await delay(200);
    if (!authStorage.getToken()) return null;

    const cached = authStorage.getUser();
    if (!cached) return null;

    const user = readUsers().find((entry) => entry.id === cached.id);
    return user ? mockToAppUser(clone(user)) : cached;
  },

  async verifyEmail({ email }) {
    await delay(300);
    return { email, emailVerified: true };
  },

  async resendEmailVerification() {
    await delay(300);
    return { detail: 'Mock code sent.' };
  },

  async forgotPassword() {
    await delay(900);
  },

  async resetPassword({ password }) {
    await delay(900);

    const users = readUsers();
    const index = users.findIndex((entry) => entry.email === demoUser.email);
    if (index >= 0) {
      users[index] = { ...users[index], password };
      writeUsers(users);
    }
  },

  async updateProfile(patch) {
    await delay(600);

    const cached = authStorage.getUser();
    if (!cached) throw new ApiError('You are not signed in.', 401);

    const users = readUsers();
    const index = users.findIndex((entry) => entry.id === cached.id);
    if (index < 0) throw new ApiError('Account not found.', 404);

    users[index] = { ...users[index], ...patch };
    writeUsers(users);
    return mockToAppUser(clone(users[index]));
  },
};

const backend = env.useMockAuth ? mockAuth : realAuth;

/* -------------------------------------------------------------------------- */
/* Public API — the only surface hooks should touch                            */
/* -------------------------------------------------------------------------- */

/**
 * GDPR — consent records and data-subject requests.
 *
 * Real API only. A mocked consent record is worse than none: the point of the
 * record is that it exists on a server someone can be held to.
 *
 * Consent accepts anonymous callers (`AllowAny`), because it is captured at
 * signup and cookie-banner time, before there is a session to attach it to.
 */
const compliance = {
  /** consent_type: terms | privacy | cookies | gdpr_processing | marketing */
  async recordConsent({ consentType, granted = true }) {
    const { data } = await apiClient.post('/compliance/consent/', {
      consent_type: consentType,
      granted,
    });
    return data;
  },

  /**
   * Ask for an export, deletion or correction of your data.
   *
   * Submit-only by design here: `GET /compliance/data-requests/` is restricted
   * to staff roles, so a guest cannot read back their own requests. Until that
   * changes, the UI confirms the submission rather than promising a history it
   * cannot show.
   */
  async requestData({ requestType, notes }) {
    const { data } = await apiClient.post('/compliance/data-requests/', {
      request_type: requestType,
      notes: notes ?? '',
    });
    return { id: data.id ?? data.request_id, requestType: data.request_type, status: data.status ?? 'pending' };
  },
};

export const authService = {
  recordConsent: (payload) => compliance.recordConsent(payload),
  requestData: (payload) => compliance.requestData(payload),

  /**
   * Authenticate. Persists the session on success.
   *
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ status: 'authenticated', user: object } | { status: '2fa_required', email: string }>}
   */
  async login(credentials) {
    const result = await backend.login(credentials);
    if (result.status !== 'authenticated') return result;

    const user = await authService.getCurrentUser();
    return { status: 'authenticated', user };
  },

  /** Exchange the emailed 6-digit code for a session. */
  async confirmTwoFactor(payload) {
    await backend.confirmTwoFactor(payload);
    const user = await authService.getCurrentUser();
    return { status: 'authenticated', user };
  },

  /** Ask for a fresh code without re-authenticating. */
  resendTwoFactor: (payload) => backend.resendTwoFactor(payload),

  /** Confirm the address a guest registered with. */
  verifyEmail: (payload) => backend.verifyEmail(payload),
  resendEmailVerification: (payload) => backend.resendEmailVerification(payload),

  /** Create an account. The API signs the new guest straight in. */
  async signup(userData) {
    await backend.signup(userData);
    const user = await authService.getCurrentUser();
    return { status: 'authenticated', user };
  },

  /** Clear the session locally even if the network call fails. */
  async logout() {
    try {
      await backend.logout();
    } catch {
      // An already-blacklisted refresh token 400s. The session is over either
      // way, so never let that block the user from signing out.
    } finally {
      authStorage.clear();
    }
    return { success: true };
  },

  /** @returns {Promise<object|null>} the signed-in guest, or null. */
  async getCurrentUser() {
    const user = await backend.getCurrentUser();
    authStorage.setUser(user);
    return user;
  },

  forgotPassword: (payload) => backend.forgotPassword(payload),
  resetPassword: (payload) => backend.resetPassword(payload),
  updateProfile: (payload) => backend.updateProfile(payload),

  /** Synchronous cached read — lets the first paint skip the loading state. */
  getCachedUser: () => authStorage.getUser(),
};
