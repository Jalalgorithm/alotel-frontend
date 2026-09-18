import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/classNames';
import { toast } from '@/stores/uiStore';

/**
 * OAuth entry points.
 *
 * Both marks are drawn here rather than taken from the icon set: lucide ships
 * an `Apple` icon that is a piece of fruit with a leaf, which is not Apple's
 * logo, and has no Google mark at all. Apple's guidelines also require their
 * mark to keep its own clear space and never be recoloured, so it renders at a
 * fixed size in a single ink colour.
 *
 * They are inert until the API grows OAuth routes — there are none today — so
 * pressing one says so plainly instead of failing at a redirect.
 */

/** Google's four-colour "G". */
const GoogleMark = () => (
  <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true" focusable="false">
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

/** Apple's mark — the apple silhouette with its bite and leaf. */
const AppleMark = () => (
  <svg viewBox="0 0 814 1000" className="size-[18px]" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zM554.1 159.4c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"
    />
  </svg>
);

export const SocialAuthButtons = ({ className }) => {
  const notImplemented = (provider) =>
    toast.info(`${provider} sign-in is not available yet`, 'Use your email address and password for now.');

  return (
    /* Stacked at every width: side by side, "Continue with Google" wraps onto
       two lines in a 400px column and the pair stops looking like one control. */
    <div className={cn('grid gap-2.5', className)}>
      <Button variant="secondary" onClick={() => notImplemented('Google')} leftIcon={<GoogleMark />} fullWidth>
        Continue with Google
      </Button>

      <Button
        variant="secondary"
        onClick={() => notImplemented('Apple')}
        leftIcon={
          <span className="text-ink">
            <AppleMark />
          </span>
        }
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
    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">{label}</span>
    <span className="h-px flex-1 bg-line" />
  </div>
);
