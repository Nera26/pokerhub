import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import path from 'path';
import {
  HANDS_PER_LEVEL,
  MS_PER_MINUTE_SCALED,
  simulateTournament,
} from './utils/simulator.ts';
import { mean, variance } from '@shared/utils/tournamentSimulator';

interface Level {
  level: number;
  durationMinutes: number;
}

test('tournament simulation produces consistent summaries across seeds', () => {
  const structurePath = path.join(
    __dirname,
    '../../backend/src/tournament/structures/v1.json',
  );
  const structure = JSON.parse(
    readFileSync(structurePath, 'utf8'),
  ) as { levels: Level[] };

  const baseline = simulateTournament(structure.levels, 10000, 42);
  const repeat = simulateTournament(structure.levels, 10000, 42);
  assert.deepStrictEqual(repeat, baseline);
  assert(baseline.averageDuration > 0);
  assert(baseline.durationVariance >= 0);

  const seeds = [1, 2, 3, 4, 5];
  const summaries = seeds.map((seed) =>
    simulateTournament(structure.levels, 10000, seed),
  );
  const averages = summaries.map((summary) => summary.averageDuration);
  const variances = summaries.map((summary) => summary.durationVariance);

  averages.forEach((value) => {
    assert(Number.isFinite(value));
    assert(value > 0);
  });

  variances.forEach((value) => {
    assert(Number.isFinite(value));
    assert(value >= 0);
  });

  const seedAverage = mean(averages);
  const seedVariance = variance(averages);

  const baselineDuration = structure.levels.reduce(
    (acc, lvl) => acc + lvl.durationMinutes * MS_PER_MINUTE_SCALED,
    0,
  );

  assert(seedAverage > baselineDuration * 0.1);
  assert(seedAverage < baselineDuration * HANDS_PER_LEVEL);
  assert(seedVariance >= 0);
});
