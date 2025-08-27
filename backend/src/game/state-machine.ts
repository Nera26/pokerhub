export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type GameAction =
  | { type: 'bet'; playerId: string; amount: number }
  | { type: 'call'; playerId: string; amount: number }
  | { type: 'fold'; playerId: string }
  | { type: 'next' };

export interface PlayerState {
  id: string;
  stack: number;
  folded: boolean;
}

export interface GameState {
  street: Street;
  pot: number;
  players: PlayerState[];
}

const ORDER: Street[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];

export class HandStateMachine {
  constructor(private readonly state: GameState) {}

  apply(action: GameAction): GameState {
    switch (action.type) {
      case 'bet': {
        const player = this.findPlayer(action.playerId);
        player.stack -= action.amount;
        this.state.pot += action.amount;
        break;
      }
      case 'call': {
        const player = this.findPlayer(action.playerId);
        player.stack -= action.amount;
        this.state.pot += action.amount;
        break;
      }
      case 'fold': {
        const player = this.findPlayer(action.playerId);
        player.folded = true;
        break;
      }
      case 'next': {
        this.advanceStreet();
        break;
      }
    }
    return this.state;
  }

  getState(): GameState {
    return this.state;
  }

  activePlayers(): PlayerState[] {
    return this.state.players.filter((p) => !p.folded);
  }

  private findPlayer(id: string): PlayerState {
    const player = this.state.players.find((p) => p.id === id);
    if (!player) throw new Error(`Unknown player ${id}`);
    return player;
  }

  private advanceStreet() {
    const index = ORDER.indexOf(this.state.street);
    this.state.street = ORDER[Math.min(index + 1, ORDER.length - 1)];
  }
}
