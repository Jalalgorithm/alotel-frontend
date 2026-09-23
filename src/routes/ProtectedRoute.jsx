import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Loading } from '@/components/shared/Loading';
import { paths } from './paths';

/**
 * Route guard for authenticated areas.
 *
 * While the session is still being confirmed, a browser that holds a stored
 * session paints the page optimistically — otherwise every refresh on
 * /dashboard would flash a loader or bounce a signed-in guest to the login
 * screen. That is presentation only: every figure on the page comes from the
 * API, which rejects a forged session, and the moment the check settles empty
 * the guard redirects.
 *
 * The attempted URL is passed along in router state so `LoginPage` can return
 * the guest to where they were heading.
 *
 * A signed-in guest whose email address is still unconfirmed is sent to the
 * confirmation screen instead. Registration emails a code, the API refuses
 * payment without it, and an account nobody has proved reaches booking
 * confirmations, contracts and signing links — so it is asked for once,
 * up front, rather than surfacing later as a failed payment. Only an explicit
 * `false` counts: a profile payload without the field must not lock anyone out.
 */
export const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const { user, isAuthenticated, isInitialising, hasCachedSession } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    if (user?.emailVerified === false) {
      return (
        <Navigate
          to={paths.verifyEmail}
          replace
          state={{ email: user.email, from: location.pathname + location.search }}
        />
      );
    }
    return children ?? <Outlet />;
  }

  if (isInitialising) {
    if (hasCachedSession) return children ?? <Outlet />;
    return <Loading fullScreen label="Checking your session…" />;
  }

  return <Navigate to={redirectTo} replace state={{ from: location.pathname + location.search }} />;
};
