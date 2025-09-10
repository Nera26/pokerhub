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

describe('ServiceWorker', () => {
  const originalServiceWorker = navigator.serviceWorker;
  let postMessage: jest.Mock;
  let consoleError: jest.SpyInstance;
  let originalFetch: typeof fetch;
  let originalCaches: typeof caches;

  beforeEach(() => {
    postMessage = jest.fn();
    Object.assign(navigator, {
      serviceWorker: {
        register: jest.fn().mockResolvedValue({
          waiting: { postMessage },
          addEventListener: jest.fn(),
        }),
      },
    });
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    originalFetch = global.fetch;
    originalCaches = global.caches;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ['/', '/offline', '/favicon.ico'],
    } as any);
    const addAll = jest.fn();
    global.caches = {
      open: jest.fn().mockResolvedValue({ addAll }),
    } as any;
  });

  afterEach(() => {
    Object.assign(navigator, { serviceWorker: originalServiceWorker });
    consoleError.mockRestore();
    global.fetch = originalFetch;
    global.caches = originalCaches;
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
  });

  it('pre-caches assets fetched from backend', async () => {
    render(<ServiceWorker />);
    window.dispatchEvent(new Event('load'));
    await screen.findByRole('button', { name: 'Refresh' });
    expect(global.fetch).toHaveBeenCalledWith('/api/precache');
    const cache = await (global.caches.open as any).mock.results[0].value;
    expect(cache.addAll).toHaveBeenCalledWith([
      '/',
      '/offline',
      '/favicon.ico',
    ]);
  });

  it('falls back to empty list on fetch error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network'));
    const addAll = jest.fn();
    (global.caches.open as jest.Mock).mockResolvedValueOnce({ addAll });

    render(<ServiceWorker />);
    window.dispatchEvent(new Event('load'));
    await screen.findByRole('button', { name: 'Refresh' });
    expect(addAll).toHaveBeenCalledWith([]);
  });

  it('shows offline notice on offline reload', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
    });
    render(<ServiceWorker />);
    expect(screen.getByText('You are offline')).toBeInTheDocument();
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
    });
  });
});
