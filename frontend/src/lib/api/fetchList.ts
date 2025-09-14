import { apiClient, type ApiError } from './client';
import type { ZodType } from 'zod';

export async function fetchList<T>(
  url: string,
  schema: ZodType<T>,
  { signal }: { signal?: AbortSignal } = {},
): Promise<T> {
  try {
    return await apiClient(url, schema, { signal });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch ${url}: ${message}` } as ApiError;
  }
}
