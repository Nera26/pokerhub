import pino from 'pino';
import { createWriteStream } from 'pino-loki';

const stream = createWriteStream({
  batching: true,
  interval: 5,
  host: process.env.LOKI_HOST || 'http://loki:3100',
});

export const logger = pino(
  { level: process.env.LOG_LEVEL || 'info' },
  stream,
);
