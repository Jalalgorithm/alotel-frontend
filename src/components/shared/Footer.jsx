import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import { paths } from '@/routes/paths';
import { Logo } from './Logo';
import { toast } from '@/stores/uiStore';

const FOOTER_COLUMNS = [
  {
    title: 'EXPLORE',
    links: [
      { label: 'Featured Listings', to: paths.properties },
      { label: 'Corporate Long-Stay', to: paths.properties },
      { label: 'Property Concierge', to: paths.support },
      { label: 'Destination Guides', to: paths.destinations },
    ],
  },
  {
    title: 'MANAGEMENT',
    links: [
      { label: 'List Your Property', to: paths.support },
      { label: 'Admin Portal', to: paths.login },
      { label: 'KYC Documentation', to: paths.support },
      { label: 'Compliance Hub', to: paths.about },
    ],
  },
  {
    title: 'Legal & Regional',
    links: [
      { label: 'Privacy Policy(GDPR)', to: paths.support },
      { label: 'Success Stories(NDPR)', to: paths.about },
      { label: 'Terms of Service', to: paths.support },
      { label: 'Cookie Settings', to: paths.support },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: paths.about },
      { label: 'Our Story', to: paths.about },
      { label: 'Careers', to: paths.about },
      { label: 'Press', to: paths.about },
      { label: 'Partners', to: paths.about },
    ],
  },
];

const SOCIALS = [
  { label: 'LinkedIn', Icon: Linkedin },
  { label: 'Twitter', Icon: Twitter },
  { label: 'Instagram', Icon: Instagram },
  { label: 'Facebook', Icon: Facebook },
];

export const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (event) => {
    event.preventDefault();
    if (!email) return;
    // Newsletter sign-up is a display-only flow until the marketing API exists.
    toast.success('You are subscribed', `We'll send exclusive offers to ${email}.`);
    setEmail('');
  };

  return (
    <footer className="bg-footer text-white/80">
      <div className="shell py-12">
        {/* Newsletter */}
        <div className="border-b border-white/10 pb-10">
          <h2 className="text-[15px] font-semibold text-white">Stay updated with exclusive offers</h2>

          <form onSubmit={handleSubscribe} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            {/* `flex-1` must not apply while the form is a column: in that
                direction it sets the flex-basis on the *height* and collapses
                the field. It only kicks in once the row layout takes over. */}
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email address"
              className="h-11 w-full rounded-lg bg-white px-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500 sm:flex-1"
            />
            <button
              type="submit"
              className="h-11 shrink-0 rounded-lg bg-brand-600 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-1 gap-10 py-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:pr-8">
            <Logo tone="light" />
            <p className="mt-4 max-w-xs text-[13px] leading-6 text-white/60">
              Redefining luxury property management with a focus on heritage, compliance, and exceptional
              guest experiences globally.
            </p>

            <div className="mt-5 flex gap-2.5">
              {SOCIALS.map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex size-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-brand-600"
                >
                  <Icon className="size-3.5 text-white" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-white">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="inline-block py-1 text-[13px] text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal strip */}
        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-[12px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Alotel Spaces. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to={paths.support} className="py-1 transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link to={paths.support} className="py-1 transition-colors hover:text-white">
              Terms of Service
            </Link>
            <Link to={paths.support} className="py-1 transition-colors hover:text-white">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
