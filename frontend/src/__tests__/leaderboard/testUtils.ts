import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeaderboardPage from '@/features/site/leaderboard';
import type { LeaderboardEntry } from '@shared/types';

jest.mock('@fortawesome/react-fontawesome', () => ({
  __esModule: true,
  FontAwesomeIcon: () => null,
}));

jest.mock('@/app/components/leaderboard/LeaderboardTabs', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/app/components/ui/ToastNotification', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/lib/api/profile');

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

export function renderLeaderboardPage(
  queryClient: QueryClient = new QueryClient(),
) {
  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(LeaderboardPage),
    ),
  );
}

export function makeLeaderboardEntry(
  overrides: Partial<LeaderboardEntry> = {},
): LeaderboardEntry {
  return {
    playerId: 'p1',
    rank: 1,
    points: 0,
    rd: 0,
    volatility: 0,
    net: 100,
    bb100: 10,
    hours: 1,
    roi: 0,
    finishes: {},
    ...overrides,
  };
}
