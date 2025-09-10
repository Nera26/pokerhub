import { Injectable } from '@nestjs/common';
import { calculateIcmPayouts } from '@shared/utils/icm';

export interface CalculatePrizeOptions {
  bountyPct?: number;
  satelliteSeatCost?: number;
  method?: 'topN' | 'icm';
  stacks?: number[];
}

export function calculatePrizes(
  prizePool: number,
  payouts: number[],
  opts: CalculatePrizeOptions = {},
): {
  prizes: number[];
  bountyPool?: number;
  seats?: number;
  remainder?: number;
} {
  let pool = prizePool;
  let bountyPool: number | undefined;
  if (opts.bountyPct) {
    bountyPool = Math.floor(pool * opts.bountyPct);
    pool -= bountyPool;
  }

  let seats: number | undefined;
  let remainder: number | undefined;
  if (opts.satelliteSeatCost) {
    seats = Math.floor(pool / opts.satelliteSeatCost);
    remainder = pool - seats * opts.satelliteSeatCost;
    pool = remainder;
  }

  let prizes: number[];
  if (opts.method === 'icm' && opts.stacks) {
    prizes = calculateIcmPayouts(opts.stacks, payouts);
    remainder = pool - prizes.reduce((a, b) => a + b, 0);
  } else {
    prizes = payouts.map((p) => Math.floor(pool * p));
    remainder = pool - prizes.reduce((a, b) => a + b, 0);
  }

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

/**
 * Progressive knockout (PKO) tournament helper utilities.
 */
@Injectable()
export class PkoService {
  /**
   * Split the total prize pool into regular and bounty pools.
   */
  splitPrizePool(
    total: number,
    bountyPct: number,
  ): { prizePool: number; bountyPool: number } {
    const bountyPool = Math.floor(total * bountyPct);
    return { prizePool: total - bountyPool, bountyPool };
  }

  /**
   * Calculate the bounty award for eliminating a player.
   * Half of the eliminated player's bounty is awarded to the winner and the
   * rest is added to the winner's bounty.
   */
  settleBounty(currentBounty: number): {
    playerAward: number;
    newBounty: number;
  } {
    const playerAward = Math.floor(currentBounty / 2);
    const newBounty = currentBounty - playerAward;
    return { playerAward, newBounty };
  }
}
