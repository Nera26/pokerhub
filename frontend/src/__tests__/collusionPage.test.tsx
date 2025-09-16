import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CollusionPage from '@/features/collusion';
import { CollusionReviewPage } from '@/app/admin/collusion/page';
import {
  listFlaggedSessions,
  applyAction,
  getActionHistory,
} from '@/lib/api/collusion';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';

jest.mock('next/dynamic', () => {
  const dynamic = () => () => (
    <div data-testid="collusion-admin">Collusion Admin</div>
  );
  return dynamic;
});

jest.mock('@/hooks/useRequireAdmin', () => ({
  useRequireAdmin: jest.fn(),
}));

jest.mock('@/lib/api/collusion', () => ({
  listFlaggedSessions: jest.fn(),
  applyAction: jest.fn(),
  getActionHistory: jest.fn(),
}));

jest.mock('@/app/store/authStore', () => ({
  useAuthToken: () => 'token',
  usePlayerId: () => 'r1',
}));

const mockUseRequireAdmin = useRequireAdmin as jest.MockedFunction<
  typeof useRequireAdmin
>;

describe('CollusionPage', () => {
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
        <CollusionPage />
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

describe('Collusion admin route', () => {
  it('renders the collusion page for admins', () => {
    mockUseRequireAdmin.mockClear();
    render(<CollusionReviewPage />);
    expect(mockUseRequireAdmin).toHaveBeenCalled();
    expect(screen.getByTestId('collusion-admin')).toBeInTheDocument();
  });
});
