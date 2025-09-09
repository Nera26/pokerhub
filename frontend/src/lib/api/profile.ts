import { apiClient, ApiError } from './client';
import {
  UserProfileSchema,
  type UserProfile,
  MeResponseSchema,
  type MeResponse,
} from '@shared/types';

export async function fetchProfile({
  signal,
}: { signal?: AbortSignal } = {}): Promise<UserProfile> {
  try {
    return await apiClient('/api/user/profile', UserProfileSchema, { signal });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch profile: ${message}` } as ApiError;
  }
}

export async function fetchMe({
  signal,
}: { signal?: AbortSignal } = {}): Promise<MeResponse> {
  try {
    return await apiClient('/api/me', MeResponseSchema, { signal });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch profile: ${message}` } as ApiError;
  }
}

export type { ApiError } from './client';
