import { differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';

const CURRENCY_LOCALE = {
  GBP: 'en-GB',
  USD: 'en-US',
  EUR: 'de-DE',
  NGN: 'en-NG',
  AED: 'en-AE',
};

/**
 * Format a monetary amount using the currency's native locale.
 *
 * @param {number} amount
 * @param {string} [currency='GBP'] ISO-4217 code.
 * @param {{ compact?: boolean }} [options]
 */
export const formatCurrency = (amount, currency = 'GBP', options = {}) => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '—';

  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? 'en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    notation: options.compact ? 'compact' : 'standard',
  }).format(amount);
};

/** Coerce ISO strings / Date objects / timestamps into a valid Date or null. */
const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(date) ? date : null;
};

/**
 * @param {string | Date | number | null | undefined} value
 * @param {string} [pattern='dd MMM yyyy']
 */
export const formatDate = (value, pattern = 'dd MMM yyyy') => {
  const date = toDate(value);
  return date ? format(date, pattern) : '—';
};

/** "20 Of May" — the long-form label used on the booking review screen. */
export const formatBookingDate = (value) => {
  const date = toDate(value);
  return date ? `${format(date, 'd')} Of ${format(date, 'MMMM')}` : '—';
};

/** Inclusive-of-check-in, exclusive-of-check-out night count. */
export const nightsBetween = (checkIn, checkOut) => {
  const start = toDate(checkIn);
  const end = toDate(checkOut);
  if (!start || !end) return 0;
  return Math.max(0, differenceInCalendarDays(end, start));
};

/** 1200 -> "1.2K", 100000 -> "100K" */
export const formatCompactNumber = (value) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value ?? 0);

/** "3 Beds" / "1 Bed" */
export const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

/** Two-letter avatar fallback: "Jane Williams" -> "JW". */
export const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
