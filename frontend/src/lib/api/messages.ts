/* istanbul ignore file */
import { apiClient } from './client';
import {
  AdminMessagesResponse,
  AdminMessagesResponseSchema,
  ReplyMessageRequest,
  MessageResponse,
  MessageResponseSchema,
} from '@shared/types';

export async function fetchMessages(): Promise<AdminMessagesResponse> {
  return apiClient('/api/admin/messages', AdminMessagesResponseSchema);
}

export async function replyMessage(
  id: number,
  body: ReplyMessageRequest,
): Promise<MessageResponse> {
  return apiClient(`/api/admin/messages/${id}/reply`, MessageResponseSchema, {
    method: 'POST',
    body,
  });
}
