import { screen } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';

jest.mock('../AdminEvents', () => () => <div data-testid="admin-events" />);
jest.mock('../FeatureFlagsPanel', () => () => (
  <div data-testid="feature-flags" />
));
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

const cases = [
  { component: 'AdminEvents', selector: 'admin-events' },
  { component: 'FeatureFlagsPanel', selector: 'feature-flags' },
] as const;

describe('Dashboard component visibility', () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  test.each(cases)('shows %s for admins', async ({ component, selector }) => {
    authMock.mockReturnValue(adminToken);
    await import(`../${component}`);
    const { default: Dashboard } = await import('../Dashboard');
    renderWithClient(<Dashboard />);
    expect(screen.getByTestId(selector)).toBeInTheDocument();
  });

  test.each(cases)(
    'hides %s for non-admins',
    async ({ component, selector }) => {
      authMock.mockReturnValue(userToken);
      await import(`../${component}`);
      const { default: Dashboard } = await import('../Dashboard');
      renderWithClient(<Dashboard />);
      expect(screen.queryByTestId(selector)).toBeNull();
    },
  );
});
