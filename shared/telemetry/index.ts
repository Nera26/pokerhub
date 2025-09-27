import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import {
  metrics,
  type Counter,
  type Histogram,
  type ObservableResult,
  type Context,
} from '@opentelemetry/api';
import * as sdkMetrics from '@opentelemetry/sdk-metrics';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
  type MetricReader,
  type PushMetricExporter,
} from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { logs } from '@opentelemetry/api-logs';
import {
  LoggerProvider,
  BatchLogRecordProcessor,
  type LogRecordProcessor,
  type SdkLogRecord,
} from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import type { NodeSDKConfiguration } from '@opentelemetry/sdk-node';
import type { Request, Response, NextFunction } from 'express';
import { addSample, recordTimestamp, percentile } from './metrics';

interface TelemetryOptions {
  serviceName: string;
  meterName: string;
  instrumentations: NodeSDKConfiguration['instrumentations'];
  enableHttpMetrics?: boolean;
}

let sdk: NodeSDK | undefined;
let meterProvider: MeterProvider | undefined;
let loggerProvider: LoggerProvider | undefined;
let requestCounter: Counter | undefined;
let requestDuration: Histogram | undefined;
const requestLatencies: number[] = [];
const requestTimestamps: number[] = [];
let hasLoggedAggregationWarning = false;

const noopGauge = {
  addCallback() {},
  removeCallback() {},
} as {
  addCallback(cb: (r: ObservableResult) => void): void;
  removeCallback(cb: (r: ObservableResult) => void): void;
};
let reqP50 = noopGauge;
let reqP95 = noopGauge;
let reqP99 = noopGauge;
let reqThroughput = noopGauge;

function pruneTimestamps(now: number) {
  const cutoff = now - 1000;
  while (requestTimestamps.length && requestTimestamps[0] < cutoff) {
    requestTimestamps.shift();
  }
}

class LogCounterProcessor implements LogRecordProcessor {
  constructor(private counter: Counter) {}

  onEmit(record: SdkLogRecord, _context?: Context) {
    this.counter.add(1, { severity: record.severityText });
  }

  forceFlush() {
    return Promise.resolve();
  }

  shutdown() {
    return Promise.resolve();
  }
}

export let telemetryMiddleware = (
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  next();
};

