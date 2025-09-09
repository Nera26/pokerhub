import { apiClient, type ApiError } from './client';
import {
  MeResponseSchema,
  type MeResponse,
  UserProfileSchema,
  type UserProfile,
} from '@shared/types';
import type { ZodSchema } from 'zod';

async function fetchWithProfileError<T>(
  path: string,
  schema: ZodSchema<T>,
  { signal }: { signal?: AbortSignal } = {},
): Promise<T> {
  try {
    return await apiClient(path, schema, { signal });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch profile: ${message}` } as ApiError;
  }
}

export function fetchMe({
  signal,
}: { signal?: AbortSignal } = {}): Promise<MeResponse> {
  return fetchWithProfileError('/api/me', MeResponseSchema, { signal });
}

export function fetchProfile({
  signal,
}: { signal?: AbortSignal } = {}): Promise<UserProfile> {
  return fetchWithProfileError('/api/user/profile', UserProfileSchema, {
    signal,
  });
}

export type { ApiError } from './client';
