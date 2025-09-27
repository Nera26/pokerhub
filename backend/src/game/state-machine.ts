import { HandRNG } from './rng';
import { standardDeck } from '@shared/verify';
import { settlePots } from './settlement';

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type HandPhase =
  | 'WAIT_BLINDS'
  | 'DEAL'
  | 'BETTING_ROUND'
  | 'SHOWDOWN'
  | 'SETTLE'
  | 'NEXT_HAND';

export type GameAction =
  | { type: 'postBlind'; playerId: string; amount: number }
  | { type: 'bet'; playerId: string; amount: number }
  | { type: 'raise'; playerId: string; amount: number }
  | { type: 'call'; playerId: string; amount?: number }
  | { type: 'check'; playerId: string }
  | { type: 'fold'; playerId: string }
  | { type: 'next' };

export interface PlayerStateInternal {
  id: string;
  stack: number;
  folded: boolean;
  bet: number; // amount committed this betting round
  allIn: boolean;
  holeCards?: number[];
}

export interface GameStateInternal {
  phase: HandPhase;
  street: Street;
  pot: number;
  sidePots: {
    amount: number;
    players: string[];
    contributions: Record<string, number>;
  }[];
  currentBet: number;
  players: PlayerStateInternal[];
  deck: number[];
  communityCards: number[];
}

const ORDER: Street[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];

export class HandStateMachine {
  constructor(
    private readonly state: GameStateInternal,
    private readonly rng: HandRNG,
    private readonly config: { smallBlind: number; bigBlind: number },
  ) {}

  private blindsPosted = new Set<string>();

  apply(action: GameAction): GameStateInternal {
    switch (this.state.phase) {
      case 'WAIT_BLINDS':
      case 'NEXT_HAND': {
        if (action.type === 'postBlind') {
          const player = this.findPlayer(action.playerId);
          this.placeBet(player, action.amount);
          this.blindsPosted.add(player.id);
          if (this.blindsPosted.size === this.state.players.length) {
            this.state.deck = this.buildDeck(new Set());
            for (const p of this.state.players) {
              p.holeCards = [this.state.deck.pop()!, this.state.deck.pop()!];
            }
            this.state.phase = 'DEAL';
            this.blindsPosted.clear();
          }
        } else {
          throw new Error('invalid action for phase');
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
        } else {
          throw new Error('invalid action for phase');
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
          default:
            throw new Error('invalid action for phase');
        }

        if (this.state.phase === 'BETTING_ROUND' && this.activePlayers().length <= 1) {
          const hasCommitted = this.state.players.some((p) => p.bet > 0);
          if (hasCommitted) {
            this.finishBettingRound();
          } else {
            this.state.currentBet = 0;
          }
          this.state.phase = 'SHOWDOWN';
        }
        break;
      }
      case 'SHOWDOWN': {
        if (action.type === 'next') {
          settlePots(this.state);
          this.state.phase = 'SETTLE';
        } else {
          throw new Error('invalid action for phase');
        }
        break;
      }
      case 'SETTLE': {
        if (action.type === 'next') {
          for (const p of this.state.players) {
            p.folded = false;
            p.bet = 0;
            p.allIn = false;
            delete p.holeCards;
          }
          this.state.pot = 0;
          this.state.sidePots = [];
          this.state.currentBet = 0;
          this.state.communityCards = [];
          this.state.deck = [];
          this.state.street = 'preflop';
          this.state.phase = 'NEXT_HAND';
          this.blindsPosted.clear();
        } else {
          throw new Error('invalid action for phase');
        }
        break;
      }
    }
    return this.state;
  }

  getState(): GameStateInternal {
    return this.state;
  }

  activePlayers(): PlayerStateInternal[] {
    return this.state.players.filter((p) => !p.folded);
  }

  private findPlayer(id: string): PlayerStateInternal {
    const player = this.state.players.find((p) => p.id === id);
    if (!player) throw new Error(`Unknown player ${id}`);
    return player;
  }

  private advanceStreet() {
    const index = ORDER.indexOf(this.state.street);
    this.state.street = ORDER[Math.min(index + 1, ORDER.length - 1)];
  }

  private placeBet(player: PlayerStateInternal, amount: number) {
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
      let contenders = contributors.filter((p) => !p.folded);
      const potAmount = (level - previous) * contributors.length;
      if (potAmount > 0) {
        const contributions: Record<string, number> = {};
        for (const player of contributors) {
          contributions[player.id] = level - previous;
        }
        if (contenders.length === 0) {
          contenders = this.activePlayers();
          for (const player of contenders) {
            if (!(player.id in contributions)) {
              contributions[player.id] = 0;
            }
          }
        }
        if (contenders.length === 0) {
          contenders = contributors;
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

  private expectedCommunityCountBeforeDeal(): number {
    switch (this.state.street) {
      case 'flop':
        return 0;
      case 'turn':
        return 3;
      case 'river':
        return 4;
      default:
        return this.state.communityCards.length;
    }
  }

  private ensureDeckCapacity(n: number) {
    const sanitized = this.state.deck.filter(
      (card): card is number => typeof card === 'number',
    );
    if (sanitized.length !== this.state.deck.length) {
      this.state.deck = sanitized;
    }

    const used = new Set<number>();
    const markUsed = (card?: number) => {
      if (typeof card === 'number') {
        used.add(card);
      }
    };
    this.state.communityCards.forEach((card) => markUsed(card));
    for (const player of this.state.players) {
      player.holeCards?.forEach((card) => markUsed(card));
    }

    const deckSize = standardDeck().length;
    const expectedRemaining = deckSize - used.size;

    if (this.state.deck.length !== expectedRemaining || this.state.deck.length < n) {
      const remainingShoe = standardDeck().filter((card) => !used.has(card));
      if (remainingShoe.length < n) {
        throw new Error('insufficient cards to continue hand');
      }
      this.state.deck = this.buildDeck(used);
    }
  }

  private buildDeck(excluded: Set<number>): number[] {
    const available = standardDeck().filter((card) => !excluded.has(card));
    const shuffled = this.rng.shuffle(available);
    const seen = new Set<number>();
    const deck: number[] = [];

    for (const card of shuffled) {
      if (typeof card === 'number' && !excluded.has(card) && !seen.has(card)) {
        seen.add(card);
        deck.push(card);
      }
    }

    if (deck.length < available.length) {
      for (const card of available) {
        if (!seen.has(card)) {
          seen.add(card);
          deck.push(card);
        }
      }
    }

    return deck;
  }

  private dealCommunity(n: number) {
    const expected = this.expectedCommunityCountBeforeDeal();
    if (this.state.communityCards.length !== expected) {
      throw new Error('community cards already dealt for street');
    }

    this.ensureDeckCapacity(n);

    for (let i = 0; i < n; i++) {
      const card = this.state.deck.pop();
      if (card === undefined) throw new Error('deck exhausted');
      this.state.communityCards.push(card);
    }
  }
}
