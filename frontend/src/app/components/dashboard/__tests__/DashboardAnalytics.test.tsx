import { setupDashboardMocks } from './dashboardMocks';
import { renderWithClient } from './renderWithClient';
import { screen } from '@testing-library/react';

jest.mock('../analytics/Analytics', () => () => (
  <div data-testid="analytics" />
));

const authMock = jest.fn();
jest.mock('@/app/store/authStore', () => ({
  useAuthToken: () => authMock(),
}));

const adminToken = 'a.eyJyb2xlIjoiYWRtaW4ifQ==.b';

describe('Dashboard analytics', () => {
  beforeEach(() => {
    setupDashboardMocks();
    authMock.mockReset();
  });

  it('renders analytics component for admins', async () => {
    authMock.mockReturnValue(adminToken);
    const { default: Dashboard } = await import('../Dashboard');
    renderWithClient(<Dashboard />);
    expect(screen.getByTestId('analytics')).toBeInTheDocument();
  });

  it('hides analytics component for non-admins', async () => {
    authMock.mockReturnValue(null);
    const { default: Dashboard } = await import('../Dashboard');
    renderWithClient(<Dashboard />);
    expect(screen.queryByTestId('analytics')).toBeNull();
  });
});
