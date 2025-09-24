'use client';

import {
  fetchMessages,
  markMessageRead,
  replyMessage,
} from '@/lib/api/messages';
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

export function useMarkMessageRead() {
  return useInvalidateMutation({
    mutationFn: (id: number) => markMessageRead(id),
    queryKey: ['admin-messages'],
  });
}
