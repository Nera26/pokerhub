import type { AdminTournament } from '@shared/types';

export function makeTournament(
  overrides: Partial<AdminTournament> = {},
): AdminTournament {
  return {
    id: 1,
    name: 'Tournament 1',
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
    status: 'scheduled',
    ...overrides,
  };
}

export function makeTournaments(count: number): AdminTournament[] {
  return Array.from({ length: count }, (_, i) =>
    makeTournament({
      id: i + 1,
      name: `Tournament ${i + 1}`,
      status: i % 2 === 0 ? 'scheduled' : 'running',
    }),
  );
}

export const defaultTournament: AdminTournament = makeTournament({
  id: 0,
  name: 'Server Default',
  buyin: 5,
  prizePool: 100,
  date: '2024-01-01',
  time: '10:00',
  format: 'Turbo',
  rebuy: true,
});
