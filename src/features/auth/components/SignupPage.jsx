import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';
import { AuthLayout } from './AuthLayout';
import { AuthDivider, SocialAuthButtons } from './SocialAuthButtons';
import { useSignup } from '../hooks/useSignup';
import { signupSchema } from '@/utils/validators';
import { getErrorMessage } from '@/utils/errors';
import { paths } from '@/routes/paths';
import HERO_IMAGE from '@/assets/images/auth-signup.jpg';


/** "Create your account" — registration screen. */
export const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, isPending, error } = useSignup();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
    },
  });

  /* Registration signs the guest in and emails a confirmation code, so the
     next screen asks for that code rather than dropping them on the dashboard
     with an unexplained reminder. Nothing is blocked if they skip it. */
  const onSubmit = (values) =>
    signup(values, {
      onSuccess: () => navigate(paths.verifyEmail, { replace: true, state: { email: values.email } }),
    });

  return (
    <AuthLayout
      image={HERO_IMAGE}
      imageAlt="Living room in an Alotel Spaces residence"
      caption="One account for every stay, in every market we run."
    >
      <h1 className="font-display text-[26px] font-bold">Create your account</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Join Alotel Spaces to discover premium properties and seamless stays.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
        {/* Two fields, because the API stores two. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            autoComplete="given-name"
            placeholder="Jane"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last name"
            autoComplete="family-name"
            placeholder="Walker"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register('email')}
        />

        {/* The dialling code is picked, not typed: see PhoneInput. */}
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <PhoneInput
              label="Phone number"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              error={errors.phone?.message}
            />
          )}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          hint="At least 8 characters, including a letter and a number."
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Type it again"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Checkbox
          error={errors.acceptedTerms?.message}
          label={
            <>
              I agree to the{' '}
              <Link to={paths.terms} target="_blank" rel="noreferrer" className="text-brand-700 underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to={paths.privacy} target="_blank" rel="noreferrer" className="text-brand-700 underline">
                Privacy Policy
              </Link>
            </>
          }
          {...register('acceptedTerms')}
        />

        {error && <Alert variant="error">{getErrorMessage(error, 'We could not create your account.')}</Alert>}

        <Button type="submit" italic size="lg" fullWidth isLoading={isPending}>
          {isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <AuthDivider />
      <SocialAuthButtons />

      <p className="mt-6 flex items-center justify-between text-[13px] text-ink-soft">
        Already have an account?
        <Link to={paths.login} className="font-display font-semibold italic text-brand-700 hover:underline">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
};
