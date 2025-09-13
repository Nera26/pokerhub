import { safeApiClient } from './utils';
import {
  AdminMessage,
  AdminMessageSchema,
  AdminMessagesResponse,
  AdminMessagesResponseSchema,
  ReplyMessageRequest,
  MessageResponse,
  MessageResponseSchema,
} from '@shared/types';

export async function fetchMessages(): Promise<AdminMessagesResponse> {
  return safeApiClient('/api/admin/messages', AdminMessagesResponseSchema, {
    errorMessage: 'Failed to fetch messages',
  });
}

export async function replyMessage(
  id: number,
  body: ReplyMessageRequest,
): Promise<MessageResponse> {
  return safeApiClient(
    `/api/admin/messages/${id}/reply`,
    MessageResponseSchema,
    {
      method: 'POST',
      body,
      errorMessage: 'Failed to reply to message',
    },
  );
}

export async function markMessageRead(id: number): Promise<AdminMessage> {
  return safeApiClient(`/api/admin/messages/${id}/read`, AdminMessageSchema, {
    method: 'POST',
    errorMessage: 'Failed to mark message read',
  });
}
