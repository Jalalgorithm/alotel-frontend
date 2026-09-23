import { z } from 'zod';

/**
 * Turn off Zod's JIT validator compilation.
 *
 * Zod speeds up validation by compiling schemas with `new Function(...)`, and
 * decides whether it can by trying one inside a try/catch. Under a
 * Content-Security-Policy without `'unsafe-eval'` that attempt is refused:
 * Zod falls back correctly, but the browser still reports a violation on every
 * page load, which buries real violations in noise.
 *
 * `jitless` skips the probe and the compilation. The forms here validate a
 * handful of fields on submit, so the interpreted path costs nothing
 * measurable — and it means the policy never has to allow `'unsafe-eval'`.
 *
 * Imported for its side effect by `main.jsx`, before any schema is built.
 */
z.config({ jitless: true });
