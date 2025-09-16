import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import path from 'path';
import {
  HANDS_PER_LEVEL,
  MS_PER_MINUTE_SCALED,
  simulateTournament,
  simulateTournamentDurations,
} from './utils/simulator.ts';

interface Level {
  level: number;
  durationMinutes: number;
}

test('tournament simulation matches documented hand durations and timeline', () => {
  const structurePath = path.join(
    __dirname,
    '../../backend/src/tournament/structures/v1.json',
  );
  const structure = JSON.parse(
    readFileSync(structurePath, 'utf8'),
  ) as { levels: Level[] };

  const result = simulateTournament(structure.levels, 10000, 42);

  structure.levels.forEach((lvl, idx) => {
    const expected = lvl.durationMinutes * MS_PER_MINUTE_SCALED;
    const avg = result.levelAverages[idx];
    const diff = Math.abs(avg - expected);
    assert(diff <= expected * 0.05);
  });

  const expectedTotal = structure.levels.reduce(
    (acc, l) => acc + l.durationMinutes * MS_PER_MINUTE_SCALED * HANDS_PER_LEVEL,
    0,
  );
  const totalDiff = Math.abs(result.totalDuration - expectedTotal);
  assert(totalDiff <= expectedTotal * 0.05);

  const profiles = [
    { name: 'default', proportion: 1, bustMultiplier: 1 },
  ];
  const summary = simulateTournamentDurations(
    structure.levels,
    10000,
    4,
    profiles,
    42,
  );
  const summaryRepeat = simulateTournamentDurations(
    structure.levels,
    10000,
    4,
    profiles,
    42,
  );

  assert(summary.averageDuration > 0);
  assert(summary.durationVariance >= 0);
  assert(Math.abs(summary.averageDuration - summaryRepeat.averageDuration) < 1e-9);
  assert(Math.abs(summary.durationVariance - summaryRepeat.durationVariance) < 1e-9);
});
