interface MockResponse {
  status: number;
  payload: unknown;
}

/**
 * Mocks global `fetch` with the provided responses.
 * Each call to the mocked function resolves sequentially with the
 * corresponding payload and HTTP status.
 */
export function mockFetch(...responses: MockResponse[]) {
  const mock = fetch as unknown as jest.Mock;
  responses.forEach(({ status, payload }) => {
    mock.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      headers: { get: () => 'application/json' },
      json: async () => payload,
    });
  });
  return mock;
}

export function mockFetchLoading() {
  global.fetch = jest.fn(
    () => new Promise(() => {}),
  ) as unknown as typeof fetch;
}

export function mockFetchSuccess(data: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => data,
    headers: { get: () => 'application/json' },
  }) as unknown as typeof fetch;
}

export function mockFetchError(
  payload: unknown = { error: 'fail' },
  status = 500,
  statusText = 'Server Error',
) {
  const mock = fetch as unknown as jest.Mock;
  mock.mockResolvedValue({
    ok: false,
    status,
    statusText,
    json: async () => payload,
    headers: { get: () => 'application/json' },
  });
  return mock;
}
