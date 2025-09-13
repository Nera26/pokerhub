import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Page from '../index';

jest.mock(
  '@/app/components/dashboard/Sidebar',
  () => () => React.createElement('div'),
);
jest.mock(
  '@/app/components/dashboard/DashboardModule',
  () => () => React.createElement('div'),
);
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

export function renderDashboardPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(Page),
    ),
  );
}

export function mockSiteMeta(defaultAvatar = '') {
  (global.fetch as jest.Mock).mockReset();
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({
      title: '',
      description: '',
      imagePath: '',
      defaultAvatar,
    }),
  });
}
