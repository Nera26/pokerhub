import { apiClient, ApiError } from './client';
import {
  UserProfileSchema,
  type UserProfile,
  MeResponseSchema,
  type MeResponse,
  ProfileStatsResponseSchema,
  type ProfileStatsResponse,
} from '@shared/types';

async function withProfileError<T>(
  fn: () => Promise<T>,
  prefix: string,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `${prefix}: ${message}` } as ApiError;
  }
}

export function fetchProfile({
  signal,
}: { signal?: AbortSignal } = {}): Promise<UserProfile> {
  return withProfileError(
    () => apiClient('/api/user/profile', UserProfileSchema, { signal }),
    'Failed to fetch profile',
  );
}

export function fetchUserProfile(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<UserProfile> {
  return withProfileError(
    () => apiClient(`/api/user/${id}/profile`, UserProfileSchema, { signal }),
    'Failed to fetch user profile',
  );
}

export function fetchMe({
  signal,
}: { signal?: AbortSignal } = {}): Promise<MeResponse> {
  return withProfileError(
    () => apiClient('/api/me', MeResponseSchema, { signal }),
    'Failed to fetch profile',
  );
}

export function fetchStats({
  signal,
}: { signal?: AbortSignal } = {}): Promise<ProfileStatsResponse> {
  return withProfileError(
    () =>
      apiClient('/api/profile/stats', ProfileStatsResponseSchema, { signal }),
    'Failed to fetch profile stats',
  );
}

export type { ApiError } from './client';
