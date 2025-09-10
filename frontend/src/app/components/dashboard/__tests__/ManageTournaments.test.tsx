import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';
import ManageTournaments from '../ManageTournaments';
import {
  fetchAdminTournaments,
  createAdminTournament,
  updateAdminTournament,
  deleteAdminTournament,
  fetchAdminTournamentDefaults,
} from '@/lib/api/admin';

jest.mock('@/lib/api/admin', () => ({
  fetchAdminTournaments: jest.fn(),
  createAdminTournament: jest.fn(),
  updateAdminTournament: jest.fn(),
  deleteAdminTournament: jest.fn(),
  fetchAdminTournamentDefaults: jest.fn(),
}));

describe('ManageTournaments table manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters and paginates tournaments', async () => {
    const tournaments = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      name: `Tournament ${i + 1}`,
      gameType: "Texas Hold'em",
      buyin: 10,
      fee: 1,
      prizePool: 1000,
      date: '2024-12-20',
      time: '12:00',
      format: 'Regular',
      seatCap: 9,
      description: '',
      rebuy: false,
      addon: false,
      status: i % 2 === 0 ? 'scheduled' : 'running',
    }));
    (fetchAdminTournaments as jest.Mock).mockResolvedValue(tournaments);

    renderWithClient(<ManageTournaments />);

    await screen.findByText('Tournament 1');
    expect(screen.queryByText('Tournament 6')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next page/i }));
    await screen.findByText('Tournament 6');

    const searchInput = screen.getByPlaceholderText('Search tournaments...');
    fireEvent.change(searchInput, { target: { value: 'Tournament 3' } });
    await waitFor(() =>
      expect(screen.getByText('Tournament 3')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Tournament 6')).not.toBeInTheDocument();
  });
});
