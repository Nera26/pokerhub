import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TournamentModal from '../TournamentModal';
import type { AdminTournament } from '@shared/types';
import { fetchTournamentFormats } from '@/lib/api/admin';

jest.mock('@/hooks/useGameTypes', () => ({
  useGameTypes: () => ({
    data: [
      { id: 'texas', label: "Texas Hold'em" },
      { id: 'omaha', label: 'Omaha 4' },
      { id: 'allin', label: 'Omaha 6' },
    ],
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@/lib/api/admin', () => ({
  ...jest.requireActual('@/lib/api/admin'),
  fetchTournamentFormats: jest.fn(),
}));

describe('TournamentModal', () => {
  const base: AdminTournament = {
    id: 1,
    name: 'Test',
    gameType: "Texas Hold'em",
    buyin: 10,
    fee: 1,
    prizePool: 100,
    date: '2024-01-01',
    time: '10:00',
    format: 'Regular',
    seatCap: 9,
    description: '',
    rebuy: false,
    addon: false,
    status: 'scheduled',
  };

  const renderWithClient = (ui: React.ReactElement) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  };

  const mockFetchFormats = fetchTournamentFormats as jest.Mock;

  beforeEach(() => {
    mockFetchFormats.mockResolvedValue([
      { id: 'Regular', label: 'Regular' },
      { id: 'Turbo', label: 'Turbo' },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('submits form data in create mode', async () => {
    const onSubmit = jest.fn();
    renderWithClient(
      <TournamentModal
        isOpen
        mode="create"
        onClose={jest.fn()}
        onSubmit={onSubmit}
        defaultValues={base}
      />,
    );

    await userEvent.clear(screen.getByLabelText('Tournament Name'));
    await userEvent.type(screen.getByLabelText('Tournament Name'), 'New Event');
    await userEvent.click(screen.getByText('Create'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Event' }),
      expect.anything(),
    );
  });

  it('submits updated data in edit mode', async () => {
    const onSubmit = jest.fn();
    renderWithClient(
      <TournamentModal
        isOpen
        mode="edit"
        onClose={jest.fn()}
        onSubmit={onSubmit}
        defaultValues={base}
      />,
    );

    const input = screen.getByLabelText('Tournament Name');
    await userEvent.clear(input);
    await userEvent.type(input, 'Updated');
    await userEvent.click(screen.getByText('Save Changes'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated', id: 1 }),
      expect.anything(),
    );
  });

  it('shows error when formats fetch fails', async () => {
    mockFetchFormats.mockRejectedValue({
      status: 500,
      message: 'Server Error',
    });

    renderWithClient(
      <TournamentModal
        isOpen
        mode="create"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        defaultValues={base}
      />,
    );

    expect(await screen.findByText(/500 Server Error/)).toBeInTheDocument();
  });

  it('shows empty state when no formats available', async () => {
    mockFetchFormats.mockResolvedValue([]);

    renderWithClient(
      <TournamentModal
        isOpen
        mode="create"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        defaultValues={base}
      />,
    );

    expect(await screen.findByText('No formats available')).toBeInTheDocument();
  });
});
