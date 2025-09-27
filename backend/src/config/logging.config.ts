import { Logger } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import { logBootstrapNotice } from '../common/logging.utils';

const logger = new Logger('LoggingConfig');

export default registerAs('logging', () => {
  const provider = process.env.LOG_PROVIDER ?? 'pino';
  const elasticUrl = process.env.ELASTIC_URL;
  const lokiUrl = process.env.LOKI_URL;

  if (!elasticUrl && !lokiUrl) {
    logBootstrapNotice(
      logger,
      'No ELASTIC_URL or LOKI_URL configured; defaulting to console logging.',
    );
  } else {
    if (!elasticUrl) {
      logBootstrapNotice(logger, 'ELASTIC_URL is not set; Elasticsearch logging disabled');
    }
    if (!lokiUrl) {
      logBootstrapNotice(logger, 'LOKI_URL is not set; Loki logging disabled');
    }
  }

  return {
    provider,
    elasticUrl,
    lokiUrl,
  };
});
