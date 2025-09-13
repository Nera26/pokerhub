import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Page from '../index';
import { DEFAULT_AVATAR_URL } from '@shared/constants';

jest.mock('@/app/components/dashboard/Sidebar', () => () => <div />);
jest.mock('@/app/components/dashboard/DashboardModule', () => () => <div />);
jest.mock('@/lib/api/admin', () => ({
  fetchAdminTabs: jest
    .fn()
    .mockResolvedValue([
      { id: 'dashboard', title: 'Dashboard', component: './dummy' },
    ]),
  fetchAdminTabMeta: jest.fn().mockResolvedValue({
    enabled: true,
    title: 'Dashboard',
    component: './dummy',
  }),
}));
jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => ({
    data: { online: 0, revenue: 0 },
    error: null,
    isLoading: false,
  }),
}));
jest.mock('@/lib/api/profile', () => ({
  fetchProfile: jest.fn().mockResolvedValue({ avatarUrl: null }),
}));

it('falls back to DEFAULT_AVATAR_URL when no avatars are available', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('failed'));

  render(
    <QueryClientProvider client={queryClient}>
      <Page />
    </QueryClientProvider>,
  );

  const img = await screen.findByAltText('Admin avatar');
  expect(img.getAttribute('src')).toContain(
    encodeURIComponent(DEFAULT_AVATAR_URL),
  );
});
