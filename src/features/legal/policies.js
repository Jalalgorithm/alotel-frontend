import { env } from '@/lib/env';
import { paths } from '@/routes/paths';

/**
 * The site's legal pages, in one registry.
 *
 * Each entry pairs a route with the Termageddon policy key that fills it. Keys
 * come from the environment rather than source: they differ per Termageddon
 * account, and keeping them configurable means staging and production can point
 * at different drafts without a code change.
 *
 * A missing key is not an error — the page renders an honest "not published
 * yet" panel instead. That way the routes and footer links can ship before the
 * policies are finalised, rather than pointing at a dead end.
 *
 * Termageddon publishes each policy separately; add the corresponding key and
 * the page fills itself in.
 */
export const POLICIES = {
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    navLabel: 'Privacy',
    path: paths.privacy,
    key: env.termageddon.privacy,
    summary:
      'What personal data we collect when you browse or book, why we hold it, how long we keep it, and the rights you have over it.',
  },
  terms: {
    id: 'terms',
    title: 'Terms of Service',
    navLabel: 'Terms',
    path: paths.terms,
    key: env.termageddon.terms,
    summary: 'The agreement between you and Alotel Spaces when you use this site or book a stay through it.',
  },
  cookies: {
    id: 'cookies',
    title: 'Cookie Policy',
    navLabel: 'Cookies',
    path: paths.cookies,
    key: env.termageddon.cookies,
    summary: 'The cookies and similar technologies this site uses, what each one is for, and how to control them.',
  },
  disclaimer: {
    id: 'disclaimer',
    title: 'Disclaimer',
    navLabel: 'Disclaimer',
    path: paths.disclaimer,
    key: env.termageddon.disclaimer,
    summary: 'The limits of the information published on this site, including property descriptions and imagery.',
  },
};
