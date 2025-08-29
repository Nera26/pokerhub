import { handleResponse } from './client';
import { getBaseUrl } from '@/lib/base-url';
import {
  FeatureFlagsResponseSchema,
  type FeatureFlagsResponse,
} from '@shared/types';
import { serverFetch } from '@/lib/server-fetch';

let cache: FeatureFlagsResponse | null = null;

export async function getFeatureFlags(): Promise<FeatureFlagsResponse> {
  if (cache) return cache;
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('feature-flags');
    if (stored) {
      try {
        cache = JSON.parse(stored) as FeatureFlagsResponse;
        return cache;
      } catch {
        // ignore parse errors
      }
    }
  }
  const baseUrl = getBaseUrl();
  cache = await handleResponse(
    serverFetch(`${baseUrl}/feature-flags`),
    FeatureFlagsResponseSchema,
  );
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('feature-flags', JSON.stringify(cache));
  }
  return cache;
}
