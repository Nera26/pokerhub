import { registerAs } from '@nestjs/config';
import { logInfrastructureNotice } from '../common/logging';

export default registerAs('logging', () => {
  const provider = process.env.LOG_PROVIDER ?? 'pino';
  const elasticUrl = process.env.ELASTIC_URL;
  const lokiUrl = process.env.LOKI_URL;

  if (!elasticUrl && !lokiUrl) {
    logInfrastructureNotice(
      'No ELASTIC_URL or LOKI_URL configured; defaulting to console logging.',
    );
  } else {
    if (!elasticUrl) {
      logInfrastructureNotice('ELASTIC_URL is not set; Elasticsearch logging disabled');
    }
    if (!lokiUrl) {
      logInfrastructureNotice('LOKI_URL is not set; Loki logging disabled');
    }
  }

  return {
    provider,
    elasticUrl,
    lokiUrl,
  };
});
