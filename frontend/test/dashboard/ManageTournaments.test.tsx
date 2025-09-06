import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ManageTournaments from '@/app/components/dashboard/ManageTournaments';
import {
  fetchAdminTournaments,
} from '@/lib/api/admin';

jest.mock('@/lib/api/admin', () => ({
  fetchAdminTournaments: jest.fn(),
  createAdminTournament: jest.fn(),
  updateAdminTournament: jest.fn(),
  deleteAdminTournament: jest.fn(),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('ManageTournaments component states', () => {
  beforeEach(() => {
    (fetchAdminTournaments as jest.Mock).mockReset();
  });

  it('shows loading state', () => {
    (fetchAdminTournaments as jest.Mock).mockImplementation(() => new Promise(() => {}));
    renderWithClient(<ManageTournaments />);
    expect(screen.getByText('Loading tournaments...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    (fetchAdminTournaments as jest.Mock).mockRejectedValue(new Error('fail'));
    renderWithClient(<ManageTournaments />);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load tournaments.')
    );
  });

  it('shows empty state', async () => {
    (fetchAdminTournaments as jest.Mock).mockResolvedValue([]);
    renderWithClient(<ManageTournaments />);
    await waitFor(() =>
      expect(screen.getByText('No tournaments found.')).toBeInTheDocument()
    );
  });

  it('shows data', async () => {
    (fetchAdminTournaments as jest.Mock).mockResolvedValue([
      {
        id: 1,
        name: 'Test Tournament',
        gameType: "Texas Hold'em",
        buyin: 10,
        fee: 1,
        prizePool: 1000,
        date: '2024-12-20',
        time: '12:00',
        format: 'Regular',
        seatCap: '',
        description: '',
        rebuy: false,
        addon: false,
        status: 'scheduled',
      },
    ]);
    renderWithClient(<ManageTournaments />);
    await waitFor(() =>
      expect(screen.getByText('Test Tournament')).toBeInTheDocument()
    );
  });
});
