import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServiceWorker from '@/app/ServiceWorker';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    (
      ({
        updatePrompt: 'A new version is available. Refresh now?',
        reload: 'Refresh',
        offlineNotice: 'You are offline',
      }) as Record<string, string>
    )[key],
}));

jest.mock('@/hooks/useOffline', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseOffline = require('@/hooks/useOffline').default as jest.Mock;

describe('ServiceWorker', () => {
  const originalServiceWorker = navigator.serviceWorker;
  let postMessage: jest.Mock;
  let consoleError: jest.SpyInstance;
  let retry: jest.Mock;

  beforeEach(() => {
    postMessage = jest.fn();
    retry = jest.fn();
    Object.assign(navigator, {
      serviceWorker: {
        register: jest.fn().mockResolvedValue({
          waiting: { postMessage },
          addEventListener: jest.fn(),
        }),
      },
    });
    mockUseOffline.mockReturnValue({ online: true, retry });
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    Object.assign(navigator, { serviceWorker: originalServiceWorker });
    consoleError.mockRestore();
    jest.clearAllMocks();
  });

  it('shows update prompt and posts SKIP_WAITING on reload', async () => {
    render(<ServiceWorker />);
    window.dispatchEvent(new Event('load'));

    const button = await screen.findByRole('button', { name: 'Refresh' });
    expect(
      screen.getByText('A new version is available. Refresh now?'),
    ).toBeInTheDocument();

    await userEvent.click(button).catch(() => {});
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(retry).toHaveBeenCalled();
  });

  it('shows offline notice on offline reload', () => {
    mockUseOffline.mockReturnValue({ online: false, retry: jest.fn() });
    render(<ServiceWorker />);
    expect(screen.getByText('You are offline')).toBeInTheDocument();
  });
});

describe('service worker bootstrap script', () => {
  const originalSelf = (globalThis as { self?: unknown }).self;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    if (originalSelf === undefined) {
      delete (globalThis as { self?: unknown }).self;
    } else {
      (globalThis as { self?: unknown }).self = originalSelf;
    }
    if (originalFetch === undefined) {
      delete (globalThis as { fetch?: typeof fetch }).fetch;
    } else {
      (globalThis as { fetch?: typeof fetch }).fetch = originalFetch;
    }
  });

  it('fetches the precache manifest and registers it with workbox', async () => {
    jest.resetModules();

    const precacheAndRoute = jest.fn();
    jest.doMock('workbox-precaching', () => ({ precacheAndRoute }));

    const registerRoute = jest.fn();
    jest.doMock('workbox-routing', () => ({ registerRoute }));

    jest.doMock('workbox-strategies', () => ({
      StaleWhileRevalidate: jest
        .fn()
        .mockImplementation(function StaleWhileRevalidate() {
          return {};
        }),
      CacheFirst: jest.fn().mockImplementation(function CacheFirst() {
        return {};
      }),
      NetworkFirst: jest.fn().mockImplementation(function NetworkFirst() {
        return {};
      }),
      NetworkOnly: jest.fn().mockImplementation(function NetworkOnly() {
        return {};
      }),
    }));

    jest.doMock('workbox-expiration', () => ({
      ExpirationPlugin: jest
        .fn()
        .mockImplementation(function ExpirationPlugin() {
          return {};
        }),
    }));

    const backgroundSyncMock = jest
      .fn()
      .mockImplementation(function BackgroundSyncPlugin() {
        return {};
      });
    jest.doMock('workbox-background-sync', () => ({
      BackgroundSyncPlugin: backgroundSyncMock,
    }));

    const clientsClaim = jest.fn();
    jest.doMock('workbox-core', () => ({ clientsClaim }));

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue(['/app.js', '/styles.css']),
    });
    (globalThis as { fetch?: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    const skipWaiting = jest.fn();
    (globalThis as { self?: unknown }).self = {
      skipWaiting,
      location: { origin: 'https://example.com' },
    } as ServiceWorkerGlobalScope;

    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    try {
      const swModule = await import('../../sw');
      await swModule.serviceWorkerReady;
    } finally {
      consoleError.mockRestore();
    }

    expect(fetchMock).toHaveBeenCalledWith('/api/precache-manifest', {
      credentials: 'same-origin',
    });
    expect(precacheAndRoute).toHaveBeenCalledWith(['/app.js', '/styles.css']);
    expect(skipWaiting).toHaveBeenCalled();
    expect(clientsClaim).toHaveBeenCalled();
    expect(registerRoute).toHaveBeenCalled();
    expect(backgroundSyncMock).toHaveBeenCalledWith('api-mutations', {
      maxRetentionTime: 24 * 60,
    });
  });
});
