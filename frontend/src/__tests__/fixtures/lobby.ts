import type { Table, TournamentDetails } from '@shared/types';

export const tables: Table[] = [
  {
    id: '1',
    tableName: 'Test Table',
    gameType: 'texas',
    stakes: { small: 1, big: 2 },
    players: { current: 1, max: 6 },
    buyIn: { min: 40, max: 200 },
    stats: { handsPerHour: 10, avgPot: 5, rake: 1 },
    createdAgo: '1m',
  },
];

export const tournamentDetails: TournamentDetails = {
  id: 't1',
  title: 'Spring Poker',
  buyIn: 100,
  prizePool: 1000,
  state: 'REG_OPEN',
  gameType: 'texas',
  players: { current: 0, max: 100 },
  registered: false,
  registration: { open: null, close: null },
  overview: [{ title: 'Format', description: 'NLH' }],
  structure: [],
  prizes: [],
};
