/** @jest-environment node */

import fs from 'fs';
import path from 'path';

describe('service worker install', () => {
  function loadServiceWorker() {
    const code = fs.readFileSync(
      path.join(__dirname, '../../public/sw.js'),
      'utf8',
    );
    const listeners: Record<string, any> = {};
    const workbox = {
      precaching: { precacheAndRoute: jest.fn() },
      routing: { registerRoute: jest.fn() },
      strategies: {
        StaleWhileRevalidate: function () {},
        CacheFirst: function () {},
        NetworkFirst: function () {},
        NetworkOnly: function () {},
      },
      expiration: { ExpirationPlugin: function () {} },
      backgroundSync: { BackgroundSyncPlugin: function () {} },
      core: { clientsClaim: jest.fn() },
    } as any;
    const self: any = {
      workbox,
      addEventListener: (type: string, handler: any) => {
        listeners[type] = handler;
      },
      skipWaiting: jest.fn(),
      location: { origin: 'http://localhost' },
    };
    const importScripts = jest.fn();
    // eslint-disable-next-line no-new-func
    const fn = new Function('self', 'importScripts', code);
    fn(self, importScripts);
    return listeners;
  }

  it('caches new assets when /precache output changes', async () => {
    const listeners = loadServiceWorker();
    const addAll = jest.fn();
    const originalFetch = global.fetch;
    const originalCaches = global.caches;
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ['/a.js'],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ['/a.js', '/b.js'],
      });
    global.caches = {
      open: jest.fn().mockResolvedValue({ addAll }),
    } as any;

    let promise: Promise<any> | undefined;
    listeners.install({ waitUntil: (p: Promise<any>) => (promise = p) });
    await promise;
    expect(addAll).toHaveBeenLastCalledWith(['/offline', '/a.js']);

    listeners.install({ waitUntil: (p: Promise<any>) => (promise = p) });
    await promise;
    expect(addAll).toHaveBeenLastCalledWith(['/offline', '/a.js', '/b.js']);

    global.fetch = originalFetch;
    global.caches = originalCaches;
  });
});
