import { ZodError, ZodSchema } from 'zod';
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

/** Minimal representation of a `fetch` {@link Response} used in tests. */
export interface ResponseLike {
  status: number;
  statusText: string;
  ok: boolean;
  headers?: {
    get?: (name: string) => string | null;
  };
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
}

export async function checkApiContractVersion(): Promise<void> {
  const baseUrl = getBaseUrl();
  try {
    const res = fetch(`${baseUrl}/status`);
    const { contractVersion } = await handleResponse(
      res,
      ServiceStatusResponseSchema,
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

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (opts.body !== undefined) {
    headers['content-type'] = headers['content-type'] ?? 'application/json';
  }

  const res = fetch(`${baseUrl}${path}`, {
    method: opts.method ?? 'GET',
    credentials: 'include',
    headers,
    ...(opts.body !== undefined && { body: JSON.stringify(opts.body) }),
    ...(opts.signal && { signal: opts.signal }),
    ...(opts.cache && { cache: opts.cache }),
  });
  return handleResponse(res, schema);
}

/**
 * Awaits a `fetch` {@link Response}, parses JSON, and validates it with a Zod schema.
 *
 * This function is compatible with the standard browser/Node `Response`, and also works
 * with minimal `Response` mocks in tests (objects implementing `status`, `ok`, `headers.get`,
 * and `json`/`text` as async functions).
 *
 * - Network errors are converted into an {@link ApiError}.
 * - The body is parsed as JSON when possible; non-JSON bodies with content produce an error.
 * - Non-2xx responses throw an {@link ApiError} containing `status` and raw `details`.
 * - Successful payloads are validated against `schema`; validation failures throw an {@link ApiError}.
 *
 * @param resOrPromise - A `Response`/`ResponseLike` or a promise resolving to one from a `fetch` call.
 * @param schema - Zod schema describing the expected JSON payload.
 * @returns The parsed and validated response body.
 * @throws {ApiError} When the request fails, the response can't be parsed, returns a non-ok
 * status, or the payload fails schema validation.
 */
export async function handleResponse<T>(
  resOrPromise: Response | ResponseLike | Promise<Response | ResponseLike>,
  schema: ZodSchema<T>,
): Promise<T> {
  let res: Response | ResponseLike;
  try {
    res = await resOrPromise;
  } catch (err) {
    const message = err instanceof Error ? err.message : undefined;
    throw { message: message ?? 'Network error' } as ApiError;
  }

  const contentType = res.headers?.get?.('content-type');
  let data: unknown;

  // Parse body unless 204 No Content
  if (res.status !== 204) {
    const hasJson = 'json' in res && typeof res.json === 'function';
    const hasText = 'text' in res && typeof res.text === 'function';
    const expectsJson =
      (contentType && contentType.includes('application/json')) ||
      (!contentType && hasJson);

    if (expectsJson) {
      if (hasJson) {
        try {
          data = await (res as { json: () => Promise<unknown> }).json();
        } catch {
          throw { message: 'Invalid server response' } as ApiError;
        }
      } else {
        throw { message: 'Invalid server response' } as ApiError;
      }
    } else if (hasText) {
      const text = await (res as { text: () => Promise<string> }).text();
      if (res.ok) {
        if (text.length > 0) {
          throw { message: 'Invalid server response' } as ApiError;
        }
      } else {
        data = text;
      }
    } else if (res.ok) {
      throw { message: 'Invalid server response' } as ApiError;
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
        const parsed: unknown =
          typeof data === 'string' ? JSON.parse(data) : data;
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
        // ignore JSON parsing errors and fall back to default message
      }
    }

    throw {
      status: res.status,
      message,
      ...(errors !== undefined && { errors }),
      details,
    } as ApiError;
  }

  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      throw { message: 'Invalid server response' } as ApiError;
    }
    throw err;
  }
}
