'use client';

import { fetchMessages } from '@/lib/api/messages';
import type { AdminMessagesResponse } from '@shared/types';
import { createAdminQuery } from './useAdminQuery';

export const useAdminMessages = createAdminQuery<AdminMessagesResponse>(
  'adminMessages',
  fetchMessages,
  'admin messages',
);
