import { apiClient, ApiError } from '@/lib/api/client';
import { UserProfileSchema, type UserProfile } from '@shared/types';

export async function fetchProfile({ signal }: { signal?: AbortSignal } = {}): Promise<UserProfile> {
  try {
    return await apiClient('/api/user/profile', UserProfileSchema, { signal });
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch profile: ${message}` } as ApiError;
  }
}

export type { ApiError } from '@/lib/api/client';
