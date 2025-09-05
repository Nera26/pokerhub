import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePageClient from '@/app/(site)/HomePageClient';
import type { ResponseLike } from '@/lib/api/client';

jest.mock('@/app/components/common/chat/ChatWidget', () => {
  const ChatWidgetMock = () => <div />;
  ChatWidgetMock.displayName = 'ChatWidgetMock';
  return ChatWidgetMock;
});

describe('lobby data fallback messages', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows tables error message when table fetch fails', async () => {
    const fetchMock = jest.fn<Promise<ResponseLike>, [string]>(
      async (url: string) => {
        if (url.includes('/api/tables')) {
          return Promise.reject(new Error('Network down'));
        }
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => [],
        };
      },
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <HomePageClient />
      </QueryClientProvider>,
    );

    await screen.findByText('Failed to fetch tables: Network down');
  });

  it('shows tournaments error message when tournament fetch fails', async () => {
    const fetchMock = jest.fn<Promise<ResponseLike>, [string]>(
      async (url: string) => {
        if (url.includes('/api/tournaments')) {
          return Promise.reject(new Error('Connection lost'));
        }
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => [],
        };
      },
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={client}>
        <HomePageClient />
      </QueryClientProvider>,
    );

    const tournamentsTab = await screen.findByRole('tab', {
      name: 'Tournaments',
    });
    await user.click(tournamentsTab);

    await screen.findByText('Failed to fetch tournaments: Connection lost');
  });
});
