import { Injectable } from '@nestjs/common';

export interface TournamentInfo {
  id: string;
  title: string;
  buyIn: number;
  prizePool: number;
  players: { current: number; max: number };
  registered: boolean;
}

export interface PrizeOptions {
  bounty?: number;
  pko?: boolean;
  satelliteTicketValue?: number;
}

@Injectable()
export class TournamentService {
  private tournaments: TournamentInfo[] = [
    {
      id: 't1',
      title: 'Daily Free Roll',
      buyIn: 0,
      prizePool: 1000,
      players: { current: 0, max: 100 },
      registered: false,
    },
  ];

  list(): TournamentInfo[] {
    return this.tournaments;
  }

  /**
   * Balance players across tables so that the difference between the
   * largest and smallest table is at most one player. Players that were
   * moved within the last `minHands` hands are avoided when possible.
   *
   * `recentlyMoved` holds a counter of how many hands have passed since a
   * player was last moved. The method mutates this map, incrementing all
   * counters and resetting moved players to `0`.
   */
  balanceTables(
    tables: string[][],
    recentlyMoved: Record<string, number> = {},
    minHands = 10,
  ): string[][] {
    const result = tables.map((t) => [...t]);
    const movedThisRound: string[] = [];
    while (true) {
      let max = 0;
      let min = Infinity;
      let maxIdx = 0;
      let minIdx = 0;
      result.forEach((t, i) => {
        if (t.length > max) {
          max = t.length;
          maxIdx = i;
        }
        if (t.length < min) {
          min = t.length;
          minIdx = i;
        }
      });
      if (max - min <= 1) break;
      const from = result[maxIdx];
      let playerIndex = from.length - 1;
      for (let i = from.length - 1; i >= 0; i--) {
        const p = from[i];
        if (!recentlyMoved[p] || recentlyMoved[p] >= minHands) {
          playerIndex = i;
          break;
        }
      }
      const [player] = from.splice(playerIndex, 1);
      if (player) {
        result[minIdx].push(player);
        movedThisRound.push(player);
        recentlyMoved[player] = 0;
      }
    }
    Object.keys(recentlyMoved).forEach((p) => {
      if (!movedThisRound.includes(p)) recentlyMoved[p] += 1;
    });
    return result;
  }

  /**
   * Distribute prize pool according to payout percentages. Remainders are
   * distributed starting from the first place. Supports bounty/PKO and
   * satellite ticket logic.
   */
  calculatePrizes(
    prizePool: number,
    payouts: number[],
    options: PrizeOptions = {},
  ): Record<string, any> {
    if (options.satelliteTicketValue) {
      const seats = Math.floor(prizePool / options.satelliteTicketValue);
      return {
        prizes: Array(seats).fill(options.satelliteTicketValue),
        seats,
      };
    }

    const prizes = payouts.map((p) => Math.floor(prizePool * p));
    let remainder = prizePool - prizes.reduce((a, b) => a + b, 0);
    let i = 0;
    while (remainder > 0) {
      prizes[i % prizes.length] += 1;
      remainder--;
      i++;
    }

    const result: Record<string, any> = { prizes };
    if (options.bounty) {
      result.bounty = options.pko ? options.bounty / 2 : options.bounty;
      if (options.pko) result.pko = true;
    }
    return result;
  }
}
