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
import { useAdminTournamentFilters } from '@/hooks/admin/useTournamentFilters';
import { makeTournaments, defaultTournament } from './testUtils';

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

jest.mock('@/hooks/useTranslations', () => ({
  useTranslations: () => ({ data: {} }),
}));

jest.mock('@/lib/api/admin', () => ({
  fetchAdminTournaments: jest.fn(),
  createAdminTournament: jest.fn(),
  updateAdminTournament: jest.fn(),
  deleteAdminTournament: jest.fn(),
  fetchAdminTournamentDefaults: jest.fn(),
}));

jest.mock('@/hooks/admin/useTournamentFilters', () => ({
  useAdminTournamentFilters: jest.fn(),
}));

jest.mock('@/app/components/modals/TournamentModal', () => ({
  __esModule: true,
  default: ({ isOpen, onSubmit, defaultValues }: any) => {
    if (!isOpen) return null;
    const { makeTournament } = require('./testUtils');
    return (
      <div>
        <button
          onClick={() =>
            onSubmit({
              ...(defaultValues || makeTournament()),
              name: 'Updated Tournament',
            })
          }
        >
          Submit Tournament
        </button>
      </div>
    );
  },
}));

jest.mock('@/app/components/ui/Modal', () => ({
  __esModule: true,
  default: ({ isOpen, children }: any) =>
    isOpen ? <div>{children}</div> : null,
}));

jest.mock('@/app/components/ui/ToastNotification', () => ({
  __esModule: true,
  default: () => null,
}));

describe('ManageTournaments', () => {
  const mockedUseAdminTournamentFilters =
    useAdminTournamentFilters as jest.MockedFunction<
      typeof useAdminTournamentFilters
    >;

  const defaultFilters = [
    { id: 'all', label: 'All' },
    {
      id: 'scheduled',
      label: 'Scheduled',
      colorClass: 'border-accent-blue text-accent-blue',
    },
    {
      id: 'auto-start',
      label: 'Auto-start',
      colorClass: 'border-accent-blue text-accent-blue',
    },
    {
      id: 'running',
      label: 'Running',
      colorClass: 'border-accent-green text-accent-green',
    },
    {
      id: 'finished',
      label: 'Finished',
      colorClass: 'border-text-secondary text-text-secondary',
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      colorClass: 'border-red-500 text-red-500',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAdminTournamentFilters.mockReturnValue({
      data: defaultFilters,
      isLoading: false,
    } as any);
  });

  it('shows loading state', () => {
    (fetchAdminTournaments as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );
    renderWithClient(<ManageTournaments />);
    expect(screen.getByText('Loading tournaments...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    (fetchAdminTournaments as jest.Mock).mockRejectedValue(new Error('fail'));
    renderWithClient(<ManageTournaments />);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to load tournaments.',
      ),
    );
  });

  it('shows empty state', async () => {
    (fetchAdminTournaments as jest.Mock).mockResolvedValue([]);
    renderWithClient(<ManageTournaments />);
    await waitFor(() =>
      expect(screen.getByText('No tournaments found.')).toBeInTheDocument(),
    );
  });

  it('filters and paginates tournaments', async () => {
    const tournaments = makeTournaments(6);
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

  it('creates a tournament via mutation', async () => {
    (fetchAdminTournaments as jest.Mock).mockResolvedValue([]);
    (fetchAdminTournamentDefaults as jest.Mock).mockResolvedValue(
      defaultTournament,
    );
    (createAdminTournament as jest.Mock).mockResolvedValue({});

    renderWithClient(<ManageTournaments />);

    await waitFor(() =>
      expect(screen.getByText('No tournaments found.')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText('New Tournament'));
    await waitFor(() =>
      expect(fetchAdminTournamentDefaults).toHaveBeenCalled(),
    );

    const submit = await screen.findByText('Submit Tournament');
    fireEvent.click(submit);

    await waitFor(() =>
      expect(createAdminTournament).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated Tournament' }),
      ),
    );
  });

  it('edits a tournament via mutation', async () => {
    const tournaments = makeTournaments(1);
    (fetchAdminTournaments as jest.Mock).mockResolvedValue(tournaments);
    (updateAdminTournament as jest.Mock).mockResolvedValue({});

    renderWithClient(<ManageTournaments />);

    await screen.findByText('Tournament 1');

    fireEvent.click(screen.getByLabelText('Edit'));
    const submit = await screen.findByText('Submit Tournament');
    fireEvent.click(submit);

    await waitFor(() =>
      expect(updateAdminTournament).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: 'Updated Tournament' }),
      ),
    );
  });

  it('deletes a tournament via mutation', async () => {
    const tournaments = makeTournaments(1);
    (fetchAdminTournaments as jest.Mock).mockResolvedValue(tournaments);
    (deleteAdminTournament as jest.Mock).mockResolvedValue({});

    renderWithClient(<ManageTournaments />);

    await screen.findByText('Tournament 1');
    fireEvent.click(screen.getByLabelText('Delete'));

    const confirm = await screen.findByRole('button', {
      name: /confirm delete/i,
    });
    fireEvent.click(confirm);

    await waitFor(() => expect(deleteAdminTournament).toHaveBeenCalledWith(1));
  });

  it('uses dynamic filters to filter tournaments', async () => {
    const tournaments = makeTournaments(2);
    (fetchAdminTournaments as jest.Mock).mockResolvedValue(tournaments);

    renderWithClient(<ManageTournaments />);

    await screen.findByText('Tournament 1');

    expect(
      screen.getByRole('button', { name: 'Scheduled' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Running' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Running' }));

    await waitFor(() => {
      expect(screen.getByText('Tournament 2')).toBeInTheDocument();
      expect(screen.queryByText('Tournament 1')).not.toBeInTheDocument();
    });
  });
});
