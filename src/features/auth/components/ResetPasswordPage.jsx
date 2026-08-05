import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { AuthLayout } from './AuthLayout';
import { useResetPassword } from '../hooks/usePasswordRecovery';
import { resetPasswordSchema } from '@/utils/validators';
import { getErrorMessage } from '@/utils/errors';
import { paths } from '@/routes/paths';
import HERO_IMAGE from '@/assets/images/auth-reset.jpg';


/**
 * "Reset your password".
 *
 * `uid` and `token` come from the path, because that is the shape of the link
 * the API emails: `{FRONTEND_URL}/password-reset/{uid}/{token}/`.
 */
export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { uid, token } = useParams();
  const { resetPassword, isPending, isSuccess, error } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  // Send the guest to sign in once the new password is stored.
  useEffect(() => {
    if (!isSuccess) return undefined;
    const timer = setTimeout(() => navigate(paths.login, { replace: true }), 1600);
    return () => clearTimeout(timer);
  }, [isSuccess, navigate]);

  const onSubmit = ({ password }) => resetPassword({ uid, token, password });

  // A hand-typed or truncated URL can't be recovered from — say so plainly
  // rather than failing on submit.
  if (!uid || !token) {
    return (
      <AuthLayout image={HERO_IMAGE} imageAlt="Bathroom in an Alotel Spaces residence">
        <h1 className="font-display text-[26px] font-bold">This reset link is incomplete</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Open the link directly from the email we sent, or request a new one.
        </p>
        <Button to={paths.forgotPassword} italic size="lg" fullWidth className="mt-6">
          Request a new link
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout image={HERO_IMAGE} imageAlt="Bathroom in an Alotel Spaces residence">
      <h1 className="font-display text-[26px] font-bold">Reset your password</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Enter your new password below.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
        <Input
          label="New Password"
          type="password"
          autoComplete="new-password"
          placeholder="Enter your new password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm New Password"
          type="password"
          autoComplete="new-password"
          placeholder="Enter your new password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {error && <Alert variant="error">{getErrorMessage(error)}</Alert>}
        {isSuccess && <Alert variant="success">Password updated — redirecting you to sign in…</Alert>}

        <Button type="submit" italic size="lg" fullWidth isLoading={isPending} className="mt-6">
          {isPending ? 'Resetting…' : 'Reset Password'}
        </Button>
      </form>

      <Link
        to={paths.login}
        className="mt-5 inline-flex items-center gap-2 py-2 font-display text-[13px] font-semibold italic text-brand-700 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Login
      </Link>

      <Alert variant="secure" className="mt-6" title="Your security matters" icon={<ShieldCheck className="size-4" />}>
        Choose a strong password to keep your account safe.
      </Alert>
    </AuthLayout>
  );
};
