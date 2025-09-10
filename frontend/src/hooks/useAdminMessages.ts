'use client';

import { fetchMessages } from '@/lib/api/messages';
import type { AdminMessagesResponse } from '@shared/types';
import { createResourceHook } from './createResourceHook';

export const useAdminMessages = createResourceHook<AdminMessagesResponse>(
  'admin-messages',
  () => fetchMessages(),
);
