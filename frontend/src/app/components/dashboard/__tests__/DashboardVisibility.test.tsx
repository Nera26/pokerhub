import { setupDashboardMocks } from './dashboardMocks';
import { screen } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';

jest.mock('../AdminEvents', () => () => <div data-testid="admin-events" />);
jest.mock('../FeatureFlagsPanel', () => () => (
  <div data-testid="feature-flags" />
));
jest.mock('../Messages', () => () => <div />);
jest.mock('../BroadcastPanel', () => () => <div />);

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
    setupDashboardMocks();
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
