import { apiClient } from './client';
import type { ApiError } from './client';
import {
  AdminMessagesResponse,
  AdminMessagesResponseSchema,
  ReplyMessageRequest,
  MessageResponse,
  MessageResponseSchema,
} from '@shared/types';

export async function fetchMessages(): Promise<AdminMessagesResponse> {
  try {
    return await apiClient('/api/admin/messages', AdminMessagesResponseSchema);
  } catch (err) {
    throw err as ApiError;
  }
}

export async function replyMessage(
  id: number,
  body: ReplyMessageRequest,
): Promise<MessageResponse> {
  try {
    return await apiClient(
      `/api/admin/messages/${id}/reply`,
      MessageResponseSchema,
      {
        method: 'POST',
        body,
      },
    );
  } catch (err) {
    throw err as ApiError;
  }
}
