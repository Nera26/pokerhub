import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import HistoryTabs from '@/app/components/user/HistoryTabs';
import type { ResponseLike } from '@/lib/api/client';

describe('HistoryTabs', () => {
  let client: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    wrapper = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    (global.fetch as jest.Mock).mockReset();
  });

  it('fetches tabs and reacts to selection', async () => {
    (
      global.fetch as jest.Mock<Promise<ResponseLike>, [string]>
    ).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'application/json' } as any,
      json: async () => ({
        tabs: [
          { key: 'game-history', label: 'Game History' },
          { key: 'tournament-history', label: 'Tournament History' },
        ],
      }),
    });
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<HistoryTabs selected="game-history" onChange={onChange} />, {
      wrapper,
    });

    await screen.findByRole('button', { name: /tournament history/i });
    await user.click(
      screen.getByRole('button', { name: /tournament history/i }),
    );
    expect(onChange).toHaveBeenCalledWith('tournament-history');
  });

  it.each([
    {
      name: 'renders error state on failure',
      response: {
        ok: false,
        status: 500,
        statusText: 'Server Error',
        headers: { get: () => 'application/json' } as any,
        json: async () => ({ message: 'boom' }),
      },
      query: () => screen.findByRole('alert'),
    },
    {
      name: 'shows empty state when no tabs returned',
      response: {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: { get: () => 'application/json' } as any,
        json: async () => ({ tabs: [] }),
      },
      query: () => screen.findByText(/no history available/i),
    },
  ])('$name', async ({ response, query }) => {
    (
      global.fetch as jest.Mock<Promise<ResponseLike>, [string]>
    ).mockResolvedValue(response);
    render(<HistoryTabs selected="game-history" onChange={jest.fn()} />, {
      wrapper,
    });
    await query();
  });
});
