import type { LeaderboardEntry } from '@shared/types';

export const leaderboard: LeaderboardEntry[] = [
  {
    playerId: 'alice',
    rank: 1,
    points: 100,
    rd: 40,
    volatility: 0.06,
    net: 10,
    bb100: 5,
    hours: 2,
    roi: 0.2,
    finishes: { 1: 1 },
  },
  {
    playerId: 'bob',
    rank: 2,
    points: 90,
    rd: 40,
    volatility: 0.06,
    net: 8,
    bb100: 4,
    hours: 1.5,
    roi: -0.1,
    finishes: { 2: 1 },
  },
];
