import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GameTabs from '../GameTabs';
import { GameType } from '@/types/game-type';

jest.mock('@/lib/base-url', () => ({ getBaseUrl: () => 'http://localhost' }));

describe('GameTabs', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('renders tabs from API and reacts to selection', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ['texas', 'omaha'],
    }) as any;

    let selected: GameType = 'texas';
    const setGameType = jest.fn((id: GameType) => {
      selected = id;
    });

    render(<GameTabs gameType={selected} setGameType={setGameType} />, {
      wrapper,
    });

    const tab = await screen.findByRole('tab', { name: 'Omaha' });
    await userEvent.click(tab);
    expect(setGameType).toHaveBeenCalledWith('omaha');
  });
});
