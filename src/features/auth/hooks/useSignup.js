import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/uiStore';
import { getErrorMessage } from '@/utils/errors';

/** Registration mutation — the new account is signed in immediately. */
export const useSignup = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  const mutation = useMutation({
    mutationFn: authService.signup,
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.auth.currentUser(), result.user);
      setUser(result.user);
      toast.success('Account created', `Welcome to Alotel Spaces, ${result.user.firstName || 'there'}.`);
    },
    onError: (error) => {
      toast.error('Could not create account', getErrorMessage(error));
    },
  });

  return {
    signup: mutation.mutate,
    signupAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
