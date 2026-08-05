import { env } from '../env';

/**
 * Helpers shared by every mocked service.
 * They exist purely to make the mock layer *feel* like a network boundary.
 */

/** Resolve after a realistic amount of latency. */
export const delay = (ms = env.mockLatency) => new Promise((resolve) => setTimeout(resolve, ms));

/** Deep clone so callers can never mutate the in-memory "database". */
export const clone = (value) =>
  typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));

/** Reasonably unique id without pulling in a uuid dependency. */
export const createId = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/**
 * Build a fake, structurally-valid JWT (header.payload.signature).
 * It is *not* signed — it only needs to look and decode like the real thing.
 */
export const createFakeToken = (payload, ttlSeconds = 60 * 60) => {
  const encode = (value) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const issuedAt = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: issuedAt, exp: issuedAt + ttlSeconds };

  return `${encode(header)}.${encode(body)}.${btoa(`mock-signature-${issuedAt}`).replace(/=+$/, '')}`;
};
