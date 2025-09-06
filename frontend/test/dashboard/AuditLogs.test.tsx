import { render, screen } from '@testing-library/react';
import AuditLogs from '@/app/components/dashboard/AuditLogs';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useAuditAlerts } from '@/hooks/useAuditAlerts';
import { useAdminOverview } from '@/hooks/useAdminOverview';

jest.mock('@/hooks/useAuditLogs');
jest.mock('@/hooks/useAuditAlerts');
jest.mock('@/hooks/useAdminOverview');

describe('AuditLogs component states', () => {
  beforeEach(() => {
    (useAuditLogs as jest.Mock).mockReset();
    (useAuditAlerts as jest.Mock).mockReset();
    (useAdminOverview as jest.Mock).mockReset();
  });

  it('shows loading state', () => {
    (useAuditLogs as jest.Mock).mockReturnValue({ data: null, isLoading: true, error: null });
    (useAuditAlerts as jest.Mock).mockReturnValue({ data: null, isLoading: false, error: null });
    (useAdminOverview as jest.Mock).mockReturnValue({ data: null, isLoading: false, error: null });
    render(<AuditLogs />);
    expect(screen.getByLabelText('loading')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    (useAuditLogs as jest.Mock).mockReturnValue({ data: { logs: [] }, isLoading: false, error: null });
    (useAuditAlerts as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: null });
    (useAdminOverview as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: null });
    render(<AuditLogs />);
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('No security alerts')).toBeInTheDocument();
    expect(screen.getByText('No admin activity')).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useAuditLogs as jest.Mock).mockReturnValue({ data: null, isLoading: false, error: { message: 'fail' } });
    (useAuditAlerts as jest.Mock).mockReturnValue({ data: null, isLoading: false, error: null });
    (useAdminOverview as jest.Mock).mockReturnValue({ data: null, isLoading: false, error: null });
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
            type: 'Login',
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
    render(<AuditLogs />);
    expect(screen.getByText('desc')).toBeInTheDocument();
    expect(screen.getByText('Alert')).toBeInTheDocument();
    expect(screen.getByText('SuperAdmin')).toBeInTheDocument();
  });

  it('shows error when admin overview fails', () => {
    (useAuditLogs as jest.Mock).mockReturnValue({ data: { logs: [] }, isLoading: false, error: null });
    (useAuditAlerts as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: null });
    (useAdminOverview as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: 'admin fail' },
    });
    render(<AuditLogs />);
    expect(screen.getByRole('alert')).toHaveTextContent('admin fail');
  });
});
