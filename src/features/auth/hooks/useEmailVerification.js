import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/utils/errors';
import { toast } from '@/stores/uiStore';

/**
 * Confirming the email address a guest registered with.
 *
 * The API emails a six-digit code at registration and exposes
 * `POST /auth/verify-email/` and `/auth/verify-email/resend/`. Both answer
 * identically for unknown, already-verified and unverified addresses, so the
 * screen can never report which of those it is — that is deliberate on the
 * server's side and the UI must not undo it by guessing.
 */
export const useVerifyEmail = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  const mutation = useMutation({
    mutationFn: authService.verifyEmail,
    onSuccess: () => {
      /* The flag lives on the profile, so refresh it rather than patching a
         copy — anything else leaves two versions of the truth. */
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });
      authService.getCurrentUser().then((user) => user && setUser(user));
    },
  });

  return {
    verifyEmail: mutation.mutate,
    verifyEmailAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

/** Ask for a fresh code. The server holds a cooldown and a daily cap. */
export const useResendEmailVerification = () => {
  const mutation = useMutation({
    mutationFn: authService.resendEmailVerification,
    onSuccess: () => toast.success('Code sent', 'Check your inbox — it expires in five minutes.'),
    onError: (error) => toast.error('Could not send a new code', getErrorMessage(error)),
  });

  return {
    resendCode: mutation.mutate,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
  };
};
