import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type {
  acknowledgeAdminEvent as acknowledgeAdminEventType,
  fetchAdminTabMeta as fetchAdminTabMetaType,
  fetchAdminTabs as fetchAdminTabsType,
} from '@/lib/api/admin';
import type { fetchProfile as fetchProfileType } from '@/lib/api/profile';
import type { getSiteMetadata as getSiteMetadataType } from '@/lib/metadata';
import type { useAdminEvents as useAdminEventsType } from '@/hooks/admin';
import Page from '../index';

export const mockUseSearchParams = jest.fn<URLSearchParams, []>(
  () => new URLSearchParams(''),
);

export const mockFetchAdminTabs: jest.MockedFunction<fetchAdminTabsType> =
  jest.fn();
export const mockFetchAdminTabMeta: jest.MockedFunction<fetchAdminTabMetaType> =
  jest.fn();
export const mockAcknowledgeAdminEvent: jest.MockedFunction<acknowledgeAdminEventType> =
  jest.fn();
export const mockUseAdminEvents: jest.MockedFunction<useAdminEventsType> =
  jest.fn();
const mockFetchProfile: jest.MockedFunction<fetchProfileType> = jest.fn();
const defaultSiteMetadata = {
  title: '',
  description: '',
  imagePath: '',
  defaultAvatar: '',
};
export const mockGetSiteMetadata: jest.MockedFunction<getSiteMetadataType> =
  jest.fn();

export function mockSiteMeta(defaultAvatar = ''): void {
  mockGetSiteMetadata.mockResolvedValue({
    ...defaultSiteMetadata,
    defaultAvatar,
  });
}

mockFetchProfile.mockResolvedValue({ avatarUrl: null });
mockSiteMeta();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => mockUseSearchParams(),
}));

jest.mock('@/lib/api/admin', () => ({
  fetchAdminTabs: (...args: Parameters<fetchAdminTabsType>) =>
    mockFetchAdminTabs(...args),
  fetchAdminTabMeta: (...args: Parameters<fetchAdminTabMetaType>) =>
    mockFetchAdminTabMeta(...args),
  acknowledgeAdminEvent: (...args: Parameters<acknowledgeAdminEventType>) =>
    mockAcknowledgeAdminEvent(...args),
}));

jest.mock('@/hooks/admin', () => ({
  useAdminEvents: (...args: Parameters<useAdminEventsType>) =>
    mockUseAdminEvents(...args),
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
  fetchProfile: (...args: Parameters<fetchProfileType>) =>
    mockFetchProfile(...args),
}));

jest.mock('@/lib/metadata', () => ({
  getSiteMetadata: (...args: Parameters<getSiteMetadataType>) =>
    mockGetSiteMetadata(...args),
}));

export function resetDashboardMocks(): void {
  mockUseSearchParams.mockReset();
  mockUseSearchParams.mockReturnValue(new URLSearchParams(''));
  mockFetchAdminTabs.mockReset();
  mockFetchAdminTabMeta.mockReset();
  mockAcknowledgeAdminEvent.mockReset();
  mockUseAdminEvents.mockReset();
  mockFetchProfile.mockReset();
  mockFetchProfile.mockResolvedValue({ avatarUrl: null });
  mockGetSiteMetadata.mockReset();
  mockSiteMeta();
}

export function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rendered = render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(Page),
    ),
  );

  return { ...rendered, queryClient };
}

export function renderDashboardPage() {
  const { queryClient, ...rendered } = renderDashboard();
  void queryClient;
  return rendered;
}
