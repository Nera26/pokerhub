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
