import { apiClient } from './client';
import { z } from 'zod';

const FeatureFlagSchema = z.object({
  key: z.string(),
  value: z.boolean(),
});
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;

/**
 * Update a feature flag by name. Enables the flag when value is true and
 * deletes it when value is false.
 */
export async function updateFeatureFlag(
  name: string,
  value: boolean,
): Promise<FeatureFlag | void> {
  if (value) {
    return apiClient(`/api/feature-flags/${name}`, FeatureFlagSchema, {
      method: 'PUT',
      body: { value },
    });
  }
  await apiClient(`/api/feature-flags/${name}`, z.void(), {
    method: 'DELETE',
  });
}
