import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import Messages from '@/app/components/dashboard/Messages';

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe('Messages dashboard', () => {
  const origFetch = global.fetch;
  afterEach(() => {
    global.fetch = origFetch;
    jest.clearAllMocks();
  });

  it('shows spinner and lists messages then refetches on reply', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          messages: [
            {
              id: 1,
              sender: 'Alice',
              userId: 'u1',
              avatar: '/a.png',
              subject: 'Hi',
              preview: 'Hi',
              content: 'Hello',
              time: '2024',
              read: false,
            },
          ],
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'sent' }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ messages: [] }),
      } as unknown as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    renderWithClient(<Messages />);

    expect((await screen.findAllByText('Hi'))[0]).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByText('Reply'));
    await user.type(
      screen.getByPlaceholderText('Type your reply here...'),
      'hello',
    );
    await user.click(screen.getByText('Send Reply'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  });

  it('shows empty state', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ messages: [] }),
    } as unknown as Response);

    renderWithClient(<Messages />);
    expect(await screen.findByText('No messages.')).toBeInTheDocument();
  });

  it('shows error banner', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server error',
      json: async () => ({ message: 'fail' }),
    } as unknown as Response);

    renderWithClient(<Messages />);
    expect(
      await screen.findByText('fail'),
    ).toBeInTheDocument();
  });
});
