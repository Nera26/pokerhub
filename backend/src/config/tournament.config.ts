import { registerAs } from '@nestjs/config';

export default registerAs('tournament', () => ({
  avoidWithin: parseInt(process.env.TOURNAMENT_AVOID_WITHIN ?? '10', 10),
}));
