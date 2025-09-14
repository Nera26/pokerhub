import { simulate, type BlindLevel, type SimulationResult } from '@shared/utils/tournamentSimulator';

export const HANDS_PER_LEVEL = 5;
export const MS_PER_MINUTE_SCALED = 10; // 10ms represents 1 minute for tests

export function simulateTournament(
  structure: ReadonlyArray<BlindLevel>,
  entrants: number,
  seedValue = 1,
): SimulationResult {
  return simulate(structure, entrants, {
    handsPerLevel: HANDS_PER_LEVEL,
    msPerMinute: MS_PER_MINUTE_SCALED,
    seedValue,
  });
}

export type { BlindLevel, SimulationResult };
