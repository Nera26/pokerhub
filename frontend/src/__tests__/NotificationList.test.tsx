import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationList from '@/app/components/notifications/NotificationList';
import { fetchNotifications } from '@/lib/api/notifications';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 96,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        start: index * 96,
        measureElement: () => {},
      })),
    measureElement: () => {},
  }),
}));

jest.mock('@/lib/api/notifications', () => ({
  fetchNotifications: jest.fn(),
  markAllNotificationsRead: jest.fn(),
  markNotificationRead: jest.fn(),
}));

// Polyfill required by react-virtual
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.assign(globalThis, { ResizeObserver });

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  configurable: true,
  value: () => ({ width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800 }),
});

Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  value: 600,
});

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  value: 800,
});

const mockFetchNotifications = fetchNotifications as jest.MockedFunction<typeof fetchNotifications>;

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
    renderWithClient();
    await waitFor(() => expect(screen.getByText('Hello')).toBeInTheDocument());
  });
});
