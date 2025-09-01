import { z } from 'zod';
import {
  ChatMessageSchema,
  SendChatMessageRequestSchema,
} from '@shared/types';

export const ChatMessagesSchema = z.array(ChatMessageSchema);
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatMessages = z.infer<typeof ChatMessagesSchema>;
export type SendChatMessageRequest = z.infer<typeof SendChatMessageRequestSchema>;
export { ChatMessageSchema, SendChatMessageRequestSchema };
