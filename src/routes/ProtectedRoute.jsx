import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Loading } from '@/components/shared/Loading';

/**
 * Route guard for authenticated areas.
 *
 * While the session is still being confirmed we render a loader rather than
 * redirecting — otherwise a refresh on /dashboard would bounce a signed-in
 * guest to the login screen before the check completes.
 *
 * The attempted URL is passed along in router state so `LoginPage` can return
 * the guest to where they were heading.
 */
export const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const { isAuthenticated, isInitialising } = useAuth();
  const location = useLocation();

  if (isInitialising) return <Loading fullScreen label="Checking your session…" />;

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname + location.search }} />;
  }

  return children ?? <Outlet />;
};
