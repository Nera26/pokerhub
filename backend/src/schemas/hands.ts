import { z } from 'zod';

export const HandProofResponse = z.object({
  seed: z.string(),
  nonce: z.string(),
  commitment: z.string(),
});

export type HandProofResponse = z.infer<typeof HandProofResponse>;
