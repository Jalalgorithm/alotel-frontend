import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ErrorBoundary } from './ErrorBoundary';

/** Shell for every public/marketing route: header, page outlet, footer. */
export const SiteLayout = () => (
  <div className="flex min-h-screen flex-col">
    <Navbar />

    <main className="flex-1">
      {/* A crash in one page keeps the chrome intact and offers a retry. */}
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </main>

    <Footer />
  </div>
);
