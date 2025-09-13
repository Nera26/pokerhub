import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SeatRing from '../SeatRing';
import { mockFetchSuccess } from '@/hooks/__tests__/utils/renderHookWithClient';
import type { Player } from '../types';

jest.mock('../PlayerSeat', () => ({
  __esModule: true,
  default: ({ badge, player }: { badge?: any; player: Player }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof badge === 'string' ? badge : badge?.src}
      alt={player.pos ?? 'badge'}
    />
  ),
}));

jest.mock('../ChipAnimator', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Seat badges', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  function renderWithClient(ui: React.ReactElement) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  }

  it('renders badge images for BTN, SB, BB', async () => {
    mockFetchSuccess({
      hairline: '#fff',
      positions: {
        BTN: { color: '#fff', glow: '#fff' },
        SB: { color: '#fff', glow: '#fff' },
        BB: { color: '#fff', glow: '#fff' },
      },
    });

    const players: Player[] = [
      { id: 1, username: 'A', avatar: '', chips: 100, pos: 'BTN' },
      { id: 2, username: 'B', avatar: '', chips: 100, pos: 'SB' },
      { id: 3, username: 'C', avatar: '', chips: 100, pos: 'BB' },
    ];

    renderWithClient(
      <SeatRing
        players={players}
        communityCards={[]}
        pot={0}
        sidePots={[]}
        street="pre"
        density="default"
        handNumber="1"
        soundEnabled={false}
      />,
    );

    expect(await screen.findByAltText('BTN')).toBeInTheDocument();
    expect(await screen.findByAltText('SB')).toBeInTheDocument();
    expect(await screen.findByAltText('BB')).toBeInTheDocument();
  });
});
