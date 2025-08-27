import { Injectable } from '@nestjs/common';

export interface TournamentInfo {
  id: string;
  title: string;
  buyIn: number;
  prizePool: number;
  players: { current: number; max: number };
  registered: boolean;
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
   * largest and smallest table is at most one player. Players who were
   * moved within the last `avoidWithin` hands are skipped when possible to
   * reduce churn.
   */
  balanceTables(
    tables: string[][],
    recentlyMoved: Map<string, number> = new Map(),
    currentHand = 0,
    avoidWithin = 10,
  ): string[][] {
    const result = tables.map((t) => [...t]);
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

      let player: string | undefined;
      for (let i = result[maxIdx].length - 1; i >= 0; i--) {
        const p = result[maxIdx][i];
        if (currentHand - (recentlyMoved.get(p) ?? -Infinity) > avoidWithin) {
          player = p;
          result[maxIdx].splice(i, 1);
          break;
        }
      }
      if (!player) player = result[maxIdx].pop();
      if (player) {
        result[minIdx].push(player);
        recentlyMoved.set(player, currentHand);
      }
    }
    return result;
  }

  /**
   * Distribute prize pool according to payout percentages. Supports
   * optional bounty/PKO pools and satellite seat calculation. Remainders
   * are distributed starting from the first place.
   */
  calculatePrizes(
    prizePool: number,
    payouts: number[],
    opts?: { bountyPct?: number; satelliteSeatCost?: number },
  ): {
    prizes: number[];
    bountyPool?: number;
    seats?: number;
    remainder?: number;
  } {
    let pool = prizePool;
    let bountyPool: number | undefined;
    if (opts?.bountyPct) {
      bountyPool = Math.floor(pool * opts.bountyPct);
      pool -= bountyPool;
    }

    let seats: number | undefined;
    let remainder: number | undefined;
    if (opts?.satelliteSeatCost) {
      seats = Math.floor(pool / opts.satelliteSeatCost);
      remainder = pool - seats * opts.satelliteSeatCost;
      pool = remainder;
    }

    const prizes = payouts.map((p) => Math.floor(pool * p));
    remainder = pool - prizes.reduce((a, b) => a + b, 0);
    let i = 0;
    while (remainder > 0) {
      prizes[i % prizes.length] += 1;
      remainder--;
      i++;
    }

    const response: {
      prizes: number[];
      bountyPool?: number;
      seats?: number;
      remainder?: number;
    } = { prizes };

    if (bountyPool !== undefined) response.bountyPool = bountyPool;
    if (seats !== undefined) response.seats = seats;
    if (remainder !== undefined) response.remainder = remainder;

    return response;
  }
}
