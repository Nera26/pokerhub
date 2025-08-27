import { registerAs } from '@nestjs/config';

export default registerAs('telemetry', () => ({
  otlpEndpoint:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
    'http://localhost:4318/v1/traces',
  serviceName: process.env.OTEL_SERVICE_NAME ?? 'pokerhub-api',
}));
