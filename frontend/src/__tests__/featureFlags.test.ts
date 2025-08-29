import { getFeatureFlags } from '@/lib/api/feature-flags';
import { serverFetch } from '@/lib/server-fetch';

jest.mock('@/lib/server-fetch', () => ({
  serverFetch: jest.fn(),
}));

describe('getFeatureFlags', () => {
  beforeEach(() => {
    (serverFetch as jest.Mock).mockReset();
    (serverFetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ a: true }),
    });
    window.localStorage.clear();
  });

  it('fetches and caches flags', async () => {
    const first = await getFeatureFlags();
    expect(first).toEqual({ a: true });
    expect(serverFetch).toHaveBeenCalledTimes(1);

    const second = await getFeatureFlags();
    expect(second).toEqual({ a: true });
    expect(serverFetch).toHaveBeenCalledTimes(1);
  });
});

