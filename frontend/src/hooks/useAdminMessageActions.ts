'use client';

import { fetchMessages, replyMessage } from '@/lib/api/messages';
import type { AdminMessagesResponse } from '@shared/types';
import { createQueryHook } from './createQueryHook';
import { useInvalidateMutation } from './useInvalidateMutation';

export const useAdminMessages = createQueryHook<AdminMessagesResponse>(
  'admin-messages',
  () => fetchMessages(),
  'admin messages',
);

export function useReplyMessage() {
  return useInvalidateMutation({
    mutationFn: ({ id, reply }: { id: number; reply: string }) =>
      replyMessage(id, { reply }),
    queryKey: ['admin-messages'],
  });
}
