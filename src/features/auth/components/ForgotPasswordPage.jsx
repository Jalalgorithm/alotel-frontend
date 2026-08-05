import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { AuthLayout } from './AuthLayout';
import { useForgotPassword } from '../hooks/usePasswordRecovery';
import { forgotPasswordSchema } from '@/utils/validators';
import { paths } from '@/routes/paths';
import HERO_IMAGE from '@/assets/images/auth-verify.jpg';


/** "Forgot your password?" — requests a reset link by email. */
export const ForgotPasswordPage = () => {
  const { requestReset, isPending, isSuccess, data } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  return (
    <AuthLayout image={HERO_IMAGE} imageAlt="Bedroom in an Alotel Spaces residence">
      <h1 className="font-display text-[26px] font-bold leading-tight">Forgot your password?</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        No worries! Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit(requestReset)} className="mt-5 space-y-4" noValidate>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
          hint="We'll send password reset instructions to this email"
          error={errors.email?.message}
          {...register('email')}
        />

        {isSuccess && <Alert variant="success">{data?.message}</Alert>}

        <Button type="submit" italic size="lg" fullWidth isLoading={isPending}>
          {isPending ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <Link
        to={paths.login}
        className="mt-5 inline-flex items-center gap-2 font-display text-[13px] font-semibold italic text-brand-700 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Login
      </Link>

      <Alert variant="secure" className="mt-6" icon={<ShieldCheck className="size-4" />}>
        We&apos;ll never share your email with anyone else.
        <br />
        Check your inbox and spam folder.
      </Alert>
    </AuthLayout>
  );
};
