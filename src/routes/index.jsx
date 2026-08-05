import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { SiteLayout } from '@/components/shared/SiteLayout';
import { Loading } from '@/components/shared/Loading';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { NotFoundPage } from './NotFoundPage';
import { ComingSoonPage } from './ComingSoonPage';
import { paths } from './paths';

/**
 * Route table.
 *
 * Screens are code-split per feature so the landing page ships without the
 * booking wizard, the dashboard, or the auth forms.
 */
const HomePage = lazy(() => import('@/features/home').then((m) => ({ default: m.HomePage })));
const PropertiesPage = lazy(() => import('@/features/properties').then((m) => ({ default: m.PropertiesPage })));
const PropertyDetailPage = lazy(() =>
  import('@/features/properties').then((m) => ({ default: m.PropertyDetailPage })),
);
const SearchPage = lazy(() => import('@/features/properties').then((m) => ({ default: m.SearchPage })));
const LoginPage = lazy(() => import('@/features/auth').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('@/features/auth').then((m) => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('@/features/auth').then((m) => ({ default: m.ResetPasswordPage })),
);
const TwoFactorPage = lazy(() => import('@/features/auth').then((m) => ({ default: m.TwoFactorPage })));
const DashboardPage = lazy(() => import('@/features/dashboard').then((m) => ({ default: m.DashboardPage })));
const BookingPage = lazy(() => import('@/features/booking').then((m) => ({ default: m.BookingPage })));
const BookingSuccessPage = lazy(() =>
  import('@/features/booking').then((m) => ({ default: m.BookingSuccessPage })),
);
const PaymentCancelledPage = lazy(() =>
  import('@/features/booking').then((m) => ({ default: m.PaymentCancelledPage })),
);

export const AppRoutes = () => (
  <Suspense fallback={<Loading fullScreen />}>
    <Routes>
      {/* Public site — header + footer chrome */}
      <Route element={<SiteLayout />}>
        <Route path={paths.home} element={<HomePage />} />
        <Route path={paths.properties} element={<PropertiesPage />} />
        <Route path={paths.propertyDetail()} element={<PropertyDetailPage />} />
        <Route path={paths.search} element={<SearchPage />} />

        <Route path={paths.destinations} element={<ComingSoonPage title="Destination guides" />} />
        <Route path={paths.about} element={<ComingSoonPage title="About Alotel Spaces" />} />
        <Route path={paths.support} element={<ComingSoonPage title="Support & policies" />} />

        {/* Authenticated area, inside the site chrome */}
        <Route element={<ProtectedRoute />}>
          <Route path={paths.dashboard} element={<DashboardPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Auth screens — full-bleed split layout, no site chrome */}
      <Route element={<PublicOnlyRoute />}>
        <Route path={paths.login} element={<LoginPage />} />
        <Route path={paths.signup} element={<SignupPage />} />
        <Route path={paths.twoFactor} element={<TwoFactorPage />} />
        <Route path={paths.forgotPassword} element={<ForgotPasswordPage />} />
        {/* Path shape is dictated by the reset link the API emails */}
        <Route path={paths.resetPassword()} element={<ResetPasswordPage />} />
      </Route>

      {/* Booking wizard — protected, and also chrome-free */}
      <Route
        path={paths.booking()}
        element={
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        }
      />

      {/*
        Where the payment providers return the guest. The paths are fixed by
        the backend's PAYMENT_SUCCESS_URL / PAYMENT_CANCEL_URL — changing them
        here without changing those would strand guests after checkout.
      */}
      <Route
        path={paths.paymentSuccess}
        element={
          <ProtectedRoute>
            <BookingSuccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={paths.paymentCancelled}
        element={
          <ProtectedRoute>
            <PaymentCancelledPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  </Suspense>
);
