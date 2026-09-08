import { AppProviders } from '@/providers';
import { AppRoutes } from '@/routes';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { Toaster } from '@/components/shared/Toaster';
import { AccessibilityWidget } from '@/components/shared/AccessibilityWidget';

/** Application root: providers, global chrome, and the route table. */
export const App = () => (
  <AppProviders>
    <ScrollToTop />
    <AppRoutes />
    <Toaster />
    {/* Mounted at the root, not per layout: the setting has to survive a move
        between the marketing site, the dashboard and the auth screens. */}
    <AccessibilityWidget />
  </AppProviders>
);
