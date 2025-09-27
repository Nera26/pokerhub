import {
  setupTelemetry as setupSharedTelemetry,
  shutdownTelemetry,
  telemetryMiddleware,
} from '@shared/telemetry';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { AmqplibInstrumentation } from '@opentelemetry/instrumentation-amqplib';
import { KafkaJsInstrumentation } from '@opentelemetry/instrumentation-kafkajs';
import { SocketIoInstrumentation } from '@opentelemetry/instrumentation-socket.io';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';

export { telemetryMiddleware, shutdownTelemetry };

export async function setupTelemetry(): Promise<void> {
  try {
    await setupSharedTelemetry({
      serviceName: process.env.OTEL_SERVICE_NAME ?? 'pokerhub-api',
      meterName: 'backend',
      instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new IORedisInstrumentation(),
        new PgInstrumentation(),
        new AmqplibInstrumentation(),
        new KafkaJsInstrumentation(),
        new SocketIoInstrumentation(),
        new PinoInstrumentation(),
        new NestInstrumentation(),
        new RuntimeNodeInstrumentation(),
      ],
      enableHttpMetrics: true,
    });
  } catch (err) {
    // OpenTelemetry metrics have breaking changes across versions. Rather than
    // crash the entire application when a local dev install mismatches the
    // prebuilt dist bundle, fall back to disabling telemetry.
    console.warn('Telemetry setup failed; continuing without instrumentation.', err);
  }
}
