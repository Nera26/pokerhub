import type { GameState } from './types';

/**
 * Safely reads the players array from a possibly null GameState.
 * Returns an empty array when the state or players field is missing.
 */
export function readPlayers(state: GameState | null | undefined): GameState['players'] {
  return state?.players ?? [];
}

/**
 * Safely reads the communityCards array from a possibly null GameState.
 * Returns an empty array when the state or communityCards field is missing.
 */
export function readCommunityCards(
  state: GameState | null | undefined,
): GameState['communityCards'] {
  return state?.communityCards ?? [];
}
