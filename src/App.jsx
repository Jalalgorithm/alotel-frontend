import { AppProviders } from '@/providers';
import { AppRoutes } from '@/routes';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { Toaster } from '@/components/shared/Toaster';

/** Application root: providers, global chrome, and the route table. */
export const App = () => (
  <AppProviders>
    <ScrollToTop />
    <AppRoutes />
    <Toaster />
  </AppProviders>
);
