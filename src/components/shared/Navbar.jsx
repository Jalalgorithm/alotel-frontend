import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Heart, LayoutDashboard, LogOut, Menu, User, X } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { paths } from '@/routes/paths';
import { Button } from '@/components/ui/Button';
import { Logo } from './Logo';
import { useAuth, useLogout } from '@/features/auth';
import { useUIStore } from '@/stores/uiStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { getInitials } from '@/utils/format';
import { useClickOutside } from '@/hooks/useClickOutside';
import { NotificationBell } from '@/features/notifications';

const NAV_LINKS = [
  { label: 'Home', to: paths.home, end: true },
  { label: 'Properties', to: paths.properties },
  { label: 'Spaces', to: paths.spaces },
  { label: 'Destination', to: paths.destinations },
  { label: 'About Us', to: paths.about },
  { label: 'Support', to: paths.support },
];

/** Signed-in avatar with a small dropdown (dashboard / sign out). */
const AccountMenu = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useClickOutside(() => setIsOpen(false), isOpen);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 transition-colors hover:border-brand-200"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-brand-700 text-[11px] font-semibold text-white">
          {getInitials(user.fullName)}
        </span>
        <span className="hidden text-[13px] font-medium sm:inline">{user.fullName.split(' ')[0]}</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="animate-fade-up absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-surface shadow-raised"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-medium">{user.fullName}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>

          <Link
            to={paths.dashboard}
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors hover:bg-brand-50"
          >
            <LayoutDashboard className="size-4 text-ink-muted" aria-hidden="true" />
            Dashboard
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-danger transition-colors hover:bg-danger/5"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Primary site header.
 *
 * `transparent` renders it over a hero image (landing page); it becomes solid
 * on scroll via the wrapper in `SiteLayout`.
 */
export const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { logout, isPending } = useLogout();
  const isMobileNavOpen = useUIStore((state) => state.isMobileNavOpen);
  const toggleMobileNav = useUIStore((state) => state.toggleMobileNav);
  const closeMobileNav = useUIStore((state) => state.closeMobileNav);
  const favoriteCount = useFavoritesStore((state) => state.ids.length);

  const handleLogout = () => logout(undefined, { onSuccess: () => navigate(paths.home) });

  const linkClass = ({ isActive }) =>
    cn(
      'text-[13px] font-medium transition-colors',
      isActive ? 'text-brand-600' : 'text-ink-soft hover:text-brand-600',
    );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-sm">
      <div className="shell flex h-16 items-center justify-between gap-6">
        <Logo />

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <>
              <Link
                to={paths.properties}
                aria-label={`Saved properties (${favoriteCount})`}
                className="relative hidden rounded-full p-2 text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700 sm:block"
              >
                <Heart className="size-4" />
                {favoriteCount > 0 && (
                  <span className="absolute right-1 top-1 size-1.5 rounded-full bg-brand-600" />
                )}
              </Link>
              {/* Was a decorative bell that did nothing; now the real inbox. */}
              <div className="hidden sm:block">
                <NotificationBell />
              </div>
            </>
          )}

          {isAuthenticated ? (
            <AccountMenu user={user} onLogout={handleLogout} />
          ) : (
            <Button to={paths.login} size="sm" className="hidden sm:inline-flex">
              Sign In
            </Button>
          )}

          <button
            type="button"
            onClick={toggleMobileNav}
            aria-label={isMobileNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileNavOpen}
            className="rounded-md p-2 text-ink transition-colors hover:bg-black/5 lg:hidden"
          >
            {isMobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {isMobileNavOpen && (
        <nav className="animate-fade-up border-t border-line bg-surface lg:hidden" aria-label="Mobile">
          <div className="shell flex flex-col py-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={closeMobileNav}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-black/5',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
              {isAuthenticated ? (
                <>
                  <Button to={paths.dashboard} variant="secondary" onClick={closeMobileNav} fullWidth>
                    Dashboard
                  </Button>
                  <Button variant="muted" isLoading={isPending} onClick={handleLogout} fullWidth>
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button to={paths.login} onClick={closeMobileNav} fullWidth leftIcon={<User className="size-4" />}>
                    Sign In
                  </Button>
                  <Button to={paths.signup} variant="secondary" onClick={closeMobileNav} fullWidth>
                    Create account
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};
