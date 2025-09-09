import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationList from '@/app/components/notifications/NotificationList';
import { fetchNotifications, fetchUnreadCount } from '@/lib/api/notifications';
import { useNotificationFilters } from '@/hooks/notifications';

jest.mock('@/lib/api/notifications', () => ({
  fetchNotifications: jest.fn(),
  markAllNotificationsRead: jest.fn(),
  markNotificationRead: jest.fn(),
  fetchUnreadCount: jest.fn(),
}));

jest.mock('@/hooks/notifications', () => {
  const actual = jest.requireActual('@/hooks/notifications');
  return {
    ...actual,
    useNotificationFilters: jest.fn(),
  };
});

const mockFetchNotifications = fetchNotifications as jest.MockedFunction<typeof fetchNotifications>;
const mockFetchUnreadCount =
  fetchUnreadCount as jest.MockedFunction<typeof fetchUnreadCount>;
const mockUseNotificationFilters =
  useNotificationFilters as jest.MockedFunction<typeof useNotificationFilters>;

function renderWithClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <NotificationList />
    </QueryClientProvider>
  );
}

describe('NotificationList', () => {
  beforeEach(() => {
    mockFetchNotifications.mockReset();
    mockFetchUnreadCount.mockReset();
    mockUseNotificationFilters.mockReset();
    mockUseNotificationFilters.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);
    mockFetchUnreadCount.mockResolvedValue({ count: 0 });
  });

  it('shows loading skeleton', () => {
    mockFetchNotifications.mockReturnValue(new Promise(() => {}));
    const { container } = renderWithClient();
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(5);
  });

  it('renders error state', async () => {
    mockFetchNotifications.mockRejectedValue(new Error('fail'));
    renderWithClient();
    await waitFor(() =>
      expect(screen.getByText(/failed to load notifications/i)).toBeInTheDocument()
    );
  });

  it('renders empty state', async () => {
    mockFetchNotifications.mockResolvedValue({ notifications: [] });
    mockFetchUnreadCount.mockResolvedValue({ count: 0 });
    renderWithClient();
    await waitFor(() =>
      expect(screen.getByText(/no notifications found/i)).toBeInTheDocument()
    );
  });

  it('renders populated list', async () => {
    mockFetchNotifications.mockResolvedValue({
      notifications: [
        {
          id: '1',
          type: 'system',
          title: 'Hello',
          message: 'world',
          timestamp: new Date(),
          read: false,
        },
      ],
    });
    mockFetchUnreadCount.mockResolvedValue({ count: 1 });
    renderWithClient();
    await waitFor(() => expect(screen.getByText('Hello')).toBeInTheDocument());
  });

  it('filters notifications using server options', async () => {
    mockUseNotificationFilters.mockReturnValue({
      data: [
        { label: 'Bonuses', value: 'bonus' },
        { label: 'System', value: 'system' },
      ],
      isLoading: false,
      error: null,
    } as any);
    mockFetchNotifications.mockResolvedValue({
      notifications: [
        {
          id: '1',
          type: 'bonus',
          title: 'Bonus',
          message: 'bonus msg',
          timestamp: new Date(),
          read: false,
        },
        {
          id: '2',
          type: 'system',
          title: 'System',
          message: 'system msg',
          timestamp: new Date(),
          read: false,
        },
      ],
    });
    mockFetchUnreadCount.mockResolvedValue({ count: 2 });
    renderWithClient();
    await waitFor(() => expect(screen.getByText('Bonus')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Bonuses' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'System' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'System' }));
    expect(screen.queryByText('bonus msg')).not.toBeInTheDocument();
    expect(screen.getByText('system msg')).toBeInTheDocument();
  });
});
