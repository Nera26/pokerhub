'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, type ApiError } from '@/lib/api/client';
import type { ZodSchema } from 'zod';

export function useAuditQuery<T>(
  key: string,
  path: string,
  schema: ZodSchema<T>,
) {
  return useQuery<T>({
    queryKey: [key],
    queryFn: async ({ signal }) => {
      try {
        return await apiClient(path, schema, { signal });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : (err as ApiError).message;
        throw { message: `Failed to fetch ${key}: ${message}` } as ApiError;
      }
    },
  });
}
