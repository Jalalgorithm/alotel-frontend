/**
 * Strip secrets out of anything on its way to a log.
 *
 * An axios error carries the whole request on it: `config.headers` holds the
 * bearer token, and `config.data` holds whatever was posted — which, for a
 * failed sign-in, is the guest's password. Logging the error object therefore
 * writes both into the browser console, and into whatever telemetry sink is
 * wired up later.
 *
 * This is an allowlist, not a blocklist: the axios branch names the handful of
 * fields that are safe rather than trying to scrub the ones that are not.
 * Blocklists lose to the next field someone adds.
 */

const SENSITIVE_KEY = /pass|token|secret|authorization|auth|refresh|access|code|otp|card|cvv|iban|ssn|api[-_]?key/i;

/** Query strings carry reset tokens and verification codes; the path does not. */
const pathOnly = (url) => {
  if (typeof url !== 'string') return undefined;
  const [path] = url.split('?');
  return path;
};

/**
 * A plain object with sensitive values replaced. Depth-capped and cycle-safe,
 * because error payloads are arbitrary shapes from the network.
 */
export const redactObject = (value, depth = 0, seen = new WeakSet()) => {
  if (value === null || typeof value !== 'object') return value;
  if (depth >= 4) return '[depth limit]';
  if (seen.has(value)) return '[circular]';
  seen.add(value);

  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redactObject(item, depth + 1, seen));

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEY.test(key) ? '[redacted]' : redactObject(entry, depth + 1, seen),
    ]),
  );
};

/**
 * A safe summary of an error, for logging.
 *
 * Never copies headers or request bodies. Response data is passed through the
 * redactor rather than dropped, because the server's own message is usually
 * the only clue worth having.
 */
export const redactError = (error) => {
  if (!error || typeof error !== 'object') return { message: String(error) };

  const summary = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  const response = error.response;
  const config = error.config;

  if (response || config) {
    summary.status = response?.status;
    summary.method = config?.method;
    summary.url = pathOnly(config?.url);
    if (response?.data !== undefined) summary.responseData = redactObject(response.data);
  }

  return summary;
};
