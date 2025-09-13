import { screen } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';
import Dashboard from '../Dashboard';

jest.mock('../FeatureFlagsPanel', () => () => (
  <div data-testid="feature-flags" />
));
jest.mock('../AdminEvents', () => () => <div />);
jest.mock('../Messages', () => () => <div />);
jest.mock('../BroadcastPanel', () => () => <div />);

jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => ({
    data: {
      online: 0,
      revenue: { today: { amount: 0 } },
      tables: { open: 0 },
      tournaments: { total: 0 },
      deposits: { today: { amount: 0 } },
      withdrawals: { today: { amount: 0 } },
    },
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@/hooks/useRevenueBreakdown', () => ({
  useRevenueBreakdown: () => ({ data: [], isLoading: false, error: null }),
}));

jest.mock('@/hooks/useDashboardUsers', () => ({
  useDashboardUsers: () => ({ data: [], isLoading: false, error: null }),
}));

jest.mock('@/hooks/useActiveTables', () => ({
  useActiveTables: () => ({ data: [], isLoading: false, error: null }),
}));

jest.mock('@/hooks/useActivity', () => ({
  useActivity: () => ({
    data: { labels: [], data: [] },
    isLoading: false,
    error: null,
  }),
}));

const authMock = jest.fn();
jest.mock('@/app/store/authStore', () => ({
  useAuthToken: () => authMock(),
}));

const adminToken = 'a.eyJyb2xlIjoiYWRtaW4ifQ==.b';
const userToken = 'a.eyJyb2xlIjoidXNlciJ9.b';

describe('Dashboard feature flags visibility', () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it('shows feature flags for admins', () => {
    authMock.mockReturnValue(adminToken);
    renderWithClient(<Dashboard />);
    expect(screen.getByTestId('feature-flags')).toBeInTheDocument();
  });

  it('hides feature flags for non-admins', () => {
    authMock.mockReturnValue(userToken);
    renderWithClient(<Dashboard />);
    expect(screen.queryByTestId('feature-flags')).toBeNull();
  });
});
