import { describe, expect, it } from '@jest/globals';
import './setupFetch';

describe('api client', () => {
  it('propagates auth token in headers', async () => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_BASE_URL = 'http://example.com';
    const { useAuthStore } = await import('@/app/store/authStore');
    useAuthStore.setState({ token: 'secret' } as any);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ withdrawals: [] }),
    }) as any;
    const { fetchPendingWithdrawals } = await import('@/lib/api');
    await fetchPendingWithdrawals();
    expect(global.fetch).toHaveBeenCalledWith(
      'http://example.com/admin/withdrawals',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer secret',
        }),
      }),
    );
  });

  it('fetches default avatar', async () => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_BASE_URL = 'http://example.com';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ defaultAvatar: 'https://example.com/avatar.png' }),
    }) as any;
    const { fetchDefaultAvatar } = await import('@/lib/api');
    const res = await fetchDefaultAvatar();
    expect(res.defaultAvatar).toBe('https://example.com/avatar.png');
  });
});
