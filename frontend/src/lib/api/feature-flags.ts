import { apiClient, ApiError } from './client';
import {
  FeatureFlagsResponseSchema,
  type FeatureFlagsResponse,
} from '@shared/types';

export async function fetchFeatureFlags({
  signal,
}: { signal?: AbortSignal } = {}): Promise<FeatureFlagsResponse> {
  try {
    return await apiClient('/api/feature-flags', FeatureFlagsResponseSchema, {
      signal,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch feature flags: ${message}` } as ApiError;
  }
}

export type { ApiError } from './client';
