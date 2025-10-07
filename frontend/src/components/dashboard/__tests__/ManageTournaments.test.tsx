import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';
import ManageTournaments from '../manage-tournaments';
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

jest.mock('@/components/modals/tournament-modal', () => ({
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

jest.mock('@/components/ui/modal', () => ({
  __esModule: true,
  default: ({ isOpen, children }: any) =>
    isOpen ? <div>{children}</div> : null,
}));

jest.mock('@/components/ui/toast-notification', () => ({
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

  it('renders filters provided by the API', async () => {
    const customFilters = [
      { id: 'primary', label: 'Primary' },
      {
        id: 'custom',
        label: 'Custom',
        colorClass: 'border-custom text-custom',
      },
    ];
    mockedUseAdminTournamentFilters.mockReturnValue({
      data: customFilters,
      isLoading: false,
    } as any);
    (fetchAdminTournaments as jest.Mock).mockResolvedValue([]);

    renderWithClient(<ManageTournaments />);

    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: 'Primary',
        }),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByRole('button', {
        name: 'Custom',
      }),
    ).toHaveClass('border-custom');
  });

  it('shows filter skeleton while loading filters', async () => {
    mockedUseAdminTournamentFilters.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);
    (fetchAdminTournaments as jest.Mock).mockResolvedValue([]);

    const { container } = renderWithClient(<ManageTournaments />);

    await waitFor(() =>
      expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4),
    );
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
    expect(screen.getByRole('button', { name: 'All' })).toHaveClass(
      'bg-accent-yellow',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Running' }));

    await waitFor(() => {
      expect(screen.getByText('Tournament 2')).toBeInTheDocument();
      expect(screen.queryByText('Tournament 1')).not.toBeInTheDocument();
    });
  });

  it('resets to "all" when filters later include it', async () => {
    const tournaments = makeTournaments(2);
    (fetchAdminTournaments as jest.Mock).mockResolvedValue(tournaments);

    const filtersWithoutAll = defaultFilters.filter(
      (filter) => filter.id !== 'all',
    );

    let currentFilters: typeof defaultFilters | typeof filtersWithoutAll =
      filtersWithoutAll;
    mockedUseAdminTournamentFilters.mockImplementation(
      () =>
        ({
          data: currentFilters,
          isLoading: false,
        }) as any,
    );

    const { rerenderWithClient } = renderWithClient(<ManageTournaments />);

    await screen.findByText('Tournament 1');

    expect(
      screen.queryByRole('button', { name: 'All' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scheduled' })).toHaveClass(
      'bg-accent-yellow',
    );

    currentFilters = defaultFilters;
    rerenderWithClient(<ManageTournaments />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument(),
    );

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'All' })).toHaveClass(
        'bg-accent-yellow',
      ),
    );

    expect(screen.getByRole('button', { name: 'Scheduled' })).not.toHaveClass(
      'bg-accent-yellow',
    );
  });

  it('falls back to the first option when the API omits "all"', async () => {
    const tournaments = makeTournaments(2);
    (fetchAdminTournaments as jest.Mock).mockResolvedValue(tournaments);

    const filtersWithoutAll = defaultFilters.filter(
      (filter) => filter.id !== 'all',
    );

    mockedUseAdminTournamentFilters.mockReturnValue({
      data: filtersWithoutAll,
      isLoading: false,
    } as any);

    renderWithClient(<ManageTournaments />);

    await screen.findByText('Tournament 1');

    expect(
      screen.queryByRole('button', { name: 'All' }),
    ).not.toBeInTheDocument();

    const scheduledButton = screen.getByRole('button', { name: 'Scheduled' });
    expect(scheduledButton).toHaveClass('bg-accent-yellow');

    fireEvent.click(screen.getByRole('button', { name: 'Running' }));

    await waitFor(() => {
      expect(screen.getByText('Tournament 2')).toBeInTheDocument();
      expect(screen.queryByText('Tournament 1')).not.toBeInTheDocument();
    });
  });
});
