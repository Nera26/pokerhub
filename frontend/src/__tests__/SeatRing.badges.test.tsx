import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SeatRing from '@/app/components/tables/SeatRing';
import type { Player } from '@/app/components/tables/types';

jest.mock(
  'next/image',
  () => (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
);

jest.mock('@/hooks/useTableTheme', () => ({
  useTableTheme: () => ({
    data: {
      hairline: 'var(--color-hairline)',
      positions: {
        BTN: {
          color: 'hsl(44,88%,60%)',
          glow: 'hsla(44,88%,60%,0.45)',
          badge: '/badges/btn.svg',
        },
      },
    },
    isLoading: false,
    isError: false,
  }),
}));

describe('SeatRing badges', () => {
  it('renders badge image when provided by theme', () => {
    const players: Player[] = [
      {
        id: 1,
        username: 'Alice',
        avatar: 'https://example.com/a.png',
        chips: 100,
        committed: 0,
        pos: 'BTN',
      },
    ];
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <SeatRing
          players={players}
          communityCards={[]}
          pot={0}
          sidePots={[]}
          street="pre"
          density="default"
          handNumber="1"
          soundEnabled={false}
        />
      </QueryClientProvider>,
    );
    const img = screen.getByRole('img', { name: 'BTN' });
    expect(img).toHaveAttribute('src', '/badges/btn.svg');
  });
});
