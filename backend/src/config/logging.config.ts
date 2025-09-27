import { Logger } from '@nestjs/common';
import { registerAs } from '@nestjs/config';

const logger = new Logger('LoggingConfig');

export default registerAs('logging', () => {
  const provider = process.env.LOG_PROVIDER ?? 'pino';
  const elasticUrl = process.env.ELASTIC_URL;
  const lokiUrl = process.env.LOKI_URL;

  if (!elasticUrl && !lokiUrl) {
    logger.warn('No ELASTIC_URL or LOKI_URL configured; defaulting to console logging.');
  } else {
    if (!elasticUrl) {
      logger.warn('ELASTIC_URL is not set; Elasticsearch logging disabled');
    }
    if (!lokiUrl) {
      logger.warn('LOKI_URL is not set; Loki logging disabled');
    }
  }

  return {
    provider,
    elasticUrl,
    lokiUrl,
  };
});
