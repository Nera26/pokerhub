/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen } from '@testing-library/react';
import { mockSiteMeta, renderDashboardPage } from './helpers';

const mockUseSearchParams = jest.fn(() => new URLSearchParams(''));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => mockUseSearchParams(),
}));

const mockFetchAdminTabs = jest.fn();
const mockFetchAdminTabMeta = jest.fn();
jest.mock('@/lib/api/admin', () => ({
  fetchAdminTabs: (...args: any[]) => mockFetchAdminTabs(...args),
  fetchAdminTabMeta: (...args: any[]) => mockFetchAdminTabMeta(...args),
}));

beforeEach(() => {
  mockUseSearchParams.mockReturnValue(new URLSearchParams(''));
  mockFetchAdminTabs.mockReset();
  mockFetchAdminTabMeta.mockReset();
  mockSiteMeta('');
});

describe('admin tabs', () => {
  it('shows loading indicator while tabs are loading', () => {
    mockFetchAdminTabs.mockReturnValue(new Promise(() => {}));
    renderDashboardPage();
    expect(screen.getByText('Loading tabs...')).toBeInTheDocument();
  });

  it('shows empty state when no tabs returned', async () => {
    mockFetchAdminTabs.mockResolvedValue([]);
    renderDashboardPage();
    await screen.findByText('No tabs available.');
  });

  it('shows error message from failed tabs request', async () => {
    mockFetchAdminTabs.mockRejectedValue(new Error('boom'));
    mockFetchAdminTabMeta.mockResolvedValue({
      enabled: false,
      title: 'Dashboard',
      message: 'meta',
      component: '',
    });
    renderDashboardPage();
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent('boom');
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
    renderDashboardPage();
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
    renderDashboardPage();
    await screen.findByText('Not found');
  });
});
