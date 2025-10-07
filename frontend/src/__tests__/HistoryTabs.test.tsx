import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import HistoryTabs from '@/components/user/history-tabs';
import type { ResponseLike } from '@/lib/api/client';

function mockTabs(tabs: Array<{ key: string; label: string }>) {
  (
    global.fetch as jest.Mock<Promise<ResponseLike>, [string]>
  ).mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: () => 'application/json' } as any,
    json: async () => ({ tabs }),
  });
}

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

  it('renders history tabs from API', async () => {
    mockTabs([
      { key: 'game-history', label: 'Game History' },
      { key: 'tournament-history', label: 'Tournament History' },
      { key: 'transaction-history', label: 'Deposit/Withdraw' },
    ]);
    render(<HistoryTabs selected="game-history" onChange={jest.fn()} />, {
      wrapper,
    });

    expect(
      await screen.findByRole('button', { name: /game history/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /tournament history/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /deposit\/withdraw/i }),
    ).toBeInTheDocument();
  });

  it('fetches tabs and reacts to selection', async () => {
    mockTabs([
      { key: 'game-history', label: 'Game History' },
      { key: 'tournament-history', label: 'Tournament History' },
    ]);
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
      setup: () =>
        (
          global.fetch as jest.Mock<Promise<ResponseLike>, [string]>
        ).mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Server Error',
          headers: { get: () => 'application/json' } as any,
          json: async () => ({ message: 'boom' }),
        }),
      query: () => screen.findByRole('alert'),
    },
    {
      name: 'shows empty state when no tabs returned',
      setup: () => mockTabs([]),
      query: () => screen.findByText(/no history available/i),
    },
  ])('$name', async ({ setup, query }) => {
    setup();
    render(<HistoryTabs selected="game-history" onChange={jest.fn()} />, {
      wrapper,
    });
    await query();
  });
});
