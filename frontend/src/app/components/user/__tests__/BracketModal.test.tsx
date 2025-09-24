import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BracketModal from '../BracketModal';
import { fetchTournamentBracket } from '@/lib/api/history';

jest.mock('@/lib/api/history');

describe('BracketModal', () => {
  const fetchBracketMock = fetchTournamentBracket as jest.MockedFunction<
    typeof fetchTournamentBracket
  >;

  function renderWithClient(ui: React.ReactElement) {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state while fetching bracket', () => {
    fetchBracketMock.mockImplementationOnce(() => new Promise(() => undefined));

    renderWithClient(
      <BracketModal
        isOpen
        tournament={{ id: 't1', title: 'Summer Series' }}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText('Loading bracket...')).toBeInTheDocument();
  });

  it('renders rounds on success', async () => {
    fetchBracketMock.mockResolvedValueOnce({
      tournamentId: 't1',
      rounds: [
        {
          name: 'Quarter Finals',
          matches: [{ id: 'm1', players: ['Alice', 'Bob'], winner: 'Alice' }],
        },
      ],
    });

    renderWithClient(
      <BracketModal
        isOpen
        tournament={{ id: 't1', title: 'Summer Series' }}
        onClose={jest.fn()}
      />,
    );

    expect(await screen.findByText('Quarter Finals')).toBeInTheDocument();
    expect(screen.getByText('Alice vs Bob')).toBeInTheDocument();
    expect(screen.getByText('Winner: Alice')).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    fetchBracketMock.mockRejectedValueOnce(new Error('oops'));

    renderWithClient(
      <BracketModal
        isOpen
        tournament={{ id: 't1', title: 'Summer Series' }}
        onClose={jest.fn()}
      />,
    );

    expect(
      await screen.findByText('Failed to load tournament bracket.'),
    ).toBeInTheDocument();
  });
});
