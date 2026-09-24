import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/uiStore';

/** Registration mutation — the new account is signed in immediately. */
export const useSignup = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  /* Failures are raised as the page banner by the sign-up screen. */
  const mutation = useMutation({
    mutationFn: authService.signup,
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.auth.currentUser(), result.user);
      setUser(result.user);
      toast.success('Account created', `Welcome to Alotel Spaces, ${result.user.firstName || 'there'}.`);
    },
  });

  return {
    signup: mutation.mutate,
    signupAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
