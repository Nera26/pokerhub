importScripts('/workbox-4754cb34.js');

const { precacheAndRoute } = self.workbox.precaching;
const { registerRoute } = self.workbox.routing;
const { StaleWhileRevalidate, CacheFirst, NetworkFirst, NetworkOnly } =
  self.workbox.strategies;
const { ExpirationPlugin } = self.workbox.expiration;
const { BackgroundSyncPlugin } = self.workbox.backgroundSync;

self.skipWaiting();
self.workbox.core.clientsClaim();

// Injected at build time
precacheAndRoute(self.__WB_MANIFEST || []);

const OFFLINE_URL = '/offline';
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('offline-cache').then((cache) => cache.addAll([OFFLINE_URL])),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL)),
    );
  }
});

// Static asset caching
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

// API calls
registerRoute(
  ({ url }) =>
    url.origin === self.location.origin && url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api',
    networkTimeoutSeconds: 10,
    plugins: [new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 })],
  }),
);

// Background sync for mutations
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

self.addEventListener('message', async (event) => {
  if (event.data?.type === 'QUEUE_MUTATION') {
    const { url, init } = event.data.payload;
    const request = new Request(url, init);
    await bgSyncPlugin.queue.pushRequest({ request });
  }
});
