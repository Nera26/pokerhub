import { apiClient, ApiError } from './client';
import { MeResponseSchema, type MeResponse } from '@shared/types';

export async function fetchMe({ signal }: { signal?: AbortSignal } = {}): Promise<MeResponse> {
  try {
    return await apiClient('/api/me', MeResponseSchema, { signal });
  } catch (err) {
    const message = err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch profile: ${message}` } as ApiError;
  }
}

export type { ApiError } from './client';
