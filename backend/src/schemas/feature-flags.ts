import { z } from 'zod';

export const FeatureFlagRequestSchema = z.object({
  value: z.boolean(),
});
export type FeatureFlagRequest = z.infer<typeof FeatureFlagRequestSchema>;

export const FeatureFlagSchema = z.object({
  key: z.string(),
  value: z.boolean(),
});
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;

export const FeatureFlagsResponseSchema = z.record(z.boolean());
export type FeatureFlagsResponse = z.infer<typeof FeatureFlagsResponseSchema>;
