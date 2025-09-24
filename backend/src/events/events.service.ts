import { Inject, Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { metrics } from '@opentelemetry/api';
import { Producer } from 'kafkajs';
import { createKafkaProducer } from '../common/kafka';
import { EventName, EventSchemas, Events } from '@shared/events';
import type Redis from 'ioredis';

type FailedEvent = {
  [K in EventName]: { name: K; payload: Events[K] };
}[EventName];

@Injectable()
export class EventPublisher implements OnModuleDestroy {
  private readonly producer: Producer;
  private readonly logger = new Logger(EventPublisher.name);

  private readonly failedEventsKey = 'events:failed';
  private readonly fallbackFailedEvents: FailedEvent[] = [];

  private static readonly meter = metrics.getMeter('events');
  private static readonly publishFailures = EventPublisher.meter.createCounter(
    'event_publish_failures_total',
    {
      description: 'Number of events that failed to publish after retries',
    },
  );

  private failures = 0;
  private circuitOpenUntil = 0;

  constructor(
    config: ConfigService,
    producer = createKafkaProducer(config),
    @Optional() @Inject('REDIS_CLIENT') private readonly redis?: Redis,
  ) {
    this.producer = producer;
    if (!this.redis) {
      this.logger.warn(
        'Redis client not available; failed events will not persist across restarts.',
      );
    }
  }

  private serializeFailedEvent(event: FailedEvent): string {
    return JSON.stringify(event);
  }

  private deserializeFailedEvent(raw: string): FailedEvent | null {
    try {
      const parsed = JSON.parse(raw) as FailedEvent;
      if (parsed && parsed.name && parsed.payload !== undefined) {
        return parsed;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to parse stored event payload: ${message}`);
    }
    return null;
  }

  private async persistFailedEvent(event: FailedEvent): Promise<void> {
    if (this.redis) {
      const payload = this.serializeFailedEvent(event);
      try {
        await this.redis.rpush(this.failedEventsKey, payload);
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Failed to persist failed event to Redis: ${message}`,
        );
      }
    }
    this.fallbackFailedEvents.push(event);
  }

  private async removePersistedEvent(raw: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.lrem(this.failedEventsKey, 1, raw);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to remove replayed event from Redis: ${message}`,
      );
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
    await this.persistFailedEvent({ name, payload: data as any });
    throw new Error(
      `Failed to publish event ${name} after ${retries} attempts: ${message}`,
    );
  }

  async getFailedEvents(): Promise<FailedEvent[]> {
    if (!this.redis) {
      return [...this.fallbackFailedEvents];
    }
    try {
      const entries = await this.redis.lrange(this.failedEventsKey, 0, -1);
      const events: FailedEvent[] = [];
      for (const raw of entries) {
        const parsed = this.deserializeFailedEvent(raw);
        if (parsed) {
          events.push(parsed);
        } else {
          await this.removePersistedEvent(raw);
        }
      }
      return events;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to load failed events from Redis: ${message}`);
      return [];
    }
  }

  async replayFailed(): Promise<void> {
    if (this.redis) {
      let entries: string[];
      try {
        entries = await this.redis.lrange(this.failedEventsKey, 0, -1);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Failed to read failed events from Redis for replay: ${message}`,
        );
        return;
      }

      for (const raw of entries) {
        const event = this.deserializeFailedEvent(raw);
        if (!event) {
          await this.removePersistedEvent(raw);
          continue;
        }
        try {
          await this.emit(event.name, event.payload as any);
          await this.removePersistedEvent(raw);
        } catch {
          break;
        }
      }
      return;
    }

    for (const evt of [...this.fallbackFailedEvents]) {
      try {
        await this.emit(evt.name, evt.payload as any);
        const index = this.fallbackFailedEvents.indexOf(evt);
        if (index >= 0) this.fallbackFailedEvents.splice(index, 1);
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

