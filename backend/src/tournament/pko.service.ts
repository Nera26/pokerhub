import { Injectable } from '@nestjs/common';

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
