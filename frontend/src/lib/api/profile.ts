import { z } from 'zod';
import { apiClient, ApiError } from './client';

const ProfileResponseSchema = z.object({
  experience: z.number(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export async function fetchProfile({ signal }: { signal?: AbortSignal } = {}): Promise<ProfileResponse> {
  try {
    return await apiClient('/api/profile', ProfileResponseSchema, { signal });
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch profile: ${message}` } as ApiError;
  }
}

export type { ApiError } from './client';
