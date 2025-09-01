import type { InternalGameState } from './engine';
import type { GameState } from '@shared/types';

export function sanitize(
  state: InternalGameState,
  playerId?: string,
): GameState {
  const { deck: _deck, players, ...rest } = state;
  return {
    ...(rest as Omit<GameState, 'players'>),
    players: players.map(({ id, stack, folded, bet, allIn, holeCards }) => ({
      id,
      stack,
      folded,
      bet,
      allIn,
      ...(playerId === id && holeCards ? { holeCards } : {}),
    })),
  } as GameState;
}
