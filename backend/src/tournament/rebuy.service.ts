import { Injectable } from '@nestjs/common';

/**
 * Rebuy and add-on helpers.
 */
@Injectable()
export class RebuyService {
  /**
   * Determine whether a player may rebuy based on their current stack.
   */
  canRebuy(stack: number, threshold: number): boolean {
    return stack <= threshold;
  }

  /**
   * Apply a rebuy or add-on, returning the new stack and prize contribution.
   */
  apply(
    stack: number,
    chips: number,
    cost: number,
  ): { stack: number; prizeContribution: number } {
    return { stack: stack + chips, prizeContribution: cost };
  }
}
