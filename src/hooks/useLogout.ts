'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '@/lib/api/auth';
import { useAuthToken, useAuthActions } from '@/app/store/authStore';

export default function useLogout() {
  const queryClient = useQueryClient();
  const token = useAuthToken();
  const { clearToken, setToken } = useAuthActions();

  return useMutation<unknown, unknown, void, { previousToken: string | null }>({
    mutationFn: logout,
    onMutate: async () => {
      const previousToken = token;
      clearToken();
      queryClient.setQueryData(['authToken'], null);
      return { previousToken };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousToken) {
        setToken(context.previousToken);
        queryClient.setQueryData(['authToken'], context.previousToken);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authToken'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['authToken'] });
    },
  });
}
