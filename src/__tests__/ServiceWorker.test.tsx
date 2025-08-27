import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServiceWorker from '@/app/ServiceWorker';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    (
      ({
        updatePrompt: 'A new version is available. Refresh now?',
        reload: 'Refresh',
      }) as Record<string, string>
    )[key],
}));

describe('ServiceWorker', () => {
  const originalServiceWorker = navigator.serviceWorker;
  let postMessage: jest.Mock;
  let consoleError: jest.SpyInstance;

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
  });
});
