import { z } from 'zod';

export const AdminMessageSchema = z.object({
  id: z.number().int(),
  sender: z.string(),
  userId: z.string(),
  avatar: z.string(),
  subject: z.string(),
  preview: z.string(),
  content: z.string(),
  time: z.string(),
  read: z.boolean(),
});
export type AdminMessage = z.infer<typeof AdminMessageSchema>;

export const AdminMessagesResponseSchema = z.object({
  messages: z.array(AdminMessageSchema),
});
export type AdminMessagesResponse = z.infer<typeof AdminMessagesResponseSchema>;

export const ReplyMessageRequestSchema = z.object({
  reply: z.string().trim().min(1).max(1000),
});
export type ReplyMessageRequest = z.infer<typeof ReplyMessageRequestSchema>;
