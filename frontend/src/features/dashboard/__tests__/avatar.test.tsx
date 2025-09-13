import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Page from '../index';

jest.mock('@/app/components/dashboard/Sidebar', () => () => <div />);
jest.mock('@/app/components/dashboard/DashboardModule', () => () => <div />);
jest.mock('@/lib/api/admin', () => ({
  fetchAdminTabs: jest
    .fn()
    .mockResolvedValue([
      { id: 'dashboard', title: 'Dashboard', component: './dummy' },
    ]),
  fetchAdminTabMeta: jest
    .fn()
    .mockResolvedValue({
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

it('renders default avatar and updates when config changes', async () => {
  const queryClient = new QueryClient();
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ defaultAvatar: 'first.png' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ defaultAvatar: 'second.png' }),
    });

  render(
    <QueryClientProvider client={queryClient}>
      <Page />
    </QueryClientProvider>,
  );

  const img = await screen.findByAltText('Admin avatar');
  expect(img).toHaveAttribute('src', 'first.png');

  await queryClient.invalidateQueries({ queryKey: ['settings'] });
  await waitFor(() => {
    expect(img).toHaveAttribute('src', 'second.png');
  });
});
