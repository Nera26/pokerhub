import { setupTelemetry, shutdownTelemetry } from './telemetry';

setupTelemetry();

const shutdown = async () => {
  await shutdownTelemetry();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Event processing logic would go here. Wrap handlers using `withEventMetrics`
// from `./telemetry` to record per-event metrics.

