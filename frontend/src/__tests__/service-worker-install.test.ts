/** @jest-environment node */

import { precacheOnInstall } from '../../sw-install';

describe('service worker install', () => {
  it('caches new assets when /precache output changes', async () => {
    const addAll = jest.fn();
    const originalFetch = global.fetch;
    const originalCaches = global.caches;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ['/a.js'] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ['/a.js', '/b.js'],
      });
    global.caches = {
      open: jest.fn().mockResolvedValue({ addAll }),
    } as any;

    await precacheOnInstall();
    expect(addAll).toHaveBeenLastCalledWith(['/offline', '/a.js']);

    await precacheOnInstall();
    expect(addAll).toHaveBeenLastCalledWith(['/offline', '/a.js', '/b.js']);

    global.fetch = originalFetch;
    global.caches = originalCaches;
  });
});
