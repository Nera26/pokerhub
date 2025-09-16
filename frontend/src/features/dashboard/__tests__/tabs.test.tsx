import { screen } from '@testing-library/react';
import {
  mockFetchAdminTabMeta,
  mockFetchAdminTabs,
  mockUseSearchParams,
  renderDashboard,
  resetDashboardMocks,
} from './test-utils';

beforeEach(() => {
  resetDashboardMocks();
  mockUseSearchParams.mockReturnValue(new URLSearchParams(''));
});

describe('admin tabs', () => {
  it('shows loading indicator while tabs are loading', () => {
    mockFetchAdminTabs.mockReturnValue(new Promise(() => {}));
    mockFetchAdminTabMeta.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('shows empty state when no tabs returned', async () => {
    mockFetchAdminTabs.mockResolvedValue([]);
    mockFetchAdminTabMeta.mockResolvedValue({
      enabled: false,
      title: 'Dashboard',
      message: 'No tabs available.',
      component: '',
    });
    renderDashboard();
    await screen.findByText('No tabs available.');
  });

  it('shows error message from failed tabs request', async () => {
    mockFetchAdminTabs.mockRejectedValue(new Error('boom'));
    mockFetchAdminTabMeta.mockRejectedValue(new Error('boom'));
    renderDashboard();
    await screen.findByText('boom');
  });

  it('renders disabled tab message from meta', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=broadcast'));
    mockFetchAdminTabs.mockResolvedValue([
      { id: 'dashboard', title: 'Dashboard', component: './dummy' },
    ]);
    mockFetchAdminTabMeta.mockResolvedValue({
      enabled: false,
      title: 'Broadcast',
      message: 'Coming soon',
      component: '',
    });
    renderDashboard();
    await screen.findByText('Coming soon');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Broadcast' }),
    ).toBeInTheDocument();
  });

  it('displays error message when tab meta fetch fails', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=broadcast'));
    mockFetchAdminTabs.mockResolvedValue([
      { id: 'dashboard', title: 'Dashboard', component: './dummy' },
    ]);
    mockFetchAdminTabMeta.mockRejectedValue(new Error('Not found'));
    renderDashboard();
    await screen.findByText('Not found');
  });
});
