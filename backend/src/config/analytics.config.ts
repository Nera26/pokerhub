import { registerAs } from '@nestjs/config';

export default registerAs('analytics', () => ({
  clickhouseUrl: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
}));
