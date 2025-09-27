import { registerAs } from '@nestjs/config';

export default registerAs('logging', () => {
  const provider = process.env.LOG_PROVIDER ?? 'pino';
  const elasticUrl = process.env.ELASTIC_URL;
  const lokiUrl = process.env.LOKI_URL;

  if (!elasticUrl && !lokiUrl) {
    console.warn('No ELASTIC_URL or LOKI_URL configured; defaulting to console logging.');
  } else {
    if (!elasticUrl) {
      console.warn('ELASTIC_URL is not set; Elasticsearch logging disabled');
    }
    if (!lokiUrl) {
      console.warn('LOKI_URL is not set; Loki logging disabled');
    }
  }

  return {
    provider,
    elasticUrl,
    lokiUrl,
  };
});
