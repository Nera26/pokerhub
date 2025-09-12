'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient, type ApiError } from '@/lib/api/client';

type QueryKey<P> = [string, P?];

export function createQueryHook<T, P = undefined>(
  key: string,
  fetcher: (
    client: typeof apiClient,
    params: P,
    opts: { signal?: AbortSignal },
  ) => Promise<T>,
  label: string,
  options?: Omit<
    UseQueryOptions<T, ApiError, T, QueryKey<P>>,
    'queryKey' | 'queryFn'
  >,
) {
  const usesParams = fetcher.length >= 3;

  return function useApiQuery(
    paramsOrOptions?: P,
    callOptions?: Omit<
      UseQueryOptions<T, ApiError, T, QueryKey<P>>,
      'queryKey' | 'queryFn'
    >,
  ) {
    const params = usesParams ? paramsOrOptions : undefined;
    const optionsArg = usesParams
      ? callOptions
      : (paramsOrOptions as typeof callOptions);
    const queryKey = (
      usesParams && params !== undefined ? [key, params] : [key]
    ) as QueryKey<P>;
    return useQuery<T, ApiError, T, QueryKey<P>>({
      queryKey,
      queryFn: async ({ signal }) => {
        try {
          if (usesParams) {
            return await fetcher(apiClient, params as P, { signal });
          }
          return await (fetcher as any)(apiClient, { signal });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : (err as ApiError).message;
          throw { message: `Failed to fetch ${label}: ${message}` } as ApiError;
        }
      },
      ...(options ?? {}),
      ...(optionsArg ?? {}),
    });
  };
}
