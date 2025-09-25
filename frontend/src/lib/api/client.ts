import { type ZodSchema } from 'zod';
import { fetchJson, type ApiError } from '@shared/utils/http';
import { API_CONTRACT_VERSION } from '@shared/constants';
import { ServiceStatusResponseSchema } from '@shared/types';
import { getBaseUrl } from '@/lib/base-url';
import { useAuthStore } from '@/app/store/authStore';
import { dispatchContractMismatch } from '@/components/ContractMismatchNotice';

export type { ApiError };

export type ResponseLike = {
  status: number;
  statusText: string;
  ok: boolean;
  headers?: { get(name: string): string | null };
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
};

export async function handleResponse<T>(
  responseOrPromise: ResponseLike | Promise<ResponseLike>,
  schema: ZodSchema<T>,
): Promise<T> {
  let res: ResponseLike;
  try {
    res = await responseOrPromise;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? 'Unknown error');
    throw { message } satisfies ApiError;
  }

  const invalidResponseError = {
    message: 'Invalid server response',
  } satisfies ApiError;

  const contentType = res.headers?.get?.('content-type') ?? '';
  let data: unknown;

  if (res.status !== 204) {
    if (contentType.includes('application/json')) {
      if (!res.json) {
        throw invalidResponseError;
      }
      try {
        data = await res.json();
      } catch {
        throw invalidResponseError;
      }
    } else {
      if (!res.text) {
        throw invalidResponseError;
      }
      const text = await res.text();
      if (res.ok) {
        if (text.length > 0) {
          throw invalidResponseError;
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
        // ignore parse errors
      }
    }

    throw {
      status: res.status,
      message,
      ...(errors !== undefined && { errors }),
      details,
    } satisfies ApiError;
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw invalidResponseError;
  }

  return parsed.data;
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
