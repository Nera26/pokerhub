import { registerAs } from '@nestjs/config';

export default registerAs('logging', () => ({
  provider: process.env.LOG_PROVIDER ?? 'pino',
  elasticUrl: process.env.ELASTIC_URL ?? 'http://localhost:9200',
  lokiUrl: process.env.LOKI_URL ?? 'http://localhost:3100',
}));
