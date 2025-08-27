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
   * largest and smallest table is at most one player.
   */
  balanceTables(tables: string[][]): string[][] {
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
      const player = result[maxIdx].pop();
      if (player) result[minIdx].push(player);
    }
    return result;
  }

  /**
   * Distribute prize pool according to payout percentages. Remainders are
   * distributed starting from the first place.
   */
  calculatePrizes(prizePool: number, payouts: number[]): number[] {
    const prizes = payouts.map((p) => Math.floor(prizePool * p));
    let remainder = prizePool - prizes.reduce((a, b) => a + b, 0);
    let i = 0;
    while (remainder > 0) {
      prizes[i % prizes.length] += 1;
      remainder--;
      i++;
    }
    return prizes;
  }
}
