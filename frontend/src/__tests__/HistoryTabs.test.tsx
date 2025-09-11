import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HistoryTabs from '@/app/components/user/HistoryTabs';
import type { ResponseLike } from '@/lib/api/client';

describe('HistoryTabs', () => {
  it('fetches tabs and reacts to selection', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    (global.fetch as jest.Mock).mockReset();
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

  it('renders error state on failure', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    (global.fetch as jest.Mock).mockReset();
    (
      global.fetch as jest.Mock<Promise<ResponseLike>, [string]>
    ).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      headers: { get: () => 'application/json' } as any,
      json: async () => ({ message: 'boom' }),
    });
    render(<HistoryTabs selected="game-history" onChange={jest.fn()} />, {
      wrapper,
    });
    await screen.findByRole('alert');
  });

  it('shows empty state when no tabs returned', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    (global.fetch as jest.Mock).mockReset();
    (
      global.fetch as jest.Mock<Promise<ResponseLike>, [string]>
    ).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => 'application/json' } as any,
      json: async () => ({ tabs: [] }),
    });
    render(<HistoryTabs selected="game-history" onChange={jest.fn()} />, {
      wrapper,
    });
    await screen.findByText(/no history available/i);
  });
});
