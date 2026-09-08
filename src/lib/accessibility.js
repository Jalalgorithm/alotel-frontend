/**
 * Guest-facing accessibility preferences.
 *
 * Three settings, each applied as an attribute on <html> so the stylesheet does
 * the work and no component has to know a preference exists. They are read back
 * synchronously on boot — before React paints — because a guest who needs large
 * text should not watch the page render small first and then jump.
 *
 * Stored per-browser in localStorage rather than on the profile: the person who
 * needs this may not be signed in, and a setting that only works after login is
 * not an accessibility setting.
 */

const KEY = 'alotel.a11y';

export const TEXT_SIZES = [
  { id: 'normal', label: 'Normal' },
  { id: 'large', label: 'Large' },
  { id: 'xlarge', label: 'X-Large' },
];

const DEFAULTS = {
  textSize: 'normal',
  highContrast: false,
  /**
   * Undefined rather than false, so an unset preference falls through to the
   * operating system's own `prefers-reduced-motion` instead of overriding it.
   * Only an explicit choice here is written to the DOM.
   */
  reduceMotion: null,
};

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      textSize: TEXT_SIZES.some((size) => size.id === parsed.textSize) ? parsed.textSize : 'normal',
      highContrast: Boolean(parsed.highContrast),
      reduceMotion: typeof parsed.reduceMotion === 'boolean' ? parsed.reduceMotion : null,
    };
  } catch {
    /* Private browsing, blocked storage, or corrupt JSON — the page still works. */
    return { ...DEFAULTS };
  }
};

/** Whether motion should be reduced right now, preference or system. */
export const prefersReducedMotion = (settings) =>
  settings.reduceMotion ??
  (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

export const applyAccessibility = (settings) => {
  const root = document.documentElement;

  root.dataset.textSize = settings.textSize;

  if (settings.highContrast) root.dataset.contrast = 'high';
  else delete root.dataset.contrast;

  /* Only an explicit choice is stamped; `null` leaves the media query in charge. */
  if (settings.reduceMotion === true) root.dataset.motion = 'reduced';
  else if (settings.reduceMotion === false) root.dataset.motion = 'full';
  else delete root.dataset.motion;
};

export const loadAccessibility = () => {
  const settings = read();
  applyAccessibility(settings);
  return settings;
};

export const saveAccessibility = (settings) => {
  applyAccessibility(settings);
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* Nothing to do — the setting still applies for this page view. */
  }
};
