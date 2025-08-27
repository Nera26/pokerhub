import { z } from 'zod';

export const HandProofSchema = z.object({
  seed: z.string(),
  nonce: z.string(),
  commitment: z.string(),
});

export type HandProof = z.infer<typeof HandProofSchema>;
