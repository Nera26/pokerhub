'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api/client';

export function createQueryHook<T>(
  key: string,
  fetcher: (opts: { signal?: AbortSignal }) => Promise<T>,
  label: string,
) {
  return function useApiQuery() {
    return useQuery<T>({
      queryKey: [key],
      queryFn: async ({ signal }) => {
        try {
          return await fetcher({ signal });
        } catch (err) {
          const message = err instanceof Error ? err.message : (err as ApiError).message;
          throw { message: `Failed to fetch ${label}: ${message}` } as ApiError;
        }
      },
    });
  };
}

