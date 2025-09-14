import type { DefaultAvatarResponse } from '@/lib/api';

describe('api client', () => {
  it('returns typed default avatar', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: async () => ({ url: 'avatar.png' }),
    }) as any;

    const { fetchDefaultAvatar } = await import('@/lib/api');
    const res: DefaultAvatarResponse = await fetchDefaultAvatar();
    expect(res.url).toBe('avatar.png');
  });
});
