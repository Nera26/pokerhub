import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { metrics } from '@opentelemetry/api';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { logs } from '@opentelemetry/api-logs';
import {
  LoggerProvider,
  BatchLogRecordProcessor,
  LogRecordProcessor,
  LogRecord,
} from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import type { Counter } from '@opentelemetry/api';

let sdk: NodeSDK | undefined;
let meterProvider: MeterProvider | undefined;
let loggerProvider: LoggerProvider | undefined;
let eventCounter: Counter | undefined;

export function setupTelemetry() {
  if (sdk) return sdk;

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]:
      process.env.OTEL_SERVICE_NAME ?? 'analytics-service',
  });

  const prometheus = new PrometheusExporter({
    port: Number(process.env.OTEL_EXPORTER_PROMETHEUS_PORT) || 9464,
    host: process.env.OTEL_EXPORTER_PROMETHEUS_HOST ?? '0.0.0.0',
    endpoint: process.env.OTEL_EXPORTER_PROMETHEUS_ENDPOINT ?? '/metrics',
  });

  meterProvider = new MeterProvider({ resource });
  meterProvider.addMetricReader(prometheus);

  const otlpMetricsEndpoint = process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT;
  if (otlpMetricsEndpoint) {
    const otlpExporter = new OTLPMetricExporter({ url: otlpMetricsEndpoint });
    meterProvider.addMetricReader(
      new PeriodicExportingMetricReader({ exporter: otlpExporter }),
    );
  }
  metrics.setGlobalMeterProvider(meterProvider);

  loggerProvider = new LoggerProvider({ resource });
  const otlpLogsEndpoint =
    process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT ??
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (otlpLogsEndpoint) {
    const logExporter = new OTLPLogExporter({ url: otlpLogsEndpoint });
    loggerProvider.addLogRecordProcessor(
      new BatchLogRecordProcessor(logExporter),
    );
  }

  const meter = meterProvider.getMeter('analytics');
  const logCounter = meter.createCounter('log_records_total', {
    description: 'Total log records by severity',
  });
  eventCounter = meter.createCounter('events_processed_total', {
    description: 'Total analytics events processed',
  });

  class LogCounterProcessor implements LogRecordProcessor {
    constructor(private counter: Counter) {}

    onEmit(record: LogRecord) {
      this.counter.add(1, { severity: record.severityText });
    }

    forceFlush() {
      return Promise.resolve();
    }

    shutdown() {
      return Promise.resolve();
    }
  }

  loggerProvider.addLogRecordProcessor(new LogCounterProcessor(logCounter));
  logs.setGlobalLoggerProvider(loggerProvider);

  sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    }),
    instrumentations: [new RuntimeNodeInstrumentation()],
  });

  sdk.start();
  return sdk;
}

export function withEventMetrics<T extends (...args: any[]) => any>(
  eventName: string,
  fn: T,
): T {
  const wrapped = (async (...args: any[]) => {
    try {
      const result = await fn(...args);
      eventCounter?.add(1, { event: eventName, status: 'success' });
      return result;
    } catch (err) {
      eventCounter?.add(1, { event: eventName, status: 'error' });
      throw err;
    }
  }) as T;

  return wrapped;
}

export async function shutdownTelemetry() {
  if (!sdk) return;

  await sdk.shutdown();
  await meterProvider?.shutdown();
  await loggerProvider?.shutdown();
  sdk = undefined;
  meterProvider = undefined;
  loggerProvider = undefined;
}

