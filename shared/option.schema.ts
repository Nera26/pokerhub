import { z } from 'zod';

export const OptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export type Option = z.infer<typeof OptionSchema>;
