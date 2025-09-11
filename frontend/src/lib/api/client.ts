import { ZodError, type ZodSchema } from 'zod';
import { API_CONTRACT_VERSION } from '@shared/constants';
import { ServiceStatusResponseSchema } from '@shared/types';
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

async function fetchJson<T>(
  url: string,
  schema: ZodSchema<T>,
  init: RequestInit,
  authToken?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (authToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(url, { ...init, headers });
  const contentType = res.headers?.get('content-type');
  let data: unknown;

  if (res.status !== 204) {
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        throw { message: 'Invalid server response' };
      }
    } else {
      const text = await res.text();
      if (res.ok) {
        if (text.length > 0) {
          throw { message: 'Invalid server response' };
        }
      } else {
        data = text;
      }
    }
  }

  if (!res.ok) {
    const details =
      data == null
        ? undefined
        : typeof data === 'string'
          ? data
          : JSON.stringify(data);

    let message = res.statusText || 'Request failed';
    let errors: Record<string, unknown> | undefined;

    if (data != null) {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (typeof parsed === 'object' && parsed !== null) {
          const record = parsed as Record<string, unknown>;
          if (typeof record.message === 'string') {
            message = record.message;
          }
          if (record.errors && typeof record.errors === 'object') {
            errors = record.errors as Record<string, unknown>;
          }
        }
      } catch {
        // ignore
      }
    }

    throw {
      status: res.status,
      message,
      ...(errors !== undefined && { errors }),
      details,
    };
  }

  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      throw { message: 'Invalid server response' };
    }
    throw err;
  }
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
    },
    token,
  );
}
