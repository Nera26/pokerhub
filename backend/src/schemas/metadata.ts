import { z } from 'zod';

export const SiteMetadataResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  imagePath: z.string(),
});

export type SiteMetadataResponse = z.infer<typeof SiteMetadataResponseSchema>;
