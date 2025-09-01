import { registerAs } from '@nestjs/config';

export default registerAs('game', () => ({
  actionTimeoutMs: parseInt(process.env.ACTION_TIMEOUT_MS ?? '30000', 10),
}));
