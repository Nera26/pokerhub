import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import {
  StaleWhileRevalidate,
  CacheFirst,
  NetworkFirst,
  NetworkOnly,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

if (typeof self !== 'undefined') {
  self.skipWaiting();
  clientsClaim();
  precacheAndRoute(self.__WB_MANIFEST || []);

  registerRoute(
    ({ request }) => request.destination === 'script',
    new StaleWhileRevalidate({
      cacheName: 'static-js',
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
    }),
  );

  registerRoute(
    ({ request }) => request.destination === 'style',
    new StaleWhileRevalidate({
      cacheName: 'static-css',
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
    }),
  );

  registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
      cacheName: 'static-images',
      plugins: [
        new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    }),
  );

  registerRoute(
    ({ request }) => request.destination === 'font',
    new CacheFirst({
      cacheName: 'static-fonts',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        }),
      ],
    }),
  );

  registerRoute(
    ({ url }) =>
      url.origin === self.location.origin && url.pathname.startsWith('/api/'),
    new NetworkFirst({
      cacheName: 'api',
      networkTimeoutSeconds: 10,
      plugins: [new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 })],
    }),
  );

  const bgSyncPlugin = new BackgroundSyncPlugin('api-mutations', {
    maxRetentionTime: 24 * 60,
  });

  ['POST', 'PUT', 'DELETE'].forEach((method) => {
    registerRoute(
      ({ url }) =>
        url.origin === self.location.origin && url.pathname.startsWith('/api/'),
      new NetworkOnly({ plugins: [bgSyncPlugin] }),
      method,
    );
  });
}
