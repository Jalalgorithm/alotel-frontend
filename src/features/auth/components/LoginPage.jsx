import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';
import { AuthLayout } from './AuthLayout';
import { AuthDivider, SocialAuthButtons } from './SocialAuthButtons';
import { useLogin } from '../hooks/useLogin';
import { loginSchema } from '@/utils/validators';
import { paths } from '@/routes/paths';
import { env } from '@/lib/env';
import { getErrorMessage } from '@/utils/errors';
import { demoUser } from '@/lib/mock/data';
import HERO_IMAGE from '@/assets/images/auth-login.jpg';


/**
 * Credentials shown in the dev-only hint. Mock mode uses the seeded fixture;
 * live mode uses the guest account created by the backend seed script.
 */
const DEV_ACCOUNT = env.useMockAuth
  ? { email: demoUser.email, password: demoUser.password }
  : { email: 'guest@alotelspaces.com', password: 'Password123' };

/** "Welcome back" — the sign-in screen. */
export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isPending, error } = useLogin();

  // Where the guard sent us from, so we can return there after signing in.
  const redirectTo = location.state?.from ?? paths.dashboard;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  });

  const onSubmit = (values) =>
    login(
      { email: values.email, password: values.password },
      {
        onSuccess: (result) => {
          // 2FA accounts get a code instead of tokens. Carry the password
          // through so the code screen can re-send without a second sign-in.
          if (result.status === '2fa_required') {
            navigate(paths.twoFactor, {
              state: { email: result.email, password: values.password, from: redirectTo },
            });
            return;
          }
          navigate(redirectTo, { replace: true });
        },
      },
    );

  return (
    <AuthLayout image={HERO_IMAGE} imageAlt="Bedroom in an Alotel Spaces residence">
      <h1 className="font-display text-[26px] font-bold">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Login to access and manage your bookings.</p>

      {env.isDev && (
        <Alert variant="info" className="mt-5">
          {env.useMockAuth ? 'Mock account' : 'Dev account'} —{' '}
          <span className="font-medium text-ink">{DEV_ACCOUNT.email}</span> /{' '}
          <span className="font-medium text-ink">{DEV_ACCOUNT.password}</span>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between gap-3">
          <Checkbox label="Remember me" containerClassName="w-auto" {...register('remember')} />
          <Link
            to={paths.forgotPassword}
            className="font-display text-[13px] font-semibold italic text-brand-700 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {error && <Alert variant="error">{getErrorMessage(error, 'We could not sign you in.')}</Alert>}

        <Button type="submit" italic size="lg" fullWidth isLoading={isPending}>
          {isPending ? 'Signing in…' : 'Login'}
        </Button>
      </form>

      <AuthDivider />
      <SocialAuthButtons />

      <p className="mt-6 flex items-center justify-between text-[13px] text-ink-soft">
        Don&apos;t have an account?
        <Link to={paths.signup} className="font-display font-semibold italic text-brand-700 hover:underline">
          Create account
        </Link>
      </p>
    </AuthLayout>
  );
};
