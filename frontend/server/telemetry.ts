import { setupTelemetry as setupSharedTelemetry, shutdownTelemetry } from '@shared/telemetry';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';

export function setupTelemetry(): Promise<void> {
  return setupSharedTelemetry({
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'pokerhub-frontend',
    meterName: 'frontend',
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new RuntimeNodeInstrumentation(),
    ],
  });
}

export { shutdownTelemetry };
