import type { ZodSchema } from 'zod';
import { API_CONTRACT_VERSION } from '@shared/constants';
import { ServiceStatusResponseSchema } from '@shared/types';
import { fetchJson } from '@shared/http';
import { getBaseUrl } from '@/lib/base-url';
import { useAuthStore } from '@/app/store/authStore';
import { dispatchContractMismatch } from '@/components/ContractMismatchNotice';

/**
 * Error thrown by API helpers when a request fails or returns an unexpected body.
 *
 * @property message - Human readable description of the failure.
 * @property errors - Optional map of field validation errors returned by the server.
 * @property status - HTTP status code for non-2xx responses.
 * @property details - Raw response body or additional context for the failure.
 */
export interface ApiError {
  /** Human readable description of the failure. */
  message?: string;
  /** Map of field validation errors returned by the server. */
  errors?: Record<string, unknown>;
  /** HTTP status code for non-2xx responses. */
  status?: number;
  /** Raw response body or additional context for the failure. */
  details?: string;
}

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
  } = {},
): Promise<T> {
  const baseUrl = getBaseUrl();
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.body !== undefined) {
    headers['content-type'] = headers['content-type'] ?? 'application/json';
  }

  return fetchJson(
    `${baseUrl}${path}`,
    schema,
    {
      method: opts.method ?? 'GET',
      credentials: 'include',
      headers,
      ...(opts.body !== undefined && { body: JSON.stringify(opts.body) }),
      ...(opts.signal && { signal: opts.signal }),
      ...(opts.cache && { cache: opts.cache }),
    },
    token,
  );
}

export { fetchJson };
