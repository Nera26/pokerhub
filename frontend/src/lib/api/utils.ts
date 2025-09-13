import { type ZodSchema } from 'zod';
import { apiClient, type ApiError } from './client';

export interface SafeApiClientOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  cache?: RequestCache;
  errorMessage: string;
}

export async function safeApiClient<T>(
  path: string,
  schema: ZodSchema<T>,
  { errorMessage, ...opts }: SafeApiClientOptions,
): Promise<T> {
  try {
    return await apiClient(path, schema, opts);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `${errorMessage}: ${message}` } as ApiError;
  }
}
