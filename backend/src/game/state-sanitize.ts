import { EVENT_SCHEMA_VERSION } from '@shared/events';
import type { GameState } from '@shared/types';
import type { InternalGameState } from './engine';

export function sanitize(
  state: InternalGameState,
  playerId?: string,
): GameState {
  const { deck: _deck, players, ...rest } = state;
  return {
    ...(rest as Omit<GameState, 'players' | 'serverTime' | 'version'>),
    version: EVENT_SCHEMA_VERSION,
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
