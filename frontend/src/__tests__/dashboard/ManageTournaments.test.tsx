import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ManageTournaments from '@/app/components/dashboard/ManageTournaments';
import {
  fetchAdminTournaments,
  fetchAdminTournamentDefaults,
} from '@/lib/api/admin';

jest.mock('@/lib/api/admin', () => ({
  fetchAdminTournaments: jest.fn(),
  createAdminTournament: jest.fn(),
  updateAdminTournament: jest.fn(),
  deleteAdminTournament: jest.fn(),
  fetchAdminTournamentDefaults: jest.fn(),
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
    (fetchAdminTournamentDefaults as jest.Mock).mockReset();
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

  it('fetches defaults and populates form on create', async () => {
    (fetchAdminTournaments as jest.Mock).mockResolvedValue([]);
    (fetchAdminTournamentDefaults as jest.Mock).mockResolvedValue({
      id: 0,
      name: 'Server Default',
      gameType: "Texas Hold'em",
      buyin: 5,
      fee: 1,
      prizePool: 100,
      date: '2024-01-01',
      time: '10:00',
      format: 'Turbo',
      seatCap: 9,
      description: '',
      rebuy: true,
      addon: false,
      status: 'scheduled',
    });
    renderWithClient(<ManageTournaments />);
    await waitFor(() =>
      expect(screen.getByText('No tournaments found.')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText('New Tournament'));
    await waitFor(() =>
      expect(fetchAdminTournamentDefaults).toHaveBeenCalled()
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Tournament Name')).toHaveValue(
        'Server Default'
      )
    );
  });
});
