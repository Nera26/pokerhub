import { registerAs } from '@nestjs/config';

export default registerAs('analytics', () => ({
  clickhouseUrl: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
  kafkaBrokers: process.env.KAFKA_BROKERS,
}));
