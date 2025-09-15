import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SeatRing from '@/app/components/tables/SeatRing';
import type { Player } from '@/app/components/tables/types';
import { server } from '@/test-utils/server';
import { http, HttpResponse } from 'msw';
import type { ImgHTMLAttributes } from 'react';

jest.mock('next/image', () => (props: ImgHTMLAttributes<HTMLImageElement>) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={props.alt} />;
});

describe('SeatRing', () => {
  const players: Player[] = [
    {
      id: '1',
      username: 'Alice',
      chips: 100,
      avatar: '',
      isFolded: false,
      pos: 'BTN',
    },
    {
      id: '2',
      username: 'Bob',
      chips: 100,
      avatar: '',
      isFolded: false,
      pos: 'SB',
    },
    {
      id: '3',
      username: 'Carol',
      chips: 100,
      avatar: '',
      isFolded: false,
      pos: 'BB',
    },
  ];

  it('renders badges from table theme', async () => {
    const mockTheme = {
      hairline: '#fff',
      positions: {
        BTN: { color: 'red', glow: 'pink', badge: '/btn.svg' },
        SB: { color: 'blue', glow: 'lightblue', badge: '/sb.svg' },
        BB: { color: 'green', glow: 'lightgreen', badge: '/bb.svg' },
      },
    };
    server.use(
      http.get('/api/config/table-theme', () => HttpResponse.json(mockTheme)),
    );
    const queryClient = new QueryClient();
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

    const btn = await screen.findByAltText('BTN');
    expect(btn).toHaveAttribute('src', '/btn.svg');
    expect(screen.getByAltText('SB')).toHaveAttribute('src', '/sb.svg');
    expect(screen.getByAltText('BB')).toHaveAttribute('src', '/bb.svg');
  });
});
