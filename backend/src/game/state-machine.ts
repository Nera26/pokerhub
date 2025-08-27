export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type GameAction =
  | { type: 'bet'; playerId: string; amount: number }
  | { type: 'call'; playerId: string }
  | { type: 'fold'; playerId: string }
  | { type: 'next' };

export interface PlayerState {
  id: string;
  stack: number;
  bet: number;
  folded: boolean;
  allIn: boolean;
  holeCards?: string[];
}

export interface GameState {
  street: Street;
  pot: number;
  sidePots: number[];
  dealer: number;
  currentBet: number;
  players: PlayerState[];
}

const ORDER: Street[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];

export class HandStateMachine {
  constructor(
    private readonly state: GameState,
    private readonly smallBlind = 1,
    private readonly bigBlind = 2,
  ) {
    this.postBlinds();
  }

  apply(action: GameAction): GameState {
    switch (action.type) {
      case 'bet': {
        const player = this.findPlayer(action.playerId);
        const total = player.bet + action.amount;
        if (total <= this.state.currentBet) {
          throw new Error('bet must raise');
        }
        const toCall = this.state.currentBet - player.bet;
        const amount = Math.min(player.stack, action.amount + toCall);
        player.stack -= amount;
        player.bet += amount;
        this.state.pot += amount;
        if (player.bet > this.state.currentBet) {
          this.state.currentBet = player.bet;
        }
        if (player.stack === 0) {
          player.allIn = true;
          this.state.sidePots.push(player.bet);
        }
        break;
      }
      case 'call': {
        const player = this.findPlayer(action.playerId);
        const toCall = this.state.currentBet - player.bet;
        const amount = Math.min(player.stack, toCall);
        player.stack -= amount;
        player.bet += amount;
        this.state.pot += amount;
        if (player.stack === 0) {
          player.allIn = true;
          this.state.sidePots.push(player.bet);
        }
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
    return this.state.players.filter((p) => !p.folded && !p.allIn);
  }

  private findPlayer(id: string): PlayerState {
    const player = this.state.players.find((p) => p.id === id);
    if (!player) throw new Error(`Unknown player ${id}`);
    return player;
  }

  private advanceStreet() {
    this.state.players.forEach((p) => (p.bet = 0));
    this.state.currentBet = 0;
    const index = ORDER.indexOf(this.state.street);
    this.state.street = ORDER[Math.min(index + 1, ORDER.length - 1)];
  }

  private postBlinds() {
    const sbIndex = (this.state.dealer + 1) % this.state.players.length;
    const bbIndex = (this.state.dealer + 2) % this.state.players.length;
    this.takeBlind(sbIndex, this.smallBlind);
    this.takeBlind(bbIndex, this.bigBlind);
    this.state.currentBet = this.bigBlind;
  }

  private takeBlind(index: number, amount: number) {
    const player = this.state.players[index];
    const blind = Math.min(player.stack, amount);
    player.stack -= blind;
    player.bet = blind;
    this.state.pot += blind;
    if (player.stack === 0) {
      player.allIn = true;
      this.state.sidePots.push(player.bet);
    }
  }
}
