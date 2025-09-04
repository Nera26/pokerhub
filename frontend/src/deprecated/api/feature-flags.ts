import { handleResponse } from './client';
import { getBaseUrl } from '@/lib/base-url';
import {
  FeatureFlagsResponseSchema,
  FeatureFlagSchema,
  type FeatureFlagsResponse,
  type FeatureFlag,
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

export async function setRoomFeatureFlag(
  tableId: string,
  key: string,
  value: boolean,
): Promise<FeatureFlag> {
  const baseUrl = getBaseUrl();
  return handleResponse(
    serverFetch(`${baseUrl}/feature-flags/room/${tableId}/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    }),
    FeatureFlagSchema,
  );
}

export async function setTourneyFeatureFlag(
  tourneyId: string,
  key: string,
  value: boolean,
): Promise<FeatureFlag> {
  const baseUrl = getBaseUrl();
  return handleResponse(
    serverFetch(`${baseUrl}/feature-flags/tourney/${tourneyId}/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    }),
    FeatureFlagSchema,
  );
}
