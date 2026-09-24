import { AppProviders } from '@/providers';
import { AppRoutes } from '@/routes';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { Toaster } from '@/components/shared/Toaster';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { AccessibilityWidget } from '@/components/shared/AccessibilityWidget';

/** Application root: providers, global chrome, and the route table. */
export const App = () => (
  <AppProviders>
    <ScrollToTop />
    {/* Above the routes so it sits at the very top of every screen, including
        the ones with no site chrome: sign-in, the wizard, the contract step. */}
    <ErrorBanner />
    <AppRoutes />
    <Toaster />
    {/* Mounted at the root, not per layout: the setting has to survive a move
        between the marketing site, the dashboard and the auth screens. */}
    <AccessibilityWidget />
  </AppProviders>
);
