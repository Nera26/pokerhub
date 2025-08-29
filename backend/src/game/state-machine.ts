import { HandRNG, standardDeck } from './rng';

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
  holeCards?: number[];
}

export interface GameState {
  phase: HandPhase;
  street: Street;
  pot: number;
  sidePots: {
    amount: number;
    players: string[];
    contributions: Record<string, number>;
  }[];
  currentBet: number;
  players: PlayerState[];
  deck: number[];
  communityCards: number[];
}

const ORDER: Street[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];

export class HandStateMachine {
  constructor(
    private readonly state: GameState,
    private readonly rng: HandRNG,
    private readonly config: { smallBlind: number; bigBlind: number },
  ) {}

  private blindsPosted = new Set<string>();

  apply(action: GameAction): GameState {
    switch (this.state.phase) {
      case 'WAIT_BLINDS': {
        if (action.type === 'postBlind') {
          const player = this.findPlayer(action.playerId);
          this.placeBet(player, action.amount);
          this.blindsPosted.add(player.id);
          if (this.blindsPosted.size === this.state.players.length) {
            this.state.deck = this.rng.shuffle(standardDeck());
            for (const p of this.state.players) {
              p.holeCards = [this.state.deck.pop()!, this.state.deck.pop()!];
            }
            this.state.phase = 'DEAL';
          }
        }
        break;
      }
      case 'DEAL': {
        if (action.type === 'next') {
          switch (this.state.street) {
            case 'flop':
              this.dealCommunity(3);
              break;
            case 'turn':
            case 'river':
              this.dealCommunity(1);
              break;
          }
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
    if (amount <= 0) {
      throw new Error('amount must be positive');
    }
    if (amount > player.stack) {
      throw new Error('bet exceeds stack');
    }

    player.stack -= amount;
    player.bet += amount;
    this.state.pot += amount;
    if (player.bet > this.state.currentBet) {
      this.state.currentBet = player.bet;
    }
    if (player.stack === 0) {
      player.allIn = true;
    }
  }

  private finishBettingRound() {
    const bettors = this.state.players.filter((p) => p.bet > 0);
    if (bettors.length === 0) {
      this.state.currentBet = 0;
      return;
    }

    const levels = Array.from(new Set(bettors.map((p) => p.bet))).sort(
      (a, b) => a - b,
    );
    let previous = 0;
    for (const level of levels) {
      const contributors = bettors.filter((p) => p.bet >= level);
      const contenders = contributors.filter((p) => !p.folded);
      const potAmount = (level - previous) * contributors.length;
      if (potAmount > 0) {
        const contributions: Record<string, number> = {};
        for (const player of contributors) {
          contributions[player.id] = level - previous;
        }
        this.state.sidePots.push({
          amount: potAmount,
          players: contenders.map((c) => c.id),
          contributions,
        });
      }
      previous = level;
    }

    for (const p of this.state.players) {
      p.bet = 0;
    }
    this.state.currentBet = 0;
  }

  private dealCommunity(n: number) {
    for (let i = 0; i < n; i++) {
      const card = this.state.deck.pop();
      if (card === undefined) throw new Error('deck exhausted');
      this.state.communityCards.push(card);
    }
  }
}
