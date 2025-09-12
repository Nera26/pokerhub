import { z } from 'zod';

export const TranslationsResponseSchema = z.object({
  messages: z.record(z.string()),
});

export type TranslationsResponse = z.infer<typeof TranslationsResponseSchema>;
