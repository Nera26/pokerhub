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
import { KafkajsInstrumentation } from '@opentelemetry/instrumentation-kafkajs';
import { SocketIoInstrumentation } from '@opentelemetry/instrumentation-socket.io';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';

export { telemetryMiddleware, shutdownTelemetry };

export function setupTelemetry(): Promise<void> {
  return setupSharedTelemetry({
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'pokerhub-api',
    meterName: 'backend',
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
    enableHttpMetrics: true,
  });
}
