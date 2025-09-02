import { registerAs } from '@nestjs/config';

export default registerAs('tournament', () => ({
  /**
   * Number of hands a player must wait before being eligible to move again
   * during table balancing. Accessible as `tournament.avoidWithin` and
   * configurable via the `TOURNAMENT_AVOID_WITHIN` environment variable.
   */
  avoidWithin: Math.max(
    0,
    parseInt(process.env.TOURNAMENT_AVOID_WITHIN ?? '10', 10),
  ),
}));
