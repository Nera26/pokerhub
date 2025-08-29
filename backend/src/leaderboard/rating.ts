export interface RatingOptions {
  /**
   * K-factor controls how quickly ratings adjust to new results.
   * Values should be between 0 and 1. Higher values react faster
   * to recent performance while lower values provide more stability.
   */
  kFactor: number;
  /**
   * Decay factor applied per day to historic session points. Should
   * be between 0 and 1. Older sessions contribute less as this value
   * decreases.
   */
  decay: number;
}

/**
 * Applies a single session result to an existing rating using a simple
 * K-factor algorithm with time decay. The rating is treated as an
 * exponentially weighted moving average of session points.
 *
 * @param rating    Current rating value for the player
 * @param points    Session points to apply (positive or negative)
 * @param ageDays   Age of the session in days
 * @param options   Rating options including kFactor and decay
 * @returns Updated rating
 */
export function updateRating(
  rating: number,
  points: number,
  ageDays: number,
  options: RatingOptions,
): number {
  const weighted = points * Math.pow(options.decay, ageDays);
  return rating + options.kFactor * (weighted - rating);
}
