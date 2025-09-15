/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { screen, fireEvent, waitFor, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Page from '../index';

const mockUseSearchParams = jest.fn(() => new URLSearchParams('tab=events'));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => mockUseSearchParams(),
}));

const mockFetchAdminTabs = jest.fn();
const mockFetchAdminTabMeta = jest.fn();
const mockAcknowledge = jest.fn();

jest.mock('@/lib/api/admin', () => ({
  fetchAdminTabs: (...args: any[]) => mockFetchAdminTabs(...args),
  fetchAdminTabMeta: (...args: any[]) => mockFetchAdminTabMeta(...args),
  acknowledgeAdminEvent: (...args: any[]) => mockAcknowledge(...args),
}));

const mockUseAdminEvents = jest.fn();
jest.mock('@/hooks/admin', () => ({
  useAdminEvents: (...args: any[]) => mockUseAdminEvents(...args),
}));

jest.mock(
  '@/app/components/dashboard/Sidebar',
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
jest.mock('@/lib/metadata', () => ({
  getSiteMetadata: jest.fn().mockResolvedValue({
    title: '',
    description: '',
    imagePath: '',
    defaultAvatar: '',
  }),
}));

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <Page />
    </QueryClientProvider>,
  );
  return { ...rendered, queryClient };
}

describe('events tab', () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=events'));
    mockFetchAdminTabs.mockResolvedValue([
      {
        id: 'events',
        title: 'Events',
        component: '@/app/components/dashboard/AdminEvents',
      },
    ]);
    mockFetchAdminTabMeta.mockResolvedValue({
      id: 'events',
      title: 'Events',
      component: '@/app/components/dashboard/AdminEvents',
      enabled: true,
      message: '',
    });
    mockAcknowledge.mockReset();
    mockUseAdminEvents.mockReset();
  });

  it('renders AdminEvents when tab is events', async () => {
    mockUseAdminEvents.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    renderDashboard();
    await screen.findByText('No events');
  });

  it('shows error when events API fails', async () => {
    mockUseAdminEvents.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('fail'),
    });
    renderDashboard();
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Failed to load events',
    );
  });

  it('acknowledges event and invalidates cache', async () => {
    mockUseAdminEvents.mockReturnValue({
      data: [{ id: '1', title: 't', description: 'd', date: '2024-01-01' }],
      isLoading: false,
      error: null,
    });
    mockAcknowledge.mockResolvedValue({});
    const { queryClient } = renderDashboard();
    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    await screen.findByText('t');
    fireEvent.click(screen.getByRole('button', { name: /acknowledge/i }));
    await waitFor(() => {
      expect(mockAcknowledge).toHaveBeenCalledWith('1');
      expect(spy).toHaveBeenCalledWith({ queryKey: ['admin-events'] });
    });
  });
});
