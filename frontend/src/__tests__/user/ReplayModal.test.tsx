import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReplayModal from '@/app/components/user/ReplayModal';
import { fetchHandReplay } from '@/lib/api/replay';
import type { HandReplayResponse } from '@shared/types';

jest.mock('@/lib/api/replay');

function renderModal() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ReplayModal isOpen handId="h1" onClose={() => {}} />
    </QueryClientProvider>,
  );
}

describe('ReplayModal', () => {
  const mockFetch = fetchHandReplay as jest.MockedFunction<
    typeof fetchHandReplay
  >;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    renderModal();
    expect(screen.getByText('Loading replay...')).toBeInTheDocument();
  });

  it('renders frames on success', async () => {
    const data: HandReplayResponse = [
      {
        street: 'preflop',
        pot: 0,
        sidePots: [],
        currentBet: 0,
        players: [],
        communityCards: [],
      },
    ];
    mockFetch.mockResolvedValueOnce(data);
    renderModal();
    expect(await screen.findByText('Frame 1: preflop')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fail'));
    renderModal();
    expect(
      await screen.findByText('Failed to load replay'),
    ).toBeInTheDocument();
  });
});
