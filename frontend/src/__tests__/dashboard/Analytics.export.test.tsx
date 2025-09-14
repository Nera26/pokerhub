import { mockUseActivity } from '@/test-utils/mockActivity';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Analytics from '@/app/components/dashboard/analytics/Analytics';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useAuditSummary } from '@/hooks/useAuditSummary';
import useToasts from '@/hooks/useToasts';
import { exportCsv, toCsv } from '@/lib/exportCsv';

const useActivity = mockUseActivity();

jest.mock('@tanstack/react-query');
jest.mock('@/hooks/useAuditLogs', () => ({
  __esModule: true,
  useAuditLogs: jest.fn(),
}));
jest.mock('@/hooks/useAuditSummary', () => ({
  __esModule: true,
  useAuditSummary: jest.fn(),
}));
jest.mock('@/hooks/useToasts');
jest.mock('@/lib/exportCsv', () => ({
  ...jest.requireActual('@/lib/exportCsv'),
  exportCsv: jest.fn(),
}));

jest.mock('@/app/components/dashboard/analytics/SearchBar', () => () => (
  <div />
));
jest.mock('@/app/components/dashboard/analytics/QuickStats', () => () => (
  <div />
));
jest.mock('@/app/components/dashboard/charts/ActivityChart', () => () => (
  <div />
));
jest.mock('@/app/components/dashboard/analytics/ErrorChart', () => () => (
  <div />
));
jest.mock('@/app/components/dashboard/analytics/AuditTable', () => () => (
  <div />
));
jest.mock('@/app/components/dashboard/analytics/SecurityAlerts', () => () => (
  <div />
));
jest.mock(
  '@/app/components/dashboard/analytics/AdvancedFilterModal',
  () => () => null,
);
jest.mock('@/app/components/dashboard/analytics/DetailModal', () => () => null);
jest.mock('@/app/components/ui/ToastNotification', () => () => null);

describe('Analytics CSV export', () => {
  beforeEach(() => {
    (useMutation as jest.Mock).mockReturnValue({ mutate: jest.fn() });
    (useQuery as jest.Mock).mockReturnValue({
      data: { Login: '' },
      isLoading: false,
      isError: false,
    });
    (useAuditLogs as jest.Mock).mockReturnValue({
      data: {
        logs: [
          {
            id: 1,
            timestamp: '2024-01-01',
            type: 'login',
            description: 'desc',
            user: 'alice',
            ip: '1.1.1.1',
          },
        ],
      },
    });
    (useAuditSummary as jest.Mock).mockReturnValue({
      data: { total: 1, errors: 0, logins: 1 },
    });
    useActivity.mockReturnValue({
      data: { labels: [], data: [] },
      isLoading: false,
      error: null,
    });
    (useToasts as jest.Mock).mockReturnValue({
      toasts: [],
      pushToast: jest.fn(),
    });
    (exportCsv as jest.Mock).mockReset();
  });

  it('generates expected CSV', async () => {
    render(<Analytics />);
    await userEvent.click(screen.getByText('Export'));
    const [filename, header, rows] = (exportCsv as jest.Mock).mock.calls[0];
    const csv = toCsv(header, rows);
    expect(filename).toMatch(/^audit_logs_/);
    expect(csv).toMatchSnapshot();
  });
});
