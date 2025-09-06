'use client';

import { useQuery } from '@tanstack/react-query';
import { ZodSchema } from 'zod';
import { getBaseUrl } from '@/lib/base-url';
import { handleResponse, type ApiError } from '@/lib/api/client';

export default function useAuditQuery<T>(
  endpoint: string,
  schema: ZodSchema<T>,
  key: string,
) {
  return useQuery<T>({
    queryKey: [key],
    queryFn: async ({ signal }) => {
      const baseUrl = getBaseUrl();
      try {
        return await handleResponse(
          fetch(`${baseUrl}${endpoint}`, { credentials: 'include', signal }),
          schema,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : (err as ApiError).message;
        throw { message: `Failed to fetch ${key.replace(/-/g, ' ')}: ${message}` } as ApiError;
      }
    },
  });
}

