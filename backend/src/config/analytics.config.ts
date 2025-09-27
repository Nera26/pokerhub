import { registerAs } from '@nestjs/config';

export default registerAs('analytics', () => ({
  clickhouseUrl: process.env.CLICKHOUSE_URL,
  kafkaBrokers: process.env.KAFKA_BROKERS,
}));
