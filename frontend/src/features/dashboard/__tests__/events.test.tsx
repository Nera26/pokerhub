import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  mockAcknowledgeAdminEvent,
  mockFetchAdminTabMeta,
  mockFetchAdminTabs,
  mockUseAdminEvents,
  mockUseSearchParams,
  renderDashboard,
  resetDashboardMocks,
} from './test-utils';

describe('events tab', () => {
  beforeEach(() => {
    resetDashboardMocks();
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
    mockAcknowledgeAdminEvent.mockResolvedValue({});
    const { queryClient } = renderDashboard();
    const spy = jest.spyOn(queryClient, 'invalidateQueries');
    await screen.findByText('t');
    fireEvent.click(screen.getByRole('button', { name: /acknowledge/i }));
    await waitFor(() => {
      expect(mockAcknowledgeAdminEvent).toHaveBeenCalledWith('1');
      expect(spy).toHaveBeenCalledWith({ queryKey: ['admin-events'] });
    });
  });
});
