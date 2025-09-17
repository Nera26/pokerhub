import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SecurityAlerts from '../SecurityAlerts';
import { useAuditAlerts } from '@/hooks/admin';
import { acknowledgeSecurityAlert } from '@/lib/api/analytics';

jest.mock('@/hooks/admin', () => ({
  useAuditAlerts: jest.fn(),
}));
jest.mock(
  '../../../ui/ToastNotification',
  () =>
    ({ message }: { message: string }) => <div>{message}</div>,
);
jest.mock('@/hooks/useToasts', () => () => ({
  toasts: [],
  pushToast: jest.fn(),
}));
jest.mock('@/lib/api/analytics', () => ({
  acknowledgeSecurityAlert: jest.fn(),
}));

function renderWithClient(ui: React.ReactElement, client?: QueryClient) {
  const queryClient = client ?? new QueryClient();
  const utils = render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
  return { ...utils, queryClient };
}

describe('SecurityAlerts', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state', () => {
    (useAuditAlerts as jest.Mock).mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    });
    renderWithClient(<SecurityAlerts />);
    expect(screen.getByText(/loading alerts/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useAuditAlerts as jest.Mock).mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
    });
    renderWithClient(<SecurityAlerts />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      /failed to load alerts/i,
    );
  });

  it('renders alerts and acknowledges', async () => {
    const alerts = [
      {
        id: '1',
        severity: 'danger' as const,
        title: 'Alert',
        body: 'Body',
        time: 'now',
        resolved: false,
      },
    ];
    (useAuditAlerts as jest.Mock).mockReturnValue({
      isLoading: false,
      isError: false,
      data: alerts,
    });
    const queryClient = new QueryClient();
    queryClient.setQueryData(['admin-security-alerts'], alerts);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    (acknowledgeSecurityAlert as jest.Mock).mockResolvedValue({
      ...alerts[0],
      resolved: true,
    });
    const user = userEvent.setup();
    renderWithClient(<SecurityAlerts />, queryClient);
    await user.click(screen.getByRole('button', { name: /acknowledge/i }));
    await waitFor(() =>
      expect(acknowledgeSecurityAlert).toHaveBeenCalledWith('1'),
    );
    await waitFor(() =>
      expect(queryClient.getQueryData(['admin-security-alerts'])).toEqual([
        { ...alerts[0], resolved: true },
      ]),
    );
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    (useAuditAlerts as jest.Mock).mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          id: '1',
          severity: 'warning',
          title: 'Alert',
          body: 'Body',
          time: 'now',
          resolved: false,
        },
      ],
    });
    const { asFragment } = renderWithClient(<SecurityAlerts />);
    expect(asFragment()).toMatchSnapshot();
  });
});
