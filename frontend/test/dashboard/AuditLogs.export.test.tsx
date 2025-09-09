import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditLogs from '@/app/components/dashboard/AuditLogs';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useAuditAlerts } from '@/hooks/useAuditAlerts';
import { useAdminOverview } from '@/hooks/useAdminOverview';
import { useAdminEvents } from '@/hooks/useAdminEvents';
import { exportCsv } from '@/lib/exportCsv';

jest.mock('@/hooks/useAuditLogs');
jest.mock('@/hooks/useAuditAlerts');
jest.mock('@/hooks/useAdminOverview');
jest.mock('@/hooks/useAdminEvents');
jest.mock('@/lib/exportCsv', () => ({ exportCsv: jest.fn() }));

describe('AuditLogs CSV export', () => {
  beforeEach(() => {
    (useAuditLogs as jest.Mock).mockReturnValue({
      data: {
        logs: [
          {
            timestamp: '2024-01-01',
            type: 'Login',
            description: 'desc',
            user: 'admin',
          },
        ],
      },
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
    (exportCsv as jest.Mock).mockReset();
  });

  it('generates expected CSV', async () => {
    render(<AuditLogs />);
    await userEvent.click(screen.getByText('Export'));
    const [filename, header, rows] = (exportCsv as jest.Mock).mock.calls[0];
    const csv = [header, ...rows].map((r: string[]) => r.join(',')).join('\n');
    expect(filename).toBe('audit_logs.csv');
    expect(csv).toMatchSnapshot();
  });
});
