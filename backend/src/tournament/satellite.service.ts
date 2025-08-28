import { Injectable } from '@nestjs/common';

/**
 * Satellite tournament utilities.
 */
@Injectable()
export class SatelliteService {
  /**
   * Calculate the number of seats awarded from a prize pool and the remaining chips.
   */
  calculateSeats(
    prizePool: number,
    seatCost: number,
  ): { seats: number; remainder: number } {
    const seats = Math.floor(prizePool / seatCost);
    const remainder = prizePool - seats * seatCost;
    return { seats, remainder };
  }
}
