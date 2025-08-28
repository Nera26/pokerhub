export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type HandPhase =
  | 'WAIT_BLINDS'
  | 'DEAL'
  | 'BETTING_ROUND'
  | 'SHOWDOWN'
  | 'SETTLE';

export type GameAction =
  | { type: 'postBlind'; playerId: string; amount: number }
  | { type: 'bet'; playerId: string; amount: number }
  | { type: 'raise'; playerId: string; amount: number }
  | { type: 'call'; playerId: string; amount?: number }
  | { type: 'check'; playerId: string }
  | { type: 'fold'; playerId: string }
  | { type: 'next' };

export interface PlayerState {
  id: string;
  stack: number;
  folded: boolean;
  bet: number; // amount committed this betting round
  allIn: boolean;
}

export interface GameState {
  phase: HandPhase;
  street: Street;
  pot: number;
  sidePots: { amount: number; players: string[] }[];
  currentBet: number;
  players: PlayerState[];
}

const ORDER: Street[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];

export class HandStateMachine {
  constructor(private readonly state: GameState) {}

  private blindsPosted = new Set<string>();

  apply(action: GameAction): GameState {
    switch (this.state.phase) {
      case 'WAIT_BLINDS': {
        if (action.type === 'postBlind') {
          const player = this.findPlayer(action.playerId);
          this.placeBet(player, action.amount);
          this.blindsPosted.add(player.id);
          if (this.blindsPosted.size === this.state.players.length) {
            this.state.phase = 'DEAL';
          }
        }
        break;
      }
      case 'DEAL': {
        if (action.type === 'next') {
          this.state.phase = 'BETTING_ROUND';
        }
        break;
      }
      case 'BETTING_ROUND': {
        switch (action.type) {
          case 'bet':
          case 'raise':
          case 'postBlind': {
            const player = this.findPlayer(action.playerId);
            this.placeBet(player, action.amount);
            break;
          }
          case 'call': {
            const player = this.findPlayer(action.playerId);
            const toCall = this.state.currentBet - player.bet;
            this.placeBet(player, toCall);
            break;
          }
          case 'check': {
            break;
          }
          case 'fold': {
            const player = this.findPlayer(action.playerId);
            player.folded = true;
            break;
          }
          case 'next': {
            this.finishBettingRound();
            if (this.state.street === 'river') {
              this.advanceStreet();
              this.state.phase = 'SHOWDOWN';
            } else {
              this.advanceStreet();
              this.state.phase = 'DEAL';
            }
            break;
          }
        }
        break;
      }
      case 'SHOWDOWN': {
        if (action.type === 'next') {
          this.state.phase = 'SETTLE';
        }
        break;
      }
      case 'SETTLE': {
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

  private placeBet(player: PlayerState, amount: number) {
    const wager = Math.min(player.stack, amount);
    player.stack -= wager;
    player.bet += wager;
    this.state.pot += wager;
    if (player.bet > this.state.currentBet) {
      this.state.currentBet = player.bet;
    }
    if (player.stack === 0) {
      player.allIn = true;
    }
  }

  private finishBettingRound() {
    const active = this.activePlayers().map((p) => p.id);
    const total = this.state.players.reduce((s, p) => s + p.bet, 0);
    if (total > 0) {
      this.state.sidePots.push({ amount: total, players: active });
    }
    for (const p of this.state.players) {
      p.bet = 0;
    }
    this.state.currentBet = 0;
  }
}
