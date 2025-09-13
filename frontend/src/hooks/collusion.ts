'use client';

import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  listFlaggedSessions,
  getActionHistory,
  applyAction,
} from '@/lib/api/collusion';
import type {
  FlaggedSession,
  ReviewAction,
  ReviewActionLog,
} from '@shared/types';

function nextAction(status: FlaggedSession['status']): ReviewAction | null {
  switch (status) {
    case 'flagged':
      return 'warn';
    case 'warn':
      return 'restrict';
    case 'restrict':
      return 'ban';
    default:
      return null;
  }
}

export function useFlaggedSessions(token?: string) {
  return useQuery({
    queryKey: ['flagged-sessions', token],
    queryFn: () => listFlaggedSessions(token!),
    enabled: !!token,
  });
}

export function useActionHistory(sessions: FlaggedSession[], token?: string) {
  const results = useQueries({
    queries: sessions.map((s) => ({
      queryKey: ['collusion-history', token, s.id],
      queryFn: () => getActionHistory(s.id, token!),
      enabled: !!token,
    })),
  });
  return sessions.reduce<Record<string, ReviewActionLog[]>>(
    (acc, sess, idx) => {
      acc[sess.id] = results[idx]?.data ?? [];
      return acc;
    },
    {},
  );
}

export function useApplyCollusionAction(token?: string, reviewerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: FlaggedSession['status'];
    }) => {
      const action = nextAction(status);
      if (!token || !reviewerId || !action) {
        throw new Error('Invalid action');
      }
      return applyAction(id, action, token, reviewerId);
    },
    onMutate: async ({ id, status }) => {
      const action = nextAction(status);
      if (!action || !token || !reviewerId) return;
      const sessionsKey = ['flagged-sessions', token];
      const historyKey = ['collusion-history', token, id];

      await queryClient.cancelQueries({ queryKey: sessionsKey });
      await queryClient.cancelQueries({ queryKey: historyKey });

      const prevSessions =
        queryClient.getQueryData<FlaggedSession[]>(sessionsKey);
      const prevHistory =
        queryClient.getQueryData<ReviewActionLog[]>(historyKey);

      const optimistic: ReviewActionLog = {
        action,
        timestamp: Date.now(),
        reviewerId,
      };

      queryClient.setQueryData<FlaggedSession[]>(sessionsKey, (old = []) =>
        old.map((s) => (s.id === id ? { ...s, status: action } : s)),
      );

      queryClient.setQueryData<ReviewActionLog[]>(historyKey, (old = []) => [
        ...old,
        optimistic,
      ]);

      return { prevSessions, prevHistory };
    },
    onError: (_err, { id }, ctx) => {
      const sessionsKey = ['flagged-sessions', token];
      const historyKey = ['collusion-history', token, id];
      if (ctx?.prevSessions) {
        queryClient.setQueryData(sessionsKey, ctx.prevSessions);
      }
      if (ctx?.prevHistory) {
        queryClient.setQueryData(historyKey, ctx.prevHistory);
      }
    },
    onSuccess: (confirmed, { id }) => {
      const historyKey = ['collusion-history', token, id];
      queryClient.setQueryData<ReviewActionLog[]>(historyKey, (old = []) => [
        ...old.slice(0, -1),
        confirmed,
      ]);
    },
  });
}

export { nextAction };
