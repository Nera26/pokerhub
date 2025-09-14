import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CollusionReviewPage from '@/features/collusion';
import {
  listFlaggedSessions,
  applyAction,
  getActionHistory,
} from '@/lib/api/collusion';

jest.mock('@/lib/api/collusion', () => ({
  listFlaggedSessions: jest.fn(),
  applyAction: jest.fn(),
  getActionHistory: jest.fn(),
}));

jest.mock('@/app/store/authStore', () => ({
  useAuthToken: () => 'token',
  usePlayerId: () => 'r1',
}));

describe('CollusionReviewPage', () => {
  it('optimistically adds reviewer and reconciles with server', async () => {
    (listFlaggedSessions as jest.Mock).mockResolvedValue([
      { id: 's1', users: ['u1', 'u2'], status: 'flagged' },
    ]);
    (getActionHistory as jest.Mock).mockResolvedValue([]);
    let resolveAction: (v: unknown) => void = () => {};
    (applyAction as jest.Mock).mockReturnValue(
      new Promise((res) => {
        resolveAction = res;
      }),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <CollusionReviewPage />
      </QueryClientProvider>,
    );
    const btn = await screen.findByText('warn');
    fireEvent.click(btn);
    expect(await screen.findByText('warn by r1')).toBeInTheDocument();
    resolveAction({ action: 'warn', timestamp: 123, reviewerId: 'srv1' });
    expect(await screen.findByText('warn by srv1')).toBeInTheDocument();
    expect(applyAction).toHaveBeenCalledWith('s1', 'warn', 'token', 'r1');
  });
});
