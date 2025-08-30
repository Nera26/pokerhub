import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { AmqplibInstrumentation } from '@opentelemetry/instrumentation-amqplib';
import { KafkajsInstrumentation } from '@opentelemetry/instrumentation-kafkajs';
import { SocketIoInstrumentation } from '@opentelemetry/instrumentation-socket.io';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
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
} from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

import type { Counter } from '@opentelemetry/api';
import { LogRecordProcessor, LogRecord } from '@opentelemetry/sdk-logs';

let sdk: NodeSDK | undefined;
let meterProvider: MeterProvider | undefined;
let loggerProvider: LoggerProvider | undefined;

export function setupTelemetry() {
  if (sdk) return sdk;

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]:
      process.env.OTEL_SERVICE_NAME ?? 'pokerhub-api',
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

  const meter = meterProvider.getMeter('backend');
  const logCounter = meter.createCounter('log_records_total', {
    description: 'Total log records by severity',
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
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new IORedisInstrumentation(),
      new PgInstrumentation(),
      new AmqplibInstrumentation(),
      new KafkajsInstrumentation(),
      new SocketIoInstrumentation(),
      new PinoInstrumentation(),
      new NestInstrumentation(),
      new RuntimeNodeInstrumentation(),
    ],
  });

  sdk.start();
  return sdk;
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
