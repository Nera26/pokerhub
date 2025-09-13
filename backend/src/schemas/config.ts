import { z } from 'zod';

export const DefaultAvatarResponseSchema = z.object({
  defaultAvatar: z.string().url(),
});

export type DefaultAvatarResponse = z.infer<typeof DefaultAvatarResponseSchema>;

export const PerformanceThresholdsResponseSchema = z.object({
  INP: z.number(),
  LCP: z.number(),
  CLS: z.number(),
});

export type PerformanceThresholdsResponse = z.infer<
  typeof PerformanceThresholdsResponseSchema
>;
