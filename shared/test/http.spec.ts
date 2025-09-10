import { fetchWithRetry, fetchJson, CircuitBreakerState } from '../http';

describe('fetchWithRetry', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    (global.fetch as any) = originalFetch;
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('retries failed requests until success', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch' as any)
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));

    const res = await fetchWithRetry('http://example', {});
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('returns non-ok responses when checkOk is false', async () => {
    jest
      .spyOn(global, 'fetch' as any)
      .mockResolvedValueOnce(new Response('fail', { status: 500 }));

    const res = await fetchWithRetry('http://example', {}, { checkOk: false });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);
  });

  it('opens circuit breaker after consecutive failures and recovers', async () => {
    jest.useFakeTimers();
    const state: CircuitBreakerState = { failures: 0, openUntil: 0 };
    const circuitBreaker = {
      state,
      threshold: 2,
      cooldownMs: 30_000,
      openMessage: 'circuit breaker open',
    };
    const fetchMock = jest
      .spyOn(global, 'fetch' as any)
      .mockRejectedValue(new Error('boom'));

    let exhausted = 0;
    const opts = {
      retries: 1,
      timeoutMs: 100,
      onRetryExhausted: () => exhausted++,
      circuitBreaker,
    };

    await expect(fetchWithRetry('http://example', {}, opts)).rejects.toThrow(
      /boom/
    );
    await expect(fetchWithRetry('http://example', {}, opts)).rejects.toThrow(
      /boom/
    );

    await expect(fetchWithRetry('http://example', {}, opts)).rejects.toThrow(
      /circuit breaker open/
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(exhausted).toBe(2);

    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }));
    jest.advanceTimersByTime(30_000);

    await expect(fetchWithRetry('http://example', {}, opts)).resolves.toBeInstanceOf(
      Response
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe('fetchJson', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    (global.fetch as any) = originalFetch;
    jest.restoreAllMocks();
  });

  it('parses JSON response', async () => {
    jest
      .spyOn(global, 'fetch' as any)
      .mockResolvedValueOnce(
        new Response('{"ok":true}', { status: 200 })
      );
    await expect(fetchJson<{ ok: boolean }>('http://example', {})).resolves.toEqual({
      ok: true,
    });
  });

  it('throws on invalid JSON', async () => {
    jest
      .spyOn(global, 'fetch' as any)
      .mockResolvedValueOnce(new Response('invalid', { status: 200 }));
    await expect(fetchJson('http://example', {})).rejects.toThrow();
  });

  it('throws on non-ok responses', async () => {
    jest
      .spyOn(global, 'fetch' as any)
      .mockResolvedValue(new Response('{}', { status: 500 }));
    await expect(
      fetchJson('http://example', {}, { retries: 1 })
    ).rejects.toThrow(/HTTP 500/);
  });
});

