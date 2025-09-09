import { createQueryHook } from './useApiQuery';
import { fetchMessages } from '@/lib/api/messages';
import type { AdminMessagesResponse } from '@shared/types';

const useAdminMessages = createQueryHook<AdminMessagesResponse>(
  'adminMessages',
  () => fetchMessages(),
  'admin messages',
);

export default useAdminMessages;
