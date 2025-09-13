import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SecurityAlerts from '../SecurityAlerts';
import { useAuditAlerts } from '@/hooks/admin';

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

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  const utils = render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
  return { ...utils, queryClient };
}

describe('SecurityAlerts', () => {
  beforeEach(() => {
    (global.fetch as unknown as jest.Mock) = jest.fn();
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
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
    (useAuditAlerts as jest.Mock).mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          id: '1',
          severity: 'danger',
          title: 'Alert',
          body: 'Body',
          time: 'now',
        },
      ],
    });
    const { queryClient } = renderWithClient(<SecurityAlerts />);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /acknowledge/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['admin-security-alerts'],
      }),
    );
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
        },
      ],
    });
    const { asFragment } = renderWithClient(<SecurityAlerts />);
    expect(asFragment()).toMatchSnapshot();
  });
});
