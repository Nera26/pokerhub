import type { InternalGameState } from './engine';
import type { GameState } from '@shared/types';

export function sanitize(
  state: InternalGameState,
  playerId?: string,
): GameState {
  const { deck, players, ...rest } = state as any;
  return {
    ...(rest as Omit<GameState, 'players'>),
    players: players.map((p: any) => {
      const base: any = {
        id: p.id,
        stack: p.stack,
        folded: p.folded,
        bet: p.bet,
        allIn: p.allIn,
      };
      if (playerId && p.id === playerId && p.holeCards) {
        base.holeCards = p.holeCards;
      }
      return base;
    }),
  } as GameState;
}
