'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMessages, replyMessage } from '@/lib/api/messages';
import type { AdminMessagesResponse } from '@shared/types';
import { createQueryHook } from './useApiQuery';

export const useAdminMessages = createQueryHook<AdminMessagesResponse>(
  'admin-messages',
  () => fetchMessages(),
  'admin messages',
);

export function useReplyMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply }: { id: number; reply: string }) =>
      replyMessage(id, { reply }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] }),
  });
}
