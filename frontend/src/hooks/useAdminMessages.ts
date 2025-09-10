'use client';

import { fetchMessages } from '@/lib/api/messages';
import type { AdminMessagesResponse } from '@shared/types';
import { createQueryHook } from './useApiQuery';

export const useAdminMessages = createQueryHook<AdminMessagesResponse>(
  'admin-messages',
  () => fetchMessages(),
  'admin messages',
);
