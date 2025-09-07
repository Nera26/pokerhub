import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { metrics } from '@opentelemetry/api';
import { Kafka, Producer } from 'kafkajs';
import { EventName, EventSchemas, Events } from '@shared/events';

type FailedEvent = {
  [K in EventName]: { name: K; payload: Events[K] };
}[EventName];

@Injectable()
export class EventPublisher implements OnModuleDestroy {
  private readonly producer: Producer;
  private readonly logger = new Logger(EventPublisher.name);

  private static readonly meter = metrics.getMeter('events');
  private static readonly publishFailures = EventPublisher.meter.createCounter(
    'event_publish_failures_total',
    {
      description: 'Number of events that failed to publish after retries',
    },
  );

  private failures = 0;
  private circuitOpenUntil = 0;
  private readonly failedEvents: FailedEvent[] = [];

  constructor(config: ConfigService, producer?: Producer) {
    if (producer) {
      this.producer = producer;
    } else {
      const brokersConfig = config.get<string>('analytics.kafkaBrokers');
      const brokers = brokersConfig
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? [];
      if (brokers.length === 0) {
        throw new Error('Missing analytics.kafkaBrokers configuration');
      }

      const kafka = new Kafka({ brokers });
      this.producer = kafka.producer();
      void this.producer.connect();
    }
  }

  async emit<T extends EventName>(name: T, payload: Events[T]): Promise<void> {
    if (Date.now() < this.circuitOpenUntil) {
      throw new Error('Event publisher circuit breaker open');
    }

    const schema = EventSchemas[name];
    const data = schema.parse(payload);

    let lastError: unknown;
    const retries = 3;
    const backoff = 100;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.producer.send({
          topic: name,
          messages: [{ value: JSON.stringify(data) }],
        });
        this.failures = 0;
        return;
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, backoff * 2 ** (attempt - 1)));
        }
      }
    }

    this.failures += 1;
    if (this.failures >= 5) {
      this.circuitOpenUntil = Date.now() + 30_000; // 30s
      this.failures = 0;
    }

    EventPublisher.publishFailures.add(1);
    const message =
      lastError instanceof Error ? lastError.message : String(lastError);
    this.logger.error(`Failed to publish ${name}: ${message}`);
    this.failedEvents.push({ name, payload: data as any });
    throw new Error(
      `Failed to publish event ${name} after ${retries} attempts: ${message}`,
    );
  }

  getFailedEvents(): FailedEvent[] {
    return this.failedEvents;
  }

  async replayFailed(): Promise<void> {
    for (const evt of [...this.failedEvents]) {
      try {
        await this.emit(evt.name, evt.payload as any);
        const index = this.failedEvents.indexOf(evt);
        if (index >= 0) this.failedEvents.splice(index, 1);
      } catch {
        // stop replaying on first failure
        break;
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }
}

