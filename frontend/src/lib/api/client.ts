import { type ZodSchema } from 'zod';
import { fetchJson, type ApiError } from '@shared/utils/http';
import { API_CONTRACT_VERSION } from '@shared/constants';
import { ServiceStatusResponseSchema } from '@shared/types';
import { getBaseUrl } from '@/lib/base-url';
import { useAuthStore } from '@/app/store/authStore';
import { dispatchContractMismatch } from '@/components/ContractMismatchNotice';

export type { ApiError };

export async function checkApiContractVersion(): Promise<void> {
  const baseUrl = getBaseUrl();
  try {
    const { contractVersion } = await fetchJson(
      `${baseUrl}/status`,
      ServiceStatusResponseSchema,
      {},
    );
    const [backendMajor] = contractVersion.split('.');
    const [frontendMajor] = API_CONTRACT_VERSION.split('.');
    if (backendMajor !== frontendMajor) {
      dispatchContractMismatch();
      throw new Error('API contract version mismatch');
    }
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === 'API contract version mismatch'
    ) {
      throw err;
    }
    // ignore other errors
  }
}

export async function apiClient<T>(
  path: string,
  schema: ZodSchema<T>,
  opts: {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
    headers?: Record<string, string>;
    cache?: RequestCache;
    keepalive?: boolean;
  } = {},
): Promise<T> {
  const baseUrl = getBaseUrl();
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  const isFormData =
    typeof FormData !== 'undefined' && opts.body instanceof FormData;
  if (opts.body !== undefined && !isFormData) {
    headers['content-type'] = headers['content-type'] ?? 'application/json';
  }

  return fetchJson(
    `${baseUrl}${path}`,
    schema,
    {
      method: opts.method ?? 'GET',
      credentials: 'include',
      headers,
      ...(opts.body !== undefined && {
        body: isFormData ? opts.body : JSON.stringify(opts.body),
      }),
      ...(opts.signal && { signal: opts.signal }),
      ...(opts.cache && { cache: opts.cache }),
      ...(opts.keepalive !== undefined && { keepalive: opts.keepalive }),
    },
    token,
  );
}
