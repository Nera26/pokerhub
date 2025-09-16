import {
  simulate,
  type BlindLevel,
  type SimulationSummary,
} from '@shared/utils/tournamentSimulator';

export const HANDS_PER_LEVEL = 5;
export const MS_PER_MINUTE_SCALED = 10; // 10ms represents 1 minute for tests

export function simulateTournament(
  structure: ReadonlyArray<BlindLevel>,
  entrants: number,
  seedValue = 1,
): SimulationSummary {
  return simulate(structure, entrants, {
    handsPerLevel: HANDS_PER_LEVEL,
    msPerMinute: MS_PER_MINUTE_SCALED,
    runs: 50,
    seedValue,
  });
}
export type { BlindLevel, SimulationSummary as SimulationResult };
