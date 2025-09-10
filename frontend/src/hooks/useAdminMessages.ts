'use client';

import { fetchMessages } from '@/lib/api/messages';
import type { AdminMessagesResponse } from '@shared/types';
import { createAdminResource } from './useAdminResource';

export const useAdminMessages = createAdminResource<AdminMessagesResponse>(
  'admin-messages',
  fetchMessages,
);
