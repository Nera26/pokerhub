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
      if (!res.ok) {
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

