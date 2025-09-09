'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient, type ApiError } from '@/lib/api/client';

export function createQueryHook<T>(
  key: string,
  fetcher: (
    client: typeof apiClient,
    opts: { signal?: AbortSignal },
  ) => Promise<T>,
  label: string,
  options?: Omit<
    UseQueryOptions<T, ApiError, T, [string]>,
    'queryKey' | 'queryFn'
  >,
) {
  return function useApiQuery() {
    return useQuery<T, ApiError, T, [string]>({
      queryKey: [key],
      queryFn: async ({ signal }) => {
        try {
          return await fetcher(apiClient, { signal });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : (err as ApiError).message;
          throw { message: `Failed to fetch ${label}: ${message}` } as ApiError;
        }
      },
      ...(options ?? {}),
    });
  };
}
