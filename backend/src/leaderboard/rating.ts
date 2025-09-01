export interface RatingOptions {
  /**
   * Base K-factor controlling reaction speed to new results. Values between 0
   * and 1. The effective K is further adjusted by volatility and session
   * count.
   */
  kFactor: number;
  /**
   * Decay factor applied per day to historic session points. Should be between
   * 0 and 1. Older sessions contribute less as this value decreases.
   */
  decay: number;
  /**
   * Sessions required before a player receives full K-factor weight. Players
   * with fewer sessions are dampened to prevent rating farming.
   */
  minSessions: number;
}

export interface RatingState {
  /** Current rating value for the player */
  rating: number;
  /** Average absolute deviation from expected session performance */
  volatility: number;
  /** Number of completed sessions before the current update */
  sessions: number;
}

/**
 * Applies a single session result to the rating state using a variable
 * K‑factor that scales with player volatility and session count. The rating is
 * treated as an exponentially weighted moving average of session points.
 */
export function updateRating(
  state: RatingState,
  points: number,
  ageDays: number,
  options: RatingOptions,
): RatingState {
  const weighted = points * Math.pow(options.decay, ageDays);
  const delta = weighted - state.rating;
  const experience = state.sessions + 1;
  const sessionFactor = Math.min(1, experience / options.minSessions);
  const dynamicK = options.kFactor * (1 + state.volatility) * sessionFactor;
  const rating = state.rating + dynamicK * delta;
  const volatility =
    (state.volatility * state.sessions + Math.abs(delta)) / experience;
  return { rating, volatility, sessions: experience };
}
