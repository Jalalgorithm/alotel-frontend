import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Loading } from '@/components/shared/Loading';
import { paths } from './paths';

/**
 * The mirror of `ProtectedRoute`: keeps signed-in guests off the login and
 * signup screens.
 *
 * It has to send them to the same place `LoginPage` would. The moment the auth
 * store flips, this guard re-renders and its `<Navigate>` beats the login
 * form's own `navigate(redirectTo)` — so if it ignored `state.from`, every
 * "sign in to finish what you were doing" flow would silently drop the guest on
 * the dashboard instead of the page that sent them here.
 */
export const PublicOnlyRoute = ({ children, redirectTo }) => {
  const { isAuthenticated, isInitialising } = useAuth();
  const location = useLocation();

  if (isInitialising) return <Loading fullScreen label="Checking your session…" />;

  if (isAuthenticated) {
    const target = redirectTo ?? location.state?.from ?? paths.dashboard;
    return <Navigate to={target} replace />;
  }

  return children ?? <Outlet />;
};
