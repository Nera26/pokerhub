import {
  simulate,
  simulateStructure,
  type BlindLevel,
  type SimulationResult,
  type BotProfile,
  type TournamentSimulationResult,
} from '@shared/utils/tournamentSimulator';

export const HANDS_PER_LEVEL = 5;
export const MS_PER_MINUTE_SCALED = 10; // 10ms represents 1 minute for tests

export function simulateTournament(
  structure: ReadonlyArray<BlindLevel>,
  entrants: number,
  seedValue = 1,
): SimulationResult {
  return simulateStructure(structure, {
    handsPerLevel: HANDS_PER_LEVEL,
    msPerMinute: MS_PER_MINUTE_SCALED,
    seedValue,
  });
}

export function simulateTournamentDurations(
  structure: ReadonlyArray<BlindLevel>,
  entrants: number,
  runs: number,
  profiles: ReadonlyArray<BotProfile>,
  seedValue = 1,
): TournamentSimulationResult {
  return simulate(structure, entrants, runs, profiles, {
    handsPerLevel: HANDS_PER_LEVEL,
    msPerMinute: MS_PER_MINUTE_SCALED,
    seedValue,
  });
}

export type { BlindLevel, SimulationResult, TournamentSimulationResult };
