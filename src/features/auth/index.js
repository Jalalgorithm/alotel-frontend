/**
 * Public API of the auth feature.
 * Nothing outside this folder should import from its internals.
 */

// Screens (mounted by the router)
export { LoginPage } from './components/LoginPage';
export { SignupPage } from './components/SignupPage';
export { ForgotPasswordPage } from './components/ForgotPasswordPage';
export { ResetPasswordPage } from './components/ResetPasswordPage';
export { TwoFactorPage } from './components/TwoFactorPage';
export { AuthLayout } from './components/AuthLayout';

// Hooks
export { useAuth } from './hooks/useAuth';
export { useCurrentUser } from './hooks/useCurrentUser';
export { useLogin, useConfirmTwoFactor } from './hooks/useLogin';
export { useSignup } from './hooks/useSignup';
export { useLogout } from './hooks/useLogout';
export { useForgotPassword, useResetPassword } from './hooks/usePasswordRecovery';

// Service — exposed so other features can prefill guest details from the session.
export { authService } from './services/authService';
