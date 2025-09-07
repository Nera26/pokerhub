import { z } from 'zod';

export const BroadcastTypeSchema = z.enum(['announcement', 'alert', 'notice']);
export type BroadcastType = z.infer<typeof BroadcastTypeSchema>;

export const BroadcastSchema = z.object({
  id: z.string(),
  type: BroadcastTypeSchema,
  text: z.string(),
  timestamp: z.string().datetime(),
  urgent: z.boolean(),
});
export type Broadcast = z.infer<typeof BroadcastSchema>;

export const BroadcastsResponseSchema = z.object({
  broadcasts: z.array(BroadcastSchema),
});
export type BroadcastsResponse = z.infer<typeof BroadcastsResponseSchema>;

export const BroadcastTemplatesResponseSchema = z.object({
  templates: z.object({
    maintenance: z.string(),
    tournament: z.string(),
  }),
});
export type BroadcastTemplatesResponse = z.infer<
  typeof BroadcastTemplatesResponseSchema
>;

export const SendBroadcastRequestSchema = z.object({
  type: BroadcastTypeSchema,
  text: z.string().min(1).max(500),
  urgent: z.boolean(),
  sound: z.boolean(),
});
export type SendBroadcastRequest = z.infer<typeof SendBroadcastRequestSchema>;
