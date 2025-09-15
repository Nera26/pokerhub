import { afterEach } from '@jest/globals';

export function setupFetch(
  body: unknown,
  headers: HeadersInit = { 'content-type': 'application/json' },
) {
  let init: RequestInit;
  const mock = jest.fn().mockImplementation(async (_url, options) => {
    init = options as RequestInit;
    return {
      ok: true,
      headers: new Headers(headers),
      json: async () => body,
    } as Response;
  });
  global.fetch = mock as any;
  return {
    mock,
    get init() {
      return init;
    },
  };
}

afterEach(() => {
  (global.fetch as jest.Mock | undefined)?.mockReset?.();
});
