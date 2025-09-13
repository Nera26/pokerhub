import { mockUseActivity } from '@/test-utils/mockActivity';

const activityMock = mockUseActivity();

jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => ({ data: {}, isLoading: false, error: null }),
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
  useActivity: () => activityMock(),
}));

export function setupDashboardMocks() {
  activityMock.mockReturnValue({
    data: { labels: [], data: [] },
    isLoading: false,
    error: null,
  });
}
