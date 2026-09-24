import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { errorBanner } from '@/stores/uiStore';
import { CodeInput } from '@/components/ui/CodeInput';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../hooks/useAuth';
import { useResendEmailVerification, useVerifyEmail } from '../hooks/useEmailVerification';
import { useLogout } from '../hooks/useLogout';
import { paths } from '@/routes/paths';
import { getErrorMessage } from '@/utils/errors';
import { safeReturnTo } from '@/utils/navigation';
import HERO_IMAGE from '@/assets/images/auth-verify.jpg';

const CODE_LENGTH = 6;
/** Matches the server's resend cooldown, so the button is not offered early. */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Confirm the address a guest registered with.
 *
 * Registration signs the guest in and emails a six-digit code, and nothing
 * signed-in opens until that code is entered: the route guard sends an
 * unconfirmed account straight here. The API enforces its own half — payment
 * refuses an unconfirmed address with 403 `email_unverified` — and this is the
 * product decision that the rest waits too.
 *
 * So there is no "do it later" link: it would lead somewhere the guard bounces
 * them back from. The way out is to sign out, which is offered plainly.
 *
 * The email is carried in router state from sign-up; a guest who arrives
 * directly falls back to their signed-in address.
 */
export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [code, setCode] = useState('');
  /* CodeInput keeps its own digits, so a rejected code is cleared by
     remounting it rather than by pushing a value back down. */
  const [attempt, setAttempt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  const [isDone, setIsDone] = useState(false);
  const timerRef = useRef(null);

  const email = location.state?.email ?? user?.email ?? '';
  const redirectTo = safeReturnTo(location.state?.from, paths.dashboard);

  const { verifyEmail, isPending } = useVerifyEmail();
  const { logoutAsync } = useLogout();

  /* Signing out has to take the guest somewhere. Clearing the session on its
     own left this screen sitting there — the code box still on display, the
     account already gone — which read as a broken button. */
  const leave = async () => {
    try {
      await logoutAsync();
    } catch {
      /* The session is cleared locally either way. */
    }
    navigate(paths.login, { replace: true });
  };
  const { resendCode, isPending: isResending } = useResendEmailVerification();

  /* The cooldown runs from arrival, because registration has just sent one. */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  if (!email) return <Navigate to={paths.login} replace />;

  const submit = (value = code) => {
    if (value.length !== CODE_LENGTH || isPending) return;
    errorBanner.dismiss();
    verifyEmail(
      { email, code: value },
      {
        onSuccess: () => setIsDone(true),
        onError: (codeError) => {
          setCode('');
          setAttempt((current) => current + 1);
          errorBanner.show({
            title: 'That code was not accepted',
            message: getErrorMessage(codeError, 'Check the six digits and try again.'),
            detail: 'Codes expire after five minutes — if this one has, ask for a new one.',
            actions: secondsLeft > 0 ? [] : [{ label: 'Send a new code', onClick: resend }],
          });
        },
      },
    );
  };

  const resend = () => {
    resendCode({ email });
    setSecondsLeft(RESEND_COOLDOWN_SECONDS);
  };

  if (isDone) {
    return (
      <AuthLayout
        image={HERO_IMAGE}
        imageAlt="Evening in an Alotel Spaces residence"
        caption="That is your address confirmed — everything else is ready."
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-brand-50">
          <CheckCircle2 className="size-5 text-brand-600" aria-hidden="true" />
        </span>

        <h1 className="mt-4 font-display text-[26px] font-bold">Email confirmed</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          <span className="font-medium text-ink">{email}</span> is confirmed. We will use it for booking
          confirmations, contracts and anything that needs your signature.
        </p>

        <Button className="mt-6" size="lg" fullWidth onClick={() => navigate(redirectTo, { replace: true })}>
          Continue
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      image={HERO_IMAGE}
      imageAlt="Evening in an Alotel Spaces residence"
      caption="One code, and your bookings can reach you."
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-brand-50">
        <MailCheck className="size-5 text-brand-600" aria-hidden="true" />
      </span>

      <h1 className="mt-4 font-display text-[26px] font-bold">Confirm your email</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        We sent a {CODE_LENGTH}-digit code to <span className="font-medium text-ink">{email}</span>. It expires in
        five minutes. Your account is ready as soon as it is confirmed.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="mt-6"
        noValidate
      >
        <CodeInput key={attempt} length={CODE_LENGTH} onChange={setCode} onComplete={submit} disabled={isPending} />

        <Button
          type="submit"
          size="lg"
          fullWidth
          className="mt-5"
          isLoading={isPending}
          disabled={code.length !== CODE_LENGTH || isPending}
        >
          Confirm email
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-[13px] text-ink-soft">
        <span>Didn&apos;t get it? Check your spam folder.</span>
        <button
          type="button"
          onClick={resend}
          disabled={secondsLeft > 0 || isResending}
          className="font-display font-semibold italic text-brand-700 transition-colors hover:underline disabled:cursor-not-allowed disabled:text-ink-muted disabled:no-underline"
        >
          {secondsLeft > 0 ? `Send a new code in ${secondsLeft}s` : 'Send a new code'}
        </button>
      </div>

      {/* Not a dead end: wrong address, or someone else's machine. */}
      <p className="mt-6 border-t border-line pt-4 text-[13px] text-ink-soft">
        Wrong address, or not your account?{' '}
        <button
          type="button"
          onClick={leave}
          className="font-display font-semibold italic text-brand-700 hover:underline"
        >
          Back to sign in
        </button>{' '}
        — this code only works for {email}.
      </p>
    </AuthLayout>
  );
};
