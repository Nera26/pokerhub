import type { InternalGameState } from './engine';
import type { GameState } from '@shared/types';

export function sanitize(
  state: InternalGameState,
  playerId?: string,
): GameState {
  const { deck: _deck, players, ...rest } = state;
  return {
    ...(rest as Omit<GameState, 'players' | 'serverTime'>),
    serverTime: Date.now(),
    players: players.map(({ id, stack, folded, bet, allIn, holeCards }) => ({
      id,
      stack,
      folded,
      bet,
      allIn,
      ...(playerId === id &&
      Array.isArray(holeCards) &&
      holeCards.length === 2 &&
      holeCards.every((c) => typeof c === 'number')
        ? { holeCards }
        : {}),
    })),
  } as GameState;
}