export async function setupTelemetry({
  serviceName,
  meterName,
  instrumentations,
  enableHttpMetrics = false,
}: TelemetryOptions): Promise<void> {
  if (sdk) return;

  const resource = resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
  });

  let aggregationApi = (sdkMetrics as unknown as {
    aggregation?: { createAggregator?: unknown };
  }).aggregation;

  if (typeof aggregationApi?.createAggregator !== 'function') {
    try {
      const viewAggregation = require('@opentelemetry/sdk-metrics/build/src/view/Aggregation') as {
        DEFAULT_AGGREGATION?: { createAggregator?: unknown };
      };
      if (typeof viewAggregation.DEFAULT_AGGREGATION?.createAggregator === 'function') {
        aggregationApi = viewAggregation.DEFAULT_AGGREGATION;
      }
    } catch (error) {
      // ignore missing compat module and fall back to existing detection
    }
  }

  const metricsSupported = typeof aggregationApi?.createAggregator === 'function';
  if (!metricsSupported && !hasLoggedAggregationWarning) {
    hasLoggedAggregationWarning = true;
    console.warn(
      'Telemetry metrics disabled: incompatible @opentelemetry/sdk-metrics aggregation helpers. '
        + 'Upgrade dependencies or ensure the compatibility shim runs early in the bootstrap sequence.',
    );
  }

  if (metricsSupported) {
    const metricReaders: MetricReader[] = [];

    const prometheus = new PrometheusExporter({
      port: Number(process.env.OTEL_EXPORTER_PROMETHEUS_PORT) || 9464,
      host: process.env.OTEL_EXPORTER_PROMETHEUS_HOST ?? '0.0.0.0',
      endpoint: process.env.OTEL_EXPORTER_PROMETHEUS_ENDPOINT ?? '/metrics',
    });
    metricReaders.push(prometheus);

    const otlpMetricsEndpoint = process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT;
    if (otlpMetricsEndpoint) {
      const otlpExporter = new OTLPMetricExporter({ url: otlpMetricsEndpoint });
      metricReaders.push(
        new PeriodicExportingMetricReader({
          exporter: otlpExporter as unknown as PushMetricExporter,
        }),
      );
    }

    meterProvider = new MeterProvider({ resource });
    for (const reader of metricReaders) {
      meterProvider.addMetricReader(reader);
    }
    metrics.setGlobalMeterProvider(meterProvider);
  }

  const logRecordProcessors: LogRecordProcessor[] = [];
  const otlpLogsEndpoint =
    process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT ??
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (otlpLogsEndpoint) {
    const logExporter = new OTLPLogExporter({ url: otlpLogsEndpoint });
    logRecordProcessors.push(new BatchLogRecordProcessor(logExporter));
  }

  try {
    const meter = meterProvider?.getMeter(meterName);
    if (meter) {
      const logCounter = meter.createCounter('log_records_total', {
        description: 'Total log records by severity',
      });
      logRecordProcessors.push(new LogCounterProcessor(logCounter));
    }

    if (enableHttpMetrics && meter) {
      requestCounter = meter.createCounter('http_requests_total', {
        description: 'Total HTTP requests received',
      });
      requestDuration = meter.createHistogram('http_request_duration_ms', {
        description: 'HTTP request duration',
        unit: 'ms',
      });
      reqP50 =
        meter.createObservableGauge?.('http_request_duration_p50_ms', {
          description: 'p50 HTTP request latency',
          unit: 'ms',
        }) ?? noopGauge;
      reqP95 =
        meter.createObservableGauge?.('http_request_duration_p95_ms', {
          description: 'p95 HTTP request latency',
          unit: 'ms',
        }) ?? noopGauge;
      reqP99 =
        meter.createObservableGauge?.('http_request_duration_p99_ms', {
          description: 'p99 HTTP request latency',
          unit: 'ms',
        }) ?? noopGauge;
      reqThroughput =
        meter.createObservableGauge?.('http_request_throughput', {
          description: 'HTTP request throughput per second',
          unit: 'req/s',
        }) ?? noopGauge;
      reqP50.addCallback((r) => r.observe(percentile(requestLatencies, 50)));
      reqP95.addCallback((r) => r.observe(percentile(requestLatencies, 95)));
      reqP99.addCallback((r) => r.observe(percentile(requestLatencies, 99)));
      reqThroughput.addCallback((r) => {
        pruneTimestamps(Date.now());
        r.observe(requestTimestamps.length);
      });

      telemetryMiddleware = (req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();
        res.on('finish', () => {
          const route = req.route?.path ?? req.path;
          const duration = Date.now() - start;
          requestCounter?.add(1, {
            method: req.method,
            route,
            status: res.statusCode,
          });
          requestDuration?.record(duration, {
            method: req.method,
            route,
            status: res.statusCode,
          });
          addSample(requestLatencies, duration);
          recordTimestamp(requestTimestamps, Date.now());
        });
        next();
      };
    }
  } catch (err) {
    console.warn('Telemetry metrics disabled due to initialization failure.', err);
  }

  loggerProvider = new LoggerProvider({
    resource,
    processors: logRecordProcessors,
  });
  logs.setGlobalLoggerProvider(loggerProvider);

  sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    }),
    instrumentations,
  });

  await sdk.start();
}

export async function shutdownTelemetry() {
  if (!sdk) return;

  const warn = (message: string, err: unknown) => {
    console.warn(message, err);
  };

  try {
    await sdk.shutdown();
  } catch (err) {
    warn('Telemetry trace shutdown failed; continuing exit.', err);
  }

  if (meterProvider) {
    try {
      await meterProvider.shutdown();
    } catch (err) {
      warn('Telemetry metrics shutdown failed; continuing exit.', err);
    }
  }

  if (loggerProvider) {
    try {
      await loggerProvider.shutdown();
    } catch (err) {
      warn('Telemetry logger shutdown failed; continuing exit.', err);
    }
  }

  sdk = undefined;
  meterProvider = undefined;
  loggerProvider = undefined;
  telemetryMiddleware = (
    _req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    next();
  };
}

