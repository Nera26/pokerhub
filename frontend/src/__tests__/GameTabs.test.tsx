import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GameTabs from '@/app/components/home/GameTabs';
import type { ResponseLike } from '@/lib/api/client';

describe('GameTabs', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches tabs from API and reacts to selection', async () => {
    const client = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    global.fetch = jest.fn<Promise<ResponseLike>, [string]>().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => [
        { id: 'texas', label: "Texas Hold'em" },
        { id: 'tournaments', label: 'Tourneys' },
      ],
    });
    const setGameType = jest.fn();
    const user = userEvent.setup();
    render(<GameTabs gameType="texas" setGameType={setGameType} />, { wrapper });

    await screen.findByRole('tab', { name: /tourneys/i });
    await user.click(screen.getByRole('tab', { name: /tourneys/i }));
    expect(setGameType).toHaveBeenCalledWith('tournaments');
  });
});
