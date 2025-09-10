import { ZodError, ZodSchema } from 'zod';

export interface CircuitBreakerState {
  failures: number;
  openUntil: number;
}

export interface CircuitBreakerOptions {
  state: CircuitBreakerState;
  threshold: number;
  cooldownMs: number;
  openMessage: string;
}

export interface FetchRetryOptions {
  retries?: number;
  timeoutMs?: number;
  backoffMs?: number;
  checkOk?: boolean;
  onRetryExhausted?: () => void;
  circuitBreaker?: CircuitBreakerOptions;
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  opts: FetchRetryOptions = {},
): Promise<Response> {
  const {
    retries = 3,
    timeoutMs = 5_000,
    backoffMs = 100,
    checkOk = true,
    onRetryExhausted,
    circuitBreaker,
  } = opts;

  if (circuitBreaker && Date.now() < circuitBreaker.state.openUntil) {
    throw new Error(circuitBreaker.openMessage);
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      if (checkOk && !res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      if (circuitBreaker) {
        circuitBreaker.state.failures = 0;
      }
      return res;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      if (attempt === retries) break;
      const delay = backoffMs * 2 ** (attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  if (circuitBreaker) {
    circuitBreaker.state.failures += 1;
    if (circuitBreaker.state.failures >= circuitBreaker.threshold) {
      circuitBreaker.state.openUntil = Date.now() + circuitBreaker.cooldownMs;
      circuitBreaker.state.failures = 0;
    }
  }

  onRetryExhausted?.();

  const message =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Request to ${url} failed after ${retries} attempts: ${message}`);
}

export async function fetchJson<T = unknown>(
  url: string,
  init: RequestInit,
  opts?: FetchRetryOptions,
): Promise<T>;
export async function fetchJson<T = unknown>(
  url: string,
  schema: ZodSchema<T>,
  init: RequestInit,
  authToken?: string,
  opts?: FetchRetryOptions,
): Promise<T>;
export async function fetchJson<T = unknown>(
  url: string,
  arg2: RequestInit | ZodSchema<T>,
  arg3?: RequestInit | string | FetchRetryOptions,
  arg4?: string | FetchRetryOptions,
  arg5?: FetchRetryOptions,
): Promise<T> {
  let schema: ZodSchema<T> | undefined;
  let init: RequestInit;
  let authToken: string | undefined;
  let opts: FetchRetryOptions | undefined;

  if (typeof arg2 === 'object' && 'safeParse' in arg2) {
    schema = arg2 as ZodSchema<T>;
    init = arg3 as RequestInit;
    if (typeof arg4 === 'string' || arg4 === undefined) {
      authToken = arg4 as string | undefined;
      opts = arg5 as FetchRetryOptions | undefined;
    } else {
      opts = arg4 as FetchRetryOptions | undefined;
    }
  } else {
    init = arg2 as RequestInit;
    opts = arg3 as FetchRetryOptions | undefined;
  }

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (authToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetchWithRetry(
    url,
    { ...init, headers },
    { checkOk: false, ...(opts ?? {}) },
  );

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

  if (schema) {
    try {
      return schema.parse(data);
    } catch (err) {
      if (err instanceof ZodError) {
        throw { message: 'Invalid server response' };
      }
      throw err;
    }
  }

  return data as T;
}
