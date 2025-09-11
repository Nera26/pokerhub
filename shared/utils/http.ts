import { ZodError, type ZodSchema } from 'zod';

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

export async function fetchJson<T>(
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
        throw { message: 'Invalid server response' } satisfies ApiError;
      }
    } else {
      const text = await res.text();
      if (res.ok) {
        if (text.length > 0) {
          throw { message: 'Invalid server response' } satisfies ApiError;
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
    } satisfies ApiError;
  }

  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      throw { message: 'Invalid server response' } satisfies ApiError;
    }
    throw err;
  }
}

export type { ApiError };
