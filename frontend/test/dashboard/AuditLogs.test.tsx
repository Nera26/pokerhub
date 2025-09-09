import { render, screen } from '@testing-library/react';
import AuditLogs from '@/app/components/dashboard/AuditLogs';
import { useAuditLogs, useAuditAlerts } from '@/hooks/useAuditResource';
import { useAdminOverview } from '@/hooks/useAdminOverview';
import { useAdminEvents } from '@/hooks/useAdminEvents';
import { AUDIT_LOG_TYPES } from '@shared/types';

jest.mock('@/hooks/useAuditResource', () => ({
  __esModule: true,
  useAuditLogs: jest.fn(),
  useAuditAlerts: jest.fn(),
}));
jest.mock('@/hooks/useAdminOverview');
jest.mock('@/hooks/useAdminEvents');

describe('AuditLogs component states', () => {
  beforeEach(() => {
    (useAuditLogs as jest.Mock).mockReset();
    (useAuditAlerts as jest.Mock).mockReset();
    (useAdminOverview as jest.Mock).mockReset();
    (useAdminEvents as jest.Mock).mockReset();
  });

  it('shows loading state', () => {
    (useAuditLogs as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
    (useAuditAlerts as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    (useAdminOverview as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    (useAdminEvents as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    render(<AuditLogs />);
    expect(screen.getByLabelText('loading')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    (useAuditLogs as jest.Mock).mockReturnValue({
      data: { logs: [] },
      isLoading: false,
      error: null,
    });
    (useAuditAlerts as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    (useAdminOverview as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    (useAdminEvents as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    render(<AuditLogs />);
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('No security alerts')).toBeInTheDocument();
    expect(screen.getByText('No admin activity')).toBeInTheDocument();
    expect(screen.getByText('No events')).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useAuditLogs as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: 'fail' },
    });
    (useAuditAlerts as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    (useAdminOverview as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    (useAdminEvents as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    render(<AuditLogs />);
    expect(screen.getByRole('alert')).toHaveTextContent('fail');
  });

  it('shows data', () => {
    (useAuditLogs as jest.Mock).mockReturnValue({
      data: {
        logs: [
          {
            id: 1,
            timestamp: '2024-01-01T00:00:00Z',
            type: AUDIT_LOG_TYPES[0],
            description: 'desc',
            user: 'admin',
            ip: '1.1.1.1',
          },
        ],
      },
      isLoading: false,
      error: null,
    });
    (useAuditAlerts as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'a1',
          severity: 'danger',
          title: 'Alert',
          body: 'body',
          time: '2024-01-01',
        },
      ],
      isLoading: false,
      error: null,
    });
    (useAdminOverview as jest.Mock).mockReturnValue({
      data: [
        {
          name: 'SuperAdmin',
          avatar: 'https://example.com/a.jpg',
          lastAction: 'act',
          total24h: 1,
          login: 'today',
        },
      ],
      isLoading: false,
      error: null,
    });
    (useAdminEvents as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    render(<AuditLogs />);
    expect(screen.getByText('desc')).toBeInTheDocument();
    expect(screen.getByText('Alert')).toBeInTheDocument();
    expect(screen.getByText('SuperAdmin')).toBeInTheDocument();
  });

  it('shows error when admin overview fails', () => {
    (useAuditLogs as jest.Mock).mockReturnValue({
      data: { logs: [] },
      isLoading: false,
      error: null,
    });
    (useAuditAlerts as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    (useAdminOverview as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: 'admin fail' },
    });
    (useAdminEvents as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    render(<AuditLogs />);
    expect(screen.getByRole('alert')).toHaveTextContent('admin fail');
  });

  it('renders events from server', () => {
    (useAuditLogs as jest.Mock).mockReturnValue({
      data: { logs: [] },
      isLoading: false,
      error: null,
    });
    (useAuditAlerts as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    (useAdminOverview as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    (useAdminEvents as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'e1',
          title: 'Event 1',
          description: 'Desc 1',
          date: '2024-01-01',
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<AuditLogs />);
    expect(screen.getByText('Event 1')).toBeInTheDocument();
    expect(screen.getByText('Desc 1')).toBeInTheDocument();
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
  });
});
