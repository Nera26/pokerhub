import { render, screen } from '@testing-library/react';
import HomePageClient from '@/app/(site)/HomePageClient';
import { useTables, useTournaments, useCTAs } from '@/hooks/useLobbyData';

jest.mock('@/hooks/useLobbyData');
jest.mock('@/hooks/useGameTypes', () => ({
  useGameTypes: () => ({ data: [{ id: 'texas', label: 'Texas' }, { id: 'tournaments', label: 'Tournaments' }], error: null, isLoading: false }),
}));
jest.mock('next/dynamic', () => {
  const dynamic = () => {
    const DynamicComponent = () => null;
    DynamicComponent.displayName = 'DynamicMock';
    return DynamicComponent;
  };
  return dynamic;
});
jest.mock('next/link', () => {
  const LinkMock = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );
  LinkMock.displayName = 'LinkMock';
  return LinkMock;
});

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  configurable: true,
  value: () => ({
    width: 800,
    height: 400,
    top: 0,
    left: 0,
    right: 800,
    bottom: 400,
  }),
});

Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  value: 400,
});

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  value: 800,
});

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.assign(globalThis, { ResizeObserver });

const mockTables = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  tableName: `Table ${i + 1}`,
  gameType: 'texas',
  stakes: { small: 1, big: 2 },
  players: { current: 0, max: 6 },
  buyIn: { min: 40, max: 200 },
  stats: { handsPerHour: 100, avgPot: 25, rake: 5 },
  createdAgo: 'just now',
}));

const mockTournaments = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  title: `Tournament ${i + 1}`,
  buyIn: 10,
  fee: 0,
  prizePool: 1000,
  state: 'REG_OPEN',
  gameType: 'texas',
  players: { current: 0, max: 100 },
  registered: false,
}));

describe('home page virtualization', () => {
  it('mounts virtualized list containers', () => {
    (useTables as jest.Mock).mockReturnValue({
      data: mockTables,
      error: null,
      isLoading: false,
    });
    (useTournaments as jest.Mock).mockReturnValue({
      data: mockTournaments,
      error: null,
      isLoading: false,
    });
    (useCTAs as jest.Mock).mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
    });

    render(<HomePageClient />);

    const tablesList = screen.getByTestId('tables-list')
      .firstChild as HTMLElement;
    const tournamentsList = screen.getByTestId('tournaments-list')
      .firstChild as HTMLElement;
    expect(tablesList.style.height).toBe('5600px');
    expect(tournamentsList.style.height).toBe('5600px');
  });
});
