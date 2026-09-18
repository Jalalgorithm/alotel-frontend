/**
 * Dialling codes for the phone field.
 *
 * The markets Alotel Spaces operates in come first, because that is who is
 * signing up; the rest follow alphabetically. Each entry carries the ISO 3166
 * alpha-2 code (what the browser's locale gives us) and the dialling code.
 *
 * `example` is a real national number format for that country, shown as the
 * field's placeholder so a guest can see the shape expected of them.
 */

const entry = (iso, name, dial, example) => ({ iso, name, dial, example });

/** Where we operate — these sit at the top of the list. */
export const MARKET_ISO = ['GB', 'NG', 'ES', 'AE', 'US', 'FR'];

export const COUNTRIES = [
  entry('GB', 'United Kingdom', '+44', '7400 123456'),
  entry('NG', 'Nigeria', '+234', '810 000 0000'),
  entry('ES', 'Spain', '+34', '612 34 56 78'),
  entry('AE', 'United Arab Emirates', '+971', '50 123 4567'),
  entry('US', 'United States', '+1', '(555) 000-0000'),
  entry('FR', 'France', '+33', '6 12 34 56 78'),

  entry('AU', 'Australia', '+61', '412 345 678'),
  entry('AT', 'Austria', '+43', '664 123456'),
  entry('BH', 'Bahrain', '+973', '3600 1234'),
  entry('BE', 'Belgium', '+32', '470 12 34 56'),
  entry('BR', 'Brazil', '+55', '11 91234-5678'),
  entry('CA', 'Canada', '+1', '(555) 000-0000'),
  entry('CN', 'China', '+86', '131 2345 6789'),
  entry('HR', 'Croatia', '+385', '91 234 5678'),
  entry('CY', 'Cyprus', '+357', '96 123456'),
  entry('CZ', 'Czechia', '+420', '601 123 456'),
  entry('DK', 'Denmark', '+45', '32 12 34 56'),
  entry('EG', 'Egypt', '+20', '100 123 4567'),
  entry('ET', 'Ethiopia', '+251', '91 123 4567'),
  entry('FI', 'Finland', '+358', '41 2345678'),
  entry('DE', 'Germany', '+49', '1512 3456789'),
  entry('GH', 'Ghana', '+233', '23 123 4567'),
  entry('GR', 'Greece', '+30', '691 234 5678'),
  entry('HK', 'Hong Kong', '+852', '5123 4567'),
  entry('HU', 'Hungary', '+36', '20 123 4567'),
  entry('IN', 'India', '+91', '81234 56789'),
  entry('ID', 'Indonesia', '+62', '812 345 678'),
  entry('IE', 'Ireland', '+353', '85 012 3456'),
  entry('IL', 'Israel', '+972', '50 123 4567'),
  entry('IT', 'Italy', '+39', '312 345 6789'),
  entry('JP', 'Japan', '+81', '90 1234 5678'),
  entry('JO', 'Jordan', '+962', '7 9012 3456'),
  entry('KE', 'Kenya', '+254', '712 123456'),
  entry('KW', 'Kuwait', '+965', '500 12345'),
  entry('LU', 'Luxembourg', '+352', '628 123 456'),
  entry('MY', 'Malaysia', '+60', '12-345 6789'),
  entry('MT', 'Malta', '+356', '9696 1234'),
  entry('MX', 'Mexico', '+52', '222 123 4567'),
  entry('MA', 'Morocco', '+212', '650 123456'),
  entry('NL', 'Netherlands', '+31', '6 12345678'),
  entry('NZ', 'New Zealand', '+64', '21 123 4567'),
  entry('NO', 'Norway', '+47', '406 12 345'),
  entry('OM', 'Oman', '+968', '9212 3456'),
  entry('PK', 'Pakistan', '+92', '301 2345678'),
  entry('PH', 'Philippines', '+63', '905 123 4567'),
  entry('PL', 'Poland', '+48', '512 345 678'),
  entry('PT', 'Portugal', '+351', '912 345 678'),
  entry('QA', 'Qatar', '+974', '3312 3456'),
  entry('RO', 'Romania', '+40', '712 345 678'),
  entry('RW', 'Rwanda', '+250', '78 123 4567'),
  entry('SA', 'Saudi Arabia', '+966', '51 234 5678'),
  entry('SN', 'Senegal', '+221', '70 123 45 67'),
  entry('SG', 'Singapore', '+65', '8123 4567'),
  entry('ZA', 'South Africa', '+27', '71 123 4567'),
  entry('KR', 'South Korea', '+82', '10 1234 5678'),
  entry('SE', 'Sweden', '+46', '70 123 45 67'),
  entry('CH', 'Switzerland', '+41', '78 123 45 67'),
  entry('TZ', 'Tanzania', '+255', '752 123 456'),
  entry('TH', 'Thailand', '+66', '81 234 5678'),
  entry('TN', 'Tunisia', '+216', '20 123 456'),
  entry('TR', 'Türkiye', '+90', '501 234 56 78'),
  entry('UG', 'Uganda', '+256', '712 345678'),
  entry('VN', 'Vietnam', '+84', '91 234 56 78'),
  entry('ZM', 'Zambia', '+260', '95 5123456'),
  entry('ZW', 'Zimbabwe', '+263', '71 234 5678'),
];

const BY_ISO = new Map(COUNTRIES.map((country) => [country.iso, country]));

export const countryByIso = (iso) => BY_ISO.get(String(iso ?? '').toUpperCase()) ?? null;

/**
 * The country to start on, from the browser's own locale (`en-NG` → NG).
 * Falls back to the UK, the largest market, when the locale carries no region
 * or names a country we do not list.
 */
export const defaultCountry = (fallback = 'GB') => {
  const locales = typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language];

  for (const locale of locales) {
    if (!locale) continue;
    /* Intl gives the region for both `en-NG` and `en-Latn-NG`. */
    let region = null;
    try {
      region = new Intl.Locale(locale).region;
    } catch {
      region = locale.split('-')[1];
    }
    const match = countryByIso(region);
    if (match) return match;
  }

  return countryByIso(fallback) ?? COUNTRIES[0];
};

/**
 * Split an E.164 number back into a country and the national part, so a saved
 * number reopens on the country it was entered with. The longest dialling code
 * wins: +1 must not swallow +1868, and +2 must not shadow +234.
 */
export const splitPhone = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw.startsWith('+')) return { country: null, national: raw };

  const digits = raw.replace(/[^\d+]/g, '');
  const matches = COUNTRIES.filter((country) => digits.startsWith(country.dial)).sort(
    (a, b) => b.dial.length - a.dial.length,
  );
  const country = matches[0];
  if (!country) return { country: null, national: raw };

  /* Several countries share +1; the first listed is the sensible default. */
  return { country, national: digits.slice(country.dial.length) };
};

/** `+44` + `7400 123456` → `+447400123456`, which is what the API stores. */
export const toE164 = (dial, national) => {
  const digits = String(national ?? '').replace(/\D/g, '');
  if (!digits) return '';
  /* A guest who types their trunk prefix (07400…) means the number without it. */
  const trimmed = digits.replace(/^0+/, '');
  return `${dial}${trimmed}`;
};
