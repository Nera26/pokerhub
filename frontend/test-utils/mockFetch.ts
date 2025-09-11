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
