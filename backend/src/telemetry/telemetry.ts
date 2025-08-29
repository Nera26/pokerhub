import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { metrics } from '@opentelemetry/api';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

let sdk: NodeSDK | undefined;
let meterProvider: MeterProvider | undefined;

export function setupTelemetry() {
  if (sdk) return sdk;

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]:
      process.env.OTEL_SERVICE_NAME ?? 'pokerhub-api',
  });

  const prometheus = new PrometheusExporter({
    port: Number(process.env.OTEL_PROMETHEUS_PORT) || 9464,
    endpoint: '/metrics',
  });

  meterProvider = new MeterProvider({ resource });
  meterProvider.addMetricReader(prometheus);

  const alertUrl = process.env.ALERTMANAGER_URL;
  if (alertUrl) {
    const otlpExporter = new OTLPMetricExporter({ url: alertUrl });
    meterProvider.addMetricReader(
      new PeriodicExportingMetricReader({ exporter: otlpExporter }),
    );
  }
  metrics.setGlobalMeterProvider(meterProvider);

  sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  return sdk;
}

export async function shutdownTelemetry() {
  if (!sdk) return;

  await sdk.shutdown();
  await meterProvider?.shutdown();
  sdk = undefined;
  meterProvider = undefined;
}
