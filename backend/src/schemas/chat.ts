import { z } from 'zod';
import {
  ChatMessageSchema,
  SendChatMessageRequestSchema,
  type ChatMessage,
  type SendChatMessageRequest,
} from './tables';

export const ChatMessagesSchema = z.array(ChatMessageSchema);
export type ChatMessages = z.infer<typeof ChatMessagesSchema>;
export { ChatMessageSchema, SendChatMessageRequestSchema };
export type { ChatMessage, SendChatMessageRequest };
