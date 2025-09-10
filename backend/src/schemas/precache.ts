import { z } from 'zod';

export const PrecacheListResponseSchema = z.array(z.string());
export type PrecacheListResponse = z.infer<typeof PrecacheListResponseSchema>;
