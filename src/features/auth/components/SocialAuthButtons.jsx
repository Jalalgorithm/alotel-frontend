import { Apple } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/classNames';
import { toast } from '@/stores/uiStore';

/** Google's four-colour mark — lucide has no brand icon for it. */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.44a5.5 5.5 0 0 1-2.39 3.6v3h3.86c2.26-2.08 3.58-5.15 3.58-8.84Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
    />
    <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z" />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
    />
  </svg>
);

/**
 * OAuth entry points. They are intentionally inert in mock mode — wiring them
 * up means redirecting to `${VITE_API_URL}/auth/{provider}` on the real API.
 */
export const SocialAuthButtons = ({ layout = 'stack', className }) => {
  const notImplemented = (provider) =>
    toast.info(`${provider} sign-in`, 'Connect your OAuth provider to enable this option.');

  return (
    <div className={cn('grid gap-3', layout === 'row' && 'sm:grid-cols-2', className)}>
      <Button variant="secondary" italic onClick={() => notImplemented('Google')} leftIcon={<GoogleIcon />} fullWidth>
        Continue with Google
      </Button>

      <Button
        variant="secondary"
        italic
        onClick={() => notImplemented('Apple')}
        leftIcon={<Apple className="size-4" aria-hidden="true" />}
        fullWidth
      >
        Continue with Apple
      </Button>
    </div>
  );
};

/** "Or" rule between the primary form action and the social options. */
export const AuthDivider = ({ label = 'Or' }) => (
  <div className="my-5 flex items-center gap-3">
    <span className="h-px flex-1 bg-line" />
    <span className="text-xs text-ink-muted">{label}</span>
    <span className="h-px flex-1 bg-line" />
  </div>
);
