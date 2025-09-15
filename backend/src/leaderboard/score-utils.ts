import { updateRating } from './rating';
import type { LeaderboardEntry } from '@shared/types';

export interface ScoreEntry {
  sessions: Set<string>;
  rating: number;
  rd: number;
  volatility: number;
  net: number;
  bb: number;
  hands: number;
  duration: number;
  buyIn: number;
  finishes: Record<number, number>;
}

export const defaultScoreEntry: ScoreEntry = {
  get sessions() {
    return new Set<string>();
  },
  rating: 0,
  rd: 350,
  volatility: 0.06,
  net: 0,
  bb: 0,
  hands: 0,
  duration: 0,
  buyIn: 0,
  get finishes() {
    return {} as Record<number, number>;
  },
};

export function initScoreEntry(overrides: Partial<ScoreEntry> = {}): ScoreEntry {
  return { ...defaultScoreEntry, ...overrides };
}

interface ScoreDelta {
  points?: number;
  net?: number;
  bb?: number;
  hands?: number;
  duration?: number;
  buyIn?: number;
  finish?: number;
  ageDays?: number;
}

export function updateScoreEntry(entry: ScoreEntry, delta: ScoreDelta): void {
  const {
    points = 0,
    net = 0,
    bb = 0,
    hands = 0,
    duration = 0,
    buyIn = 0,
    finish,
    ageDays = 0,
  } = delta;

  const result = points > 0 ? 1 : points < 0 ? 0 : 0.5;
  const updated = updateRating(
    { rating: entry.rating, rd: entry.rd, volatility: entry.volatility },
    [{ rating: 0, rd: 350, score: result }],
    ageDays,
  );
  entry.rating = updated.rating;
  entry.rd = updated.rd;
  entry.volatility = updated.volatility;

  entry.net += net;
  entry.bb += bb;
  entry.hands += hands;
  entry.duration += duration;
  entry.buyIn += buyIn;
  if (typeof finish === 'number') {
    entry.finishes[finish] = (entry.finishes[finish] ?? 0) + 1;
  }
}

export interface LeaderboardRow {
  playerId: string;
  rank: number;
  rating: number;
  rd: number;
  volatility: number;
  net: number;
  bb: number;
  hands: number;
  duration: number;
  buyIn: number;
  finishes?: Record<number, number> | null;
}

export function toLeaderboardRow(
  playerId: string,
  entry: ScoreEntry,
  rank: number,
): LeaderboardRow {
  return {
    playerId,
    rank,
    rating: entry.rating,
    rd: entry.rd,
    volatility: entry.volatility,
    net: entry.net,
    bb: entry.bb,
    hands: entry.hands,
    duration: entry.duration,
    buyIn: entry.buyIn,
    finishes: entry.finishes,
  };
}

export function toLeaderboardEntry(row: LeaderboardRow): LeaderboardEntry {
  return {
    playerId: row.playerId,
    rank: row.rank,
    points: row.rating,
    rd: row.rd,
    volatility: row.volatility,
    net: row.net,
    bb100: row.hands ? (row.bb / row.hands) * 100 : 0,
    hours: row.duration / 3600000,
    roi: row.buyIn ? row.net / row.buyIn : 0,
    finishes: row.finishes ?? {},
  };
}

