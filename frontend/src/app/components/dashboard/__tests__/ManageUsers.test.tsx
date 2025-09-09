import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ManageUsers from '../ManageUsers';
import { useDashboardUsers } from '@/hooks/useDashboardUsers';

jest.mock('@/hooks/useDashboardUsers');

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe('ManageUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens ban modal and posts ban request', async () => {
    (useDashboardUsers as jest.Mock).mockReturnValue({
      data: [{ id: '1', username: 'alice', balance: 0, banned: false }],
      isLoading: false,
      error: null,
    });

    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true } as Response);

    renderWithClient(<ManageUsers />);

    await userEvent.click(screen.getByRole('button', { name: /ban/i }));

    expect(
      screen.getByText(/are you sure you want to ban alice/i),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByText('Confirm'));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/users/1/ban',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
